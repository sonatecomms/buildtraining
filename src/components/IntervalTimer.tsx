"use client";

import { useEffect, useRef, useState } from "react";
import { formatClock } from "@/lib/rest";
import { beep, chime, buzz } from "@/lib/sound";
import { Button } from "./ui";

type Mode = "amrap" | "emom" | "interval" | "countdown" | "stopwatch";

const MODES: { id: Mode; label: string }[] = [
  { id: "amrap", label: "AMRAP" },
  { id: "emom", label: "EMOM" },
  { id: "interval", label: "Intervals" },
  { id: "countdown", label: "Countdown" },
  { id: "stopwatch", label: "Stopwatch" },
];

interface Seg {
  dur: number;
  round: number;
  kind: "work" | "rest" | "plain";
}

// Result a finished timer can hand back to be logged as "your own work".
export interface TimerResult {
  name: string;
  rounds?: number;
  seconds?: number;
}

export default function IntervalTimer({ onLog }: { onLog?: (r: TimerResult) => void }) {
  const [mode, setMode] = useState<Mode>("amrap");

  // per-mode config
  const [amrapMin, setAmrapMin] = useState(12);
  const [emomInt, setEmomInt] = useState(60);
  const [emomRounds, setEmomRounds] = useState(10);
  const [workSec, setWorkSec] = useState(20);
  const [restSec, setRestSec] = useState(10);
  const [intRounds, setIntRounds] = useState(8);
  const [cdMin, setCdMin] = useState(5);
  const [cdSec, setCdSec] = useState(0);

  const [phase, setPhase] = useState<"setup" | "run">("setup");
  const [segs, setSegs] = useState<Seg[]>([]);
  const [total, setTotal] = useState(0);
  const [countUp, setCountUp] = useState(false);
  const [hasRounds, setHasRounds] = useState(false);
  const [name, setName] = useState("");

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const [logged, setLogged] = useState(false);

  const prevIdx = useRef(0);
  const doneRef = useRef(false);

  const build = () => {
    const list: Seg[] = [];
    let nm = "";
    let up = false;
    let withRounds = false;
    if (mode === "amrap") {
      list.push({ dur: amrapMin * 60, round: 1, kind: "plain" });
      nm = `AMRAP ${formatClock(amrapMin * 60)}`;
      withRounds = true;
    } else if (mode === "emom") {
      for (let i = 0; i < emomRounds; i++) list.push({ dur: emomInt, round: i + 1, kind: "work" });
      nm = `EMOM ${formatClock(emomInt)} ×${emomRounds}`;
    } else if (mode === "interval") {
      for (let i = 0; i < intRounds; i++) {
        list.push({ dur: workSec, round: i + 1, kind: "work" });
        if (restSec > 0) list.push({ dur: restSec, round: i + 1, kind: "rest" });
      }
      nm = `Intervals ${workSec}/${restSec} ×${intRounds}`;
    } else if (mode === "countdown") {
      const t = cdMin * 60 + cdSec;
      list.push({ dur: t, round: 1, kind: "plain" });
      nm = `Countdown ${formatClock(t)}`;
    } else {
      up = true;
      nm = "Stopwatch";
    }
    setSegs(list);
    setTotal(list.reduce((n, s) => n + s.dur, 0));
    setCountUp(up);
    setHasRounds(withRounds);
    setName(nm);
    setElapsed(0);
    setRounds(0);
    setRunning(true);
    setLogged(false);
    prevIdx.current = 0;
    doneRef.current = false;
    setPhase("run");
  };

  // locate the current segment for segment-based modes
  const locate = () => {
    let acc = 0;
    for (let i = 0; i < segs.length; i++) {
      if (elapsed < acc + segs[i].dur) {
        return { idx: i, seg: segs[i], segRemaining: acc + segs[i].dur - elapsed };
      }
      acc += segs[i].dur;
    }
    const last = segs[segs.length - 1];
    return { idx: segs.length - 1, seg: last, segRemaining: 0 };
  };

  const finished = !countUp && total > 0 && elapsed >= total;

  useEffect(() => {
    if (phase !== "run" || !running) return;
    if (finished) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (!countUp) {
          // segment boundary → beep
          let acc = 0;
          let idx = segs.length - 1;
          for (let i = 0; i < segs.length; i++) {
            if (next < acc + segs[i].dur) {
              idx = i;
              break;
            }
            acc += segs[i].dur;
          }
          if (next < total && idx > prevIdx.current) {
            prevIdx.current = idx;
            beep();
            buzz(50);
          }
          return next >= total ? total : next;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, running, finished, countUp, segs, total]);

  // finish cue once
  useEffect(() => {
    if (!finished || doneRef.current) return;
    doneRef.current = true;
    setRunning(false);
    chime();
    buzz([120, 60, 120]);
  }, [finished]);

  const reset = () => {
    setPhase("setup");
    setRunning(false);
    setElapsed(0);
    setRounds(0);
    setLogged(false);
    prevIdx.current = 0;
    doneRef.current = false;
  };

  const log = () => {
    if (!onLog) return;
    const r: TimerResult = { name };
    if (mode === "amrap") r.rounds = rounds;
    else if (mode === "emom") r.rounds = emomRounds;
    else if (mode === "interval") r.rounds = intRounds;
    if (mode === "countdown") r.seconds = total;
    if (mode === "stopwatch") r.seconds = elapsed;
    onLog(r);
    setLogged(true);
  };

  // ---------- setup ----------
  if (phase === "setup") {
    const modeBtn = (m: (typeof MODES)[number]) => (
      <button
        key={m.id}
        onClick={() => setMode(m.id)}
        className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
          mode === m.id ? "bg-forest text-bone" : "bg-surface border border-line text-slate"
        }`}
      >
        {m.label}
      </button>
    );
    return (
      <div className="space-y-4">
        {/* a tidy grid instead of a sideways-scrolling pill strip: workout
            timers on top, the two utility timers below */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">{MODES.slice(0, 3).map(modeBtn)}</div>
          <div className="grid grid-cols-2 gap-2">{MODES.slice(3).map(modeBtn)}</div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
          {mode === "amrap" && (
            <>
              <p className="text-sm text-slate">As many rounds as possible within the cap.</p>
              <NumRow label="Time cap (min)" value={amrapMin} set={setAmrapMin} min={1} />
            </>
          )}
          {mode === "emom" && (
            <>
              <p className="text-sm text-slate">A chime every interval, for N rounds.</p>
              <NumRow label="Interval (sec)" value={emomInt} set={setEmomInt} min={5} step={5} />
              <NumRow label="Rounds" value={emomRounds} set={setEmomRounds} min={1} />
            </>
          )}
          {mode === "interval" && (
            <>
              <p className="text-sm text-slate">Work / rest, repeated. Covers Tabata & any ratio.</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Tabata 20/10×8", w: 20, r: 10, n: 8 },
                  { label: "30/30×10", w: 30, r: 30, n: 10 },
                  { label: "40/20×8", w: 40, r: 20, n: 8 },
                  { label: "1:1 60/60×5", w: 60, r: 60, n: 5 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setWorkSec(p.w);
                      setRestSec(p.r);
                      setIntRounds(p.n);
                    }}
                    className="text-xs font-medium rounded-full border border-line bg-field px-2.5 py-1 text-slate"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <NumRow label="Work (sec)" value={workSec} set={setWorkSec} min={1} step={5} />
              <NumRow label="Rest (sec)" value={restSec} set={setRestSec} min={0} step={5} />
              <NumRow label="Rounds" value={intRounds} set={setIntRounds} min={1} />
            </>
          )}
          {mode === "countdown" && (
            <>
              <p className="text-sm text-slate">Counts down and chimes at zero.</p>
              <div className="flex gap-3">
                <NumRow label="Min" value={cdMin} set={setCdMin} min={0} className="flex-1" />
                <NumRow label="Sec" value={cdSec} set={setCdSec} min={0} max={59} step={5} className="flex-1" />
              </div>
            </>
          )}
          {mode === "stopwatch" && (
            <p className="text-sm text-slate">A simple count-up clock. Start, pause, reset.</p>
          )}
        </div>

        <Button className="w-full" onClick={build}>
          Start {MODES.find((m) => m.id === mode)?.label}
        </Button>
      </div>
    );
  }

  // ---------- running ----------
  const loc = countUp ? null : locate();
  const big = countUp
    ? elapsed
    : mode === "amrap" || mode === "countdown"
      ? Math.max(0, total - elapsed)
      : loc!.segRemaining;
  const seg = loc?.seg;
  const pct = countUp || total === 0 ? 0 : Math.min(100, (elapsed / total) * 100);

  const phaseLabel = finished
    ? "Done"
    : countUp
      ? "Stopwatch"
      : mode === "amrap"
        ? "AMRAP — time left"
        : mode === "countdown"
          ? "Time left"
          : mode === "emom"
            ? `Minute ${seg?.round} of ${emomRounds}`
            : seg?.kind === "rest"
              ? `Rest — round ${seg?.round} of ${intRounds}`
              : `Work — round ${seg?.round} of ${intRounds}`;

  const accent = finished
    ? "bg-green"
    : seg?.kind === "rest"
      ? "bg-sky"
      : "bg-forest";

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate">{name}</p>
      </div>

      <div className="rounded-3xl border border-line bg-surface p-6">
        <div className="h-1.5 rounded-full bg-line overflow-hidden mb-5">
          <div className={`h-full transition-all duration-1000 ease-linear ${accent}`} style={{ width: `${pct}%` }} />
        </div>
        <p className={`text-center text-sm font-semibold ${seg?.kind === "rest" ? "text-sky" : "text-slate"}`}>
          {phaseLabel}
        </p>
        <p className="text-center font-display text-7xl tabular-nums leading-none my-3">{formatClock(big)}</p>
        {!countUp && mode !== "amrap" && mode !== "countdown" && !finished && (
          <p className="text-center text-sm text-slate">{formatClock(Math.max(0, total - elapsed))} total left</p>
        )}

        {hasRounds && (
          <div className="flex items-center justify-center gap-5 mt-5">
            <button
              onClick={() => setRounds((n) => Math.max(0, n - 1))}
              className="w-11 h-11 rounded-full bg-field border border-line grid place-items-center text-2xl leading-none"
              aria-label="One fewer round"
            >
              −
            </button>
            <div className="text-center">
              <span className="block font-display text-4xl tabular-nums leading-none">{rounds}</span>
              <span className="text-[10px] uppercase tracking-wide text-slate">rounds</span>
            </div>
            <button
              onClick={() => setRounds((n) => n + 1)}
              className="w-11 h-11 rounded-full bg-forest text-bone grid place-items-center text-2xl leading-none"
              aria-label="One more round"
            >
              +
            </button>
          </div>
        )}
      </div>

      {finished ? (
        <div className="space-y-2">
          {onLog &&
            (logged ? (
              <div className="text-center text-sm text-forest font-semibold py-2">Logged to your activity ✓</div>
            ) : (
              <Button className="w-full" onClick={log}>
                Log this to my activity
              </Button>
            ))}
          <Button variant="outline" className="w-full" onClick={reset}>
            New timer
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={reset}>
            Reset
          </Button>
          <Button className="flex-1" onClick={() => setRunning((r) => !r)}>
            {running ? "Pause" : "Resume"}
          </Button>
        </div>
      )}
    </div>
  );
}

function NumRow({
  label,
  value,
  set,
  min = 0,
  max,
  step = 1,
  className = "",
}: {
  label: string;
  value: number;
  set: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  const clamp = (n: number) => Math.max(min, max != null ? Math.min(max, n) : n);
  return (
    <label className={`flex items-center justify-between gap-3 ${className}`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="flex items-center gap-2">
        <button
          onClick={() => set(clamp(value - step))}
          className="w-8 h-8 rounded-full bg-field border border-line grid place-items-center text-lg leading-none"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => set(clamp(+e.target.value || 0))}
          className="w-14 rounded-lg bg-field border border-line px-2 py-1.5 text-center text-sm outline-none focus:border-forest"
        />
        <button
          onClick={() => set(clamp(value + step))}
          className="w-8 h-8 rounded-full bg-forest text-bone grid place-items-center text-lg leading-none"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </span>
    </label>
  );
}
