"use client";

import { useEffect, useRef, useState } from "react";
import {
  computeStreak,
  logWorkout,
  uid,
  useExercises,
  useLogsForClient,
  useProgramForClient,
} from "@/lib/store";
import { flushPush } from "@/lib/sync";
import type { Client, Exercise, ItemResult, ProgramItem, Workout, WorkoutLog } from "@/lib/types";
import { youtubeId } from "@/lib/youtube";
import { runPace, speedMph } from "@/lib/activities";
import { parseRest, formatClock } from "@/lib/rest";
import { pushRecent } from "@/lib/recents";
import { DOW_LONG, isoDate, todayDow, weekDates, relativeDate } from "@/lib/week";
import { Button, Card, Pill, Skeleton } from "./ui";
import StreakHeader from "./StreakHeader";
import WeekStrip from "./WeekStrip";
import VideoModal from "./VideoModal";
import ExercisePickerModal from "./ExercisePickerModal";

const BLOCK_LABEL = { single: "", superset: "Superset", circuit: "Circuit", note: "Note" } as const;

export const FEELINGS = ["😣", "😕", "😐", "🙂", "😄"]; // 1..5

export default function TrainView({ client }: { client: Client }) {
  const program = useProgramForClient(client.id);
  const logs = useLogsForClient(client.id);
  const exercises = useExercises();
  const byId = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const streak = computeStreak(logs, client.intendedFrequency);

  const [day, setDay] = useState<number>(todayDow());
  const [running, setRunning] = useState<Workout | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, ItemResult>>({});
  // movements the athlete adds beyond the program: { id, exerciseId }
  const [extras, setExtras] = useState<{ id: string; exerciseId: string }[]>([]);
  const [picking, setPicking] = useState(false);
  const [celebrate, setCelebrate] = useState<{ title: string; sub: string } | null>(null);
  // active rest countdown (one at a time); bumping `key` restarts the timer.
  const [rest, setRest] = useState<{ seconds: number; label: string; key: number } | null>(null);
  const startRest = (seconds: number, label: string) =>
    setRest((r) => ({ seconds, label, key: (r?.key ?? 0) + 1 }));
  // gate the overview on mount so we never flash the SSR seed/empty data before
  // the real (localStorage / cloud-pulled) program + logs are in hand
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const workouts = program?.workouts ?? [];
  const marked = new Set(workouts.map((w) => w.dow));
  const dayWorkouts = workouts.filter((w) => w.dow === day);
  const selectedDate = isoDate(weekDates()[day]);
  const logByWorkout = Object.fromEntries(
    logs.filter((l) => l.date === selectedDate).map((l) => [l.workoutId, l]),
  );

  // Start fresh, or re-open a completed session pre-filled with what was logged.
  const start = (w: Workout, existing?: WorkoutLog) => {
    setRunning(w);
    setPicking(false);
    setDone(new Set(existing?.completedItemIds ?? []));
    const r: Record<string, ItemResult> = {};
    for (const e of existing?.entries ?? []) r[e.itemId] = e;
    setResults(r);
    // rebuild athlete-added movements: any logged entry not in the program
    const programIds = new Set(w.blocks.flatMap((b) => b.items.map((i) => i.id)));
    setExtras(
      (existing?.entries ?? [])
        .filter((e) => e.exerciseId && (e.extra || !programIds.has(e.itemId)))
        .map((e) => ({ id: e.itemId, exerciseId: e.exerciseId! })),
    );
  };

  const updateResult = (itemId: string, patch: Partial<ItemResult>) => {
    setResults((r) => ({ ...r, [itemId]: { ...r[itemId], itemId, ...patch } }));
    // logging real data implicitly checks the movement off — so an athlete who
    // fills in their sets never has to remember to also tap the circle.
    const meaningful =
      patch.weight || patch.setsDone || patch.repsDone || patch.duration || patch.distance || patch.intensity || patch.feeling || patch.note;
    if (meaningful) setDone((d) => (d.has(itemId) ? d : new Set(d).add(itemId)));
  };

  const addExtra = (ex: Exercise) =>
    setExtras((xs) => [...xs, { id: uid("x"), exerciseId: ex.id }]);
  const removeExtra = (id: string) => {
    setExtras((xs) => xs.filter((x) => x.id !== id));
    setResults((r) => {
      const next = { ...r };
      delete next[id];
      return next;
    });
    setDone((d) => {
      const next = new Set(d);
      next.delete(id);
      return next;
    });
  };

  // AMRAP/EMOM rounds are a block-level result, keyed by the block id (not an
  // item, so it stays out of the per-movement checklist / progress bar).
  const setRounds = (blockId: string, n: number) =>
    setResults((r) => ({ ...r, [blockId]: { ...r[blockId], itemId: blockId, rounds: Math.max(0, n) } }));

  const totalItems = running
    ? running.blocks.reduce((n, b) => n + (b.type === "note" ? 0 : b.items.length), 0) + extras.length
    : 0;

  const finish = () => {
    if (!running) return;
    // map each logged item back to its exercise so PRs survive program edits
    const exOf: Record<string, string> = {};
    running.blocks.forEach((b) => b.items.forEach((it) => (exOf[it.id] = it.exerciseId)));
    const extraIds = new Set(extras.map((x) => x.id));
    extras.forEach((x) => (exOf[x.id] = x.exerciseId));
    // keep only results that actually carry data
    const entries = Object.values(results)
      .filter((e) => e.weight || e.setsDone || e.repsDone || e.duration || e.distance || e.intensity || e.feeling || e.note || e.rounds)
      .map((e) => ({ ...e, exerciseId: exOf[e.itemId], extra: extraIds.has(e.itemId) || undefined }));
    const allDone = totalItems > 0 && done.size >= totalItems;
    logWorkout({
      clientId: client.id,
      workoutId: running.id,
      workoutName: running.name,
      date: selectedDate,
      completedItemIds: [...done],
      entries,
    });
    void flushPush(); // persist the session to the cloud right away
    // project the streak with this session included so the toast isn't one behind
    const projected = logs.some((l) => l.date === selectedDate)
      ? logs
      : [{ id: "_proj", clientId: client.id, workoutId: running.id, workoutName: running.name, date: selectedDate, completedItemIds: [] } as WorkoutLog, ...logs];
    const n = computeStreak(projected, client.intendedFrequency).current;
    const milestone = n > 0 && n % 7 === 0;
    setRunning(null);
    setCelebrate({
      title: allDone ? "Workout complete! 💪" : "Logged! 🔥",
      sub: milestone ? `🔥 ${n}-day streak — keep it rolling!` : `Streak: ${n} day${n === 1 ? "" : "s"}`,
    });
    setTimeout(() => setCelebrate(null), 2600);
  };

  // ---- workout runner ----
  if (running) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{running.name}</h2>
          <button onClick={() => setRunning(null)} className="text-slate text-sm">Exit</button>
        </div>
        <div className="h-1.5 rounded-full bg-line overflow-hidden">
          <div className="h-full bg-forest transition-all" style={{ width: `${totalItems ? (done.size / totalItems) * 100 : 0}%` }} />
        </div>

        {running.blocks.map((block) => {
          if (block.type === "note") {
            return (
              <Card key={block.id} className="p-3 border-sky/40 bg-sky/5">
                {block.title && <p className="font-semibold text-sm mb-1">{block.title}</p>}
                {block.text && <p className="text-sm whitespace-pre-wrap text-ink/90">{block.text}</p>}
              </Card>
            );
          }
          const mode = block.type === "circuit" ? block.mode ?? "rounds" : undefined;
          const timed = mode === "amrap" || mode === "emom";
          return (
            <Card key={block.id} className="p-3">
              {block.type !== "single" && (
                <Pill tone={block.type === "circuit" ? "brick" : "sky"} className="mb-2">
                  {timed
                    ? mode === "amrap"
                      ? `AMRAP ${formatClock(block.capSec ?? 1200)}`
                      : `EMOM ${formatClock(block.intervalSec ?? 60)} ×${block.rounds ?? 10}`
                    : `${BLOCK_LABEL[block.type]}${block.type === "circuit" && block.rounds ? ` ×${block.rounds}` : ""}`}
                </Pill>
              )}
              {timed && (
                <ConditioningTimer
                  mode={mode === "amrap" ? "amrap" : "emom"}
                  capSec={block.capSec ?? 1200}
                  intervalSec={block.intervalSec ?? 60}
                  totalRounds={block.rounds ?? 10}
                  rounds={results[block.id]?.rounds ?? 0}
                  onRounds={(n) => setRounds(block.id, n)}
                />
              )}
              <div className="space-y-2">
                {block.items.map((it) => (
                  <RunnerItem
                    key={it.id}
                    item={it}
                    ex={byId[it.exerciseId]}
                    checked={done.has(it.id)}
                    result={results[it.id]}
                    onToggle={() =>
                      setDone((prev) => {
                        const next = new Set(prev);
                        next.has(it.id) ? next.delete(it.id) : next.add(it.id);
                        return next;
                      })
                    }
                    onChange={(patch) => updateResult(it.id, patch)}
                    onRest={startRest}
                  />
                ))}
              </div>
            </Card>
          );
        })}

        {/* athlete-added movements, beyond the program */}
        {extras.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate mb-2">Added by you</p>
            <div className="space-y-2">
              {extras.map((x) => (
                <RunnerItem
                  key={x.id}
                  item={{ id: x.id, exerciseId: x.exerciseId, sets: 3, reps: "", rest: "" }}
                  ex={byId[x.exerciseId]}
                  checked={done.has(x.id)}
                  result={results[x.id]}
                  isExtra
                  onRemove={() => removeExtra(x.id)}
                  onToggle={() =>
                    setDone((prev) => {
                      const next = new Set(prev);
                      next.has(x.id) ? next.delete(x.id) : next.add(x.id);
                      return next;
                    })
                  }
                  onChange={(patch) => updateResult(x.id, patch)}
                />
              ))}
            </div>
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={() => setPicking(true)}>
          + Add an extra movement
        </Button>

        <Button className="w-full" onClick={finish}>
          {totalItems > 0 && done.size >= totalItems ? (
            "Finish workout ✓"
          ) : (
            <span className="flex flex-col leading-tight">
              <span>Finish workout</span>
              {totalItems > 0 && (
                <span className="text-xs font-normal opacity-80">{totalItems - done.size} not checked off</span>
              )}
            </span>
          )}
        </Button>

        {picking && (
          <ExercisePickerModal
            title="Log a movement or activity"
            onClose={() => setPicking(false)}
            onPick={(ex) => {
              pushRecent(ex.id);
              addExtra(ex);
            }}
          />
        )}

        {rest && (
          <RestTimer
            key={rest.key}
            seconds={rest.seconds}
            label={rest.label}
            onClose={() => setRest(null)}
          />
        )}
      </div>
    );
  }

  // ---- overview ----
  return (
    <div className="space-y-5">
      {celebrate && (
        <button
          onClick={() => setCelebrate(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/10"
          aria-label="Dismiss"
        >
          <div className="animate-pop text-center bg-surface border border-green/40 rounded-2xl px-8 py-6 shadow-[0_12px_40px_-8px_rgba(25,53,12,0.35)]">
            <div className="text-5xl animate-flame">🎉</div>
            <p className="font-bold text-lg mt-2">{celebrate.title}</p>
            <p className="text-slate text-sm">{celebrate.sub}</p>
          </div>
        </button>
      )}

      <WeekStrip selected={day} onSelect={setDay} marked={marked} />

      <div>
        <p className="text-sm font-semibold text-slate mb-2">{DOW_LONG[day]}</p>
        <div className="space-y-2">
          {!ready && (
            <>
              <Skeleton className="h-[68px] rounded-2xl" />
              <Skeleton className="h-[68px] rounded-2xl" />
            </>
          )}
          {ready && dayWorkouts.length === 0 && (() => {
            // find the next scheduled day so a rest day still answers "what's next?"
            const nextDow = marked.size
              ? Array.from({ length: 7 }, (_, i) => (day + 1 + i) % 7).find((d) => marked.has(d))
              : undefined;
            return (
              <Card className="p-6 text-center">
                <div className="text-3xl mb-1">🧘</div>
                <p className="font-semibold">Rest day</p>
                <p className="text-slate text-sm">Recover, or log your own work below.</p>
                {nextDow != null && (
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setDay(nextDow)}>
                    Next: {DOW_LONG[nextDow]} →
                  </Button>
                )}
              </Card>
            );
          })()}
          {ready && dayWorkouts.map((w) => {
            const count = w.blocks.reduce((n, b) => n + b.items.length, 0);
            const logged = logByWorkout[w.id];
            return (
              <Card key={w.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{w.name}</p>
                  <p className="text-xs text-slate">
                    {logged ? "✓ Completed — tap to review or revise" : `${count} movements`}
                  </p>
                </div>
                {logged ? (
                  <Button size="sm" variant="outline" onClick={() => start(w, logged)}>
                    View / edit
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => start(w)}>Start</Button>
                )}
              </Card>
            );
          })}

          {/* log your own session, any day */}
          {ready && (() => {
            const extraId = `extra-${selectedDate}`;
            const extraLog = logByWorkout[extraId];
            const extraWorkout: Workout = { id: extraId, name: "Your own work", dow: day, blocks: [] };
            return (
              <Card className="p-4 flex items-center gap-3 border-dashed">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">Your own work</p>
                  <p className="text-xs text-slate">
                    {extraLog ? "✓ Logged — tap to review or add more" : "Log a run, walk, yoga, lift — anything, on or off plan"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={extraLog ? "outline" : "primary"}
                  onClick={() => start(extraWorkout, extraLog)}
                >
                  {extraLog ? "View / edit" : "+ Log"}
                </Button>
              </Card>
            );
          })()}
        </div>
      </div>

      {ready ? <StreakHeader streak={streak} /> : <Skeleton className="h-24 rounded-2xl" />}

      <div>
        <h3 className="font-semibold mb-2">Recent activity</h3>
        {!ready ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-slate text-sm">No sessions logged yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 8).map((l) => {
              const count = l.entries?.length ?? 0;
              const feeling = l.entries?.find((e) => e.feeling)?.feeling;
              return (
                <div key={l.id} className="flex items-center gap-3 text-sm">
                  <span>{feeling ? FEELINGS[feeling - 1] : "✅"}</span>
                  <span className="flex-1 truncate">{l.workoutName}</span>
                  <span className="text-slate text-xs shrink-0">
                    {count > 0 ? `${count} logged · ` : ""}{relativeDate(l.date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// A single movement in the workout runner: check it off and log what you did
// (weight, sets/reps completed, a 1–5 feeling, and a note).
function RunnerItem({
  item,
  ex,
  checked,
  result,
  onToggle,
  onChange,
  onRest,
  isExtra,
  onRemove,
}: {
  item: ProgramItem;
  ex?: Exercise;
  checked: boolean;
  result?: ItemResult;
  onToggle: () => void;
  onChange: (patch: Partial<ItemResult>) => void;
  onRest?: (seconds: number, label: string) => void;
  isExtra?: boolean;
  onRemove?: () => void;
}) {
  const url = item.youtubeUrl ?? ex?.youtubeUrl;
  const r = result ?? ({} as ItemResult);
  const bodyweight = ex?.equipment === "Bodyweight"; // coach-denoted → no weight field
  const activity = ex?.activity; // run/walk/yoga… → log duration + distance, not load
  // coach's rest, if it parses to a real duration → offer a countdown (not for cardio)
  const restSeconds = activity ? null : parseRest(item.rest);
  // live speed readout: mph for cycling, pace (min/mi) for everything else
  const speedLabel = ex?.speedUnit === "mph" ? "Speed" : "Pace";
  const speed = activity
    ? ex?.speedUnit === "mph"
      ? speedMph(r.duration, r.distance)
      : runPace(r.duration, r.distance)
    : null;
  // Collapse by default so the runner reads as a scannable checklist instead of a
  // wall of inputs; auto-open extras (just added) and anything already logged.
  const hasData = !!(r.weight || r.setsDone || r.repsDone || r.duration || r.distance || r.intensity || r.feeling || r.note);
  const [open, setOpen] = useState<boolean>(isExtra || hasData);
  const [playing, setPlaying] = useState(false);

  return (
    <div className={`rounded-xl border p-2.5 ${checked ? "border-forest bg-green/10" : "border-line bg-field"}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className={`w-6 h-6 rounded-full border-2 grid place-items-center text-xs shrink-0 ${
            checked ? "bg-forest border-forest text-bone" : "border-slate"
          }`}
        >
          {checked ? "✓" : ""}
        </button>
        <button onClick={() => setOpen((o) => !o)} className="flex-1 min-w-0 text-left">
          <span className={`block font-medium text-sm truncate ${checked ? "line-through text-slate" : ""}`}>
            {ex?.name}
            {item.variant && <span className="text-forest"> · {item.variant}</span>}
          </span>
          <span className="text-xs text-slate">
            {activity ? (
              "log your time & distance"
            ) : isExtra ? (
              "your own movement"
            ) : (
              <>
                {item.sets} × {item.reps}
                {item.rest ? ` · ${item.rest} rest` : ""}
              </>
            )}
          </span>
        </button>
        {youtubeId(url) && (
          <button onClick={() => setPlaying(true)} className="text-sky text-xs shrink-0" aria-label="Play demo">▶</button>
        )}
        {isExtra && onRemove ? (
          <button onClick={onRemove} className="text-slate hover:text-brick text-sm shrink-0" aria-label="Remove">✕</button>
        ) : (
          <button onClick={() => setOpen((o) => !o)} className="text-slate text-xs shrink-0 font-medium">
            {open ? "▲" : "＋ log"}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-2.5 space-y-2.5">
          {activity ? (
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-2">
                <LogField label="Duration" value={r.duration} placeholder="30 min" onChange={(v) => onChange({ duration: v })} />
                {ex?.intensity ? (
                  <LogField label="Intensity" value={r.intensity} placeholder="Easy / Hard" onChange={(v) => onChange({ intensity: v })} />
                ) : (
                  <LogField label="Distance" value={r.distance} placeholder="3 mi" onChange={(v) => onChange({ distance: v })} />
                )}
              </div>
              {speed && (
                <p className="text-xs text-slate text-right">
                  {speedLabel} <span className="font-semibold text-forest">{speed}</span>
                </p>
              )}
            </div>
          ) : (
            <div className={`grid ${bodyweight ? "grid-cols-2" : "grid-cols-3"} gap-2`}>
              {!bodyweight && (
                <LogField label="Weight" value={r.weight} placeholder="lbs" onChange={(v) => onChange({ weight: v })} />
              )}
              <LogField label="Sets" value={r.setsDone} placeholder={String(item.sets)} onChange={(v) => onChange({ setsDone: v })} />
              <LogField label="Reps" value={r.repsDone} placeholder={item.reps} onChange={(v) => onChange({ repsDone: v })} />
            </div>
          )}
          {restSeconds != null && onRest && (
            <button
              onClick={() => onRest(restSeconds, ex?.name ?? "Rest")}
              className="w-full rounded-lg border border-line bg-surface py-1.5 text-sm font-medium text-forest flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
            >
              ⏱ Start {item.rest} rest
            </button>
          )}
          <div>
            <span className="text-[10px] uppercase tracking-wide text-slate">How it felt (effort)</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-slate shrink-0">Brutal</span>
              {FEELINGS.map((f, i) => {
                const val = i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => onChange({ feeling: r.feeling === val ? undefined : val })}
                    className={`text-xl rounded-lg px-1.5 py-0.5 transition-all ${
                      r.feeling === val ? "bg-green/10 ring-1 ring-forest scale-110" : "opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`Felt ${val} of 5`}
                  >
                    {f}
                  </button>
                );
              })}
              <span className="text-[10px] text-slate shrink-0">Great</span>
            </div>
          </div>
          <textarea
            value={r.note ?? ""}
            onChange={(e) => onChange({ note: e.target.value })}
            placeholder="Notes — how it went, tweaks, PRs…"
            rows={2}
            className="w-full rounded-lg bg-surface border border-line px-2.5 py-1.5 text-sm outline-none focus:border-forest resize-y"
          />
        </div>
      )}

      {playing && <VideoModal url={url} title={ex?.name} onClose={() => setPlaying(false)} />}
    </div>
  );
}

function LogField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[10px] uppercase tracking-wide text-slate">{label}</span>
      <input
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 mt-0.5 rounded-lg bg-surface border border-line px-2 py-1.5 text-sm outline-none focus:border-forest"
      />
    </label>
  );
}

// Floating rest countdown — one at a time, triggered from a movement's "Start
// rest" button. Sits above the bottom nav; chimes + buzzes when time's up, and
// can be paused or nudged ±15s.
function RestTimer({
  seconds,
  label,
  onClose,
}: {
  seconds: number;
  label: string;
  onClose: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const chimed = useRef(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setRemaining((t) => (t <= 0 ? 0 : t - 1)), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const finished = remaining <= 0;

  // chime + buzz once when it hits zero, then auto-dismiss
  useEffect(() => {
    if (!finished || chimed.current) return;
    chimed.current = true;
    try {
      navigator.vibrate?.([120, 60, 120]);
    } catch {}
    chime();
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [finished, onClose]);

  const adjust = (delta: number) => {
    if (delta > 0) chimed.current = false; // adding time re-arms the chime
    setRemaining((t) => Math.max(0, t + delta));
  };

  const pct = seconds > 0 ? Math.min(100, (remaining / seconds) * 100) : 0;

  return (
    <div
      className="fixed inset-x-0 bottom-20 z-40 px-4 pointer-events-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-2xl mx-auto pointer-events-auto rounded-2xl border border-line bg-surface overflow-hidden shadow-[0_12px_40px_-8px_rgba(25,53,12,0.35)]">
        <div className="h-1 bg-line">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${finished ? "bg-green" : "bg-forest"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wide text-slate">{finished ? "Rest done" : "Resting"}</p>
            <p className="text-sm font-medium truncate">{label}</p>
          </div>
          {finished ? (
            <span className="text-2xl mr-1">💪</span>
          ) : (
            <>
              <button onClick={() => adjust(-15)} className="text-xs font-semibold text-slate px-1.5 py-1">−15</button>
              <span className="font-display text-2xl tabular-nums w-16 text-center leading-none">{formatClock(remaining)}</span>
              <button onClick={() => adjust(15)} className="text-xs font-semibold text-slate px-1.5 py-1">+15</button>
              <button
                onClick={() => setPaused((p) => !p)}
                className="w-9 h-9 rounded-full bg-field grid place-items-center text-sm"
                aria-label={paused ? "Resume rest" : "Pause rest"}
              >
                {paused ? "▶" : "⏸"}
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-field grid place-items-center text-slate"
            aria-label="Dismiss timer"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// In-runner conditioning timer for AMRAP / EMOM circuits, with a rounds-completed
// counter the athlete taps. AMRAP counts down from the cap; EMOM chimes every
// interval, auto-advances the minute, and bumps the round count as it goes.
function ConditioningTimer({
  mode,
  capSec,
  intervalSec,
  totalRounds,
  rounds,
  onRounds,
}: {
  mode: "amrap" | "emom";
  capSec: number;
  intervalSec: number;
  totalRounds: number;
  rounds: number;
  onRounds: (n: number) => void;
}) {
  const total = mode === "amrap" ? capSec : intervalSec * totalRounds;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const roundsRef = useRef(rounds);
  const onRoundsRef = useRef(onRounds);
  const prevInterval = useRef(0);
  const doneRef = useRef(false);
  // keep the latest rounds / callback reachable from the interval without making
  // them effect deps (which would tear down the timer on every tick)
  useEffect(() => {
    roundsRef.current = rounds;
    onRoundsRef.current = onRounds;
  });

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        // EMOM: chime + auto-advance the round at each interval boundary
        if (mode === "emom" && next < total) {
          const iv = Math.floor(next / intervalSec);
          if (iv > prevInterval.current) {
            prevInterval.current = iv;
            chime();
            try {
              navigator.vibrate?.(60);
            } catch {}
            onRoundsRef.current(Math.min(totalRounds, roundsRef.current + 1));
          }
        }
        return next >= total ? total : next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode, intervalSec, total, totalRounds]);

  const finished = elapsed >= total;
  useEffect(() => {
    if (!finished || doneRef.current) return;
    doneRef.current = true;
    setRunning(false);
    try {
      navigator.vibrate?.([120, 60, 120]);
    } catch {}
    chime();
  }, [finished]);

  const reset = () => {
    setElapsed(0);
    setRunning(false);
    prevInterval.current = 0;
    doneRef.current = false;
  };

  const remaining = Math.max(0, total - elapsed);
  const withinLeft = intervalSec - (elapsed % intervalSec || 0);
  const minute = Math.min(totalRounds, Math.floor(elapsed / intervalSec) + 1);
  const pct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;
  const big = mode === "amrap" ? remaining : finished ? 0 : withinLeft;

  return (
    <div className="rounded-xl border border-line bg-field/50 p-3 mb-3">
      <div className="h-1 rounded-full bg-line overflow-hidden mb-2.5">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${finished ? "bg-green" : "bg-forest"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide text-slate">
            {finished
              ? "Time!"
              : mode === "amrap"
                ? "AMRAP — time left"
                : `EMOM — minute ${minute} of ${totalRounds}`}
          </p>
          <p className="font-display text-3xl tabular-nums leading-none mt-0.5">{formatClock(big)}</p>
          {mode === "emom" && !finished && (
            <p className="text-[11px] text-slate mt-0.5">{formatClock(remaining)} total left</p>
          )}
        </div>
        <button
          onClick={() => (finished ? reset() : setRunning((r) => !r))}
          className="w-12 h-12 rounded-full bg-forest text-bone grid place-items-center text-lg shrink-0"
          aria-label={finished ? "Reset" : running ? "Pause" : "Start"}
        >
          {finished ? "↻" : running ? "⏸" : "▶"}
        </button>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
        <span className="text-xs font-medium text-slate">Rounds done</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onRounds(Math.max(0, rounds - 1))}
            className="w-8 h-8 rounded-full bg-surface border border-line grid place-items-center text-lg leading-none"
            aria-label="One fewer round"
          >
            −
          </button>
          <span className="font-display text-2xl tabular-nums w-8 text-center">{rounds}</span>
          <button
            onClick={() => onRounds(rounds + 1)}
            className="w-8 h-8 rounded-full bg-forest text-bone grid place-items-center text-lg leading-none"
            aria-label="One more round"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

// Short two-tone chime via WebAudio; silent if unsupported or blocked.
function chime() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    setTimeout(() => void ctx.close(), 1200);
  } catch {}
}
