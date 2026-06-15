"use client";

// Direction B — "Editorial Strength": type-forward, high-contrast, mostly flat.
// Oversized League Spartan uppercase headers, hairline rules, tracked-out caps
// labels, hero numbers, forest used like ink, minimal color. Thin line icons.

import { sample, FEELINGS, NAV } from "./sample";
import { ICONS } from "./icons";

const label = "text-[10px] font-semibold uppercase tracking-[0.18em] text-slate";
const rule = "border-t border-ink/15";

function Cap({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 mt-9 mb-2.5">{children}</p>;
}

export default function DirectionEditorial() {
  const { workout: w, movement: m, metcon, pr, numbers, coachAthlete: ca } = sample;
  const pct = Math.round((w.done / w.count) * 100);

  return (
    <div className="bg-[#e7e9df] px-5 pb-12">
      {/* 1 — Train header + streak */}
      <Cap>Train · home</Cap>
      <p className={label}>{sample.day} — {sample.dateLabel}</p>
      <h1 className="font-display text-[34px] leading-[0.95] uppercase mt-2">
        Back to<br />work, {sample.athleteFirst}.
      </h1>
      <div className={`${rule} mt-5 pt-4 flex`}>
        <div className="flex-1">
          <span className="font-display text-5xl text-forest leading-none">{sample.streak}</span>
          <p className={`${label} mt-1.5`}>Day streak</p>
        </div>
        <div className="w-px bg-ink/15" />
        <div className="flex-1 pl-5">
          <span className="font-display text-5xl text-forest leading-none">3<span className="text-ink/30">/4</span></span>
          <p className={`${label} mt-1.5`}>Sessions / wk</p>
        </div>
      </div>

      {/* 2 — Today's workout */}
      <Cap>Today’s workout</Cap>
      <div className={`${rule} pt-4`}>
        <p className={label}>Today</p>
        <h2 className="font-display text-5xl uppercase leading-none mt-1.5">{w.name}</h2>
        <p className="text-sm text-slate mt-2 uppercase tracking-wide">{w.focus}</p>
        <div className="flex items-center justify-between mt-4">
          <p className={label}>{w.count} movements — {w.minutes} min</p>
          <p className={label}>{w.done}/{w.count} done</p>
        </div>
        <div className="mt-2 h-px bg-ink/15 relative">
          <div className="absolute left-0 top-0 h-[3px] -mt-[1px] bg-forest" style={{ width: `${pct}%` }} />
        </div>
        <button className="mt-5 w-full rounded-none bg-forest text-bone uppercase tracking-[0.16em] text-xs font-semibold py-4 flex items-center justify-center gap-2">
          Continue session →
        </button>
      </div>

      {/* 3 — Runner snippet */}
      <Cap>In the runner</Cap>
      <div className={`${rule} pt-4`}>
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-xl uppercase">{m.name}</h3>
          <span className={label}>{m.scheme}</span>
        </div>
        <div className="flex gap-6 mt-3">
          {[["Weight", `${m.weight} lb`], ["Sets", m.sets], ["Reps", m.reps]].map(([l, v]) => (
            <div key={l}>
              <p className={label}>{l}</p>
              <p className="font-display text-2xl mt-0.5">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className={`${label} mr-1`}>Effort</span>
          {FEELINGS.map((f, i) => (
            <span key={i} className={`text-lg ${i + 1 === m.feeling ? "" : "opacity-30"}`}>{f}</span>
          ))}
        </div>
      </div>

      <div className={`${rule} mt-4 pt-4`}>
        <h3 className="font-display text-xl uppercase">{metcon.title}</h3>
        <p className="text-sm whitespace-pre-wrap text-ink/90 mt-2 leading-relaxed">{metcon.text}</p>
        <p className={`${label} mt-2.5`}>{metcon.levels}</p>
        <div className="mt-4 flex items-end justify-between border-t border-ink/15 pt-3">
          <div>
            <p className={label}>{metcon.scoreLabel}</p>
            <p className="font-display text-5xl text-forest leading-none mt-1">{metcon.score}</p>
          </div>
          <span className="text-2xl">{FEELINGS[metcon.feeling - 1]}</span>
        </div>
      </div>

      {/* 5 — Numbers hero */}
      <Cap>Numbers</Cap>
      <p className={label}>{pr.lift} — 1-rep max</p>
      <div className="flex items-end gap-2 mt-1">
        <span className="font-display text-[88px] leading-[0.8] text-forest">{pr.value}</span>
        <span className="font-display text-3xl text-slate mb-2 uppercase">{pr.unit}</span>
      </div>
      <p className={`${label} mt-3`}>{pr.sub}</p>
      <div className={`${rule} mt-4 pt-1`}>
        {numbers.map((n) => (
          <div key={n.lift} className="flex items-baseline justify-between py-3 border-b border-ink/10">
            <span className="uppercase tracking-wide text-sm">{n.lift}</span>
            <span className="font-display text-2xl text-forest">{n.value}</span>
          </div>
        ))}
      </div>

      {/* 6 — Coach roster row */}
      <Cap>Coach · roster</Cap>
      <div className={`${rule} pt-4 flex items-center gap-3`}>
        <div className="w-11 h-11 rounded-full border-2 border-forest text-forest grid place-items-center font-display">AR</div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg uppercase leading-none">{ca.name}</p>
          <p className={`${label} mt-1.5`}>{ca.goals.join(" · ")}</p>
        </div>
        <div className="text-right">
          <p className={label}>{ca.week}</p>
          <p className="text-xs text-brick mt-1 uppercase tracking-wide">{ca.last}</p>
        </div>
      </div>

      {/* 4 — Bottom nav */}
      <Cap>Bottom nav</Cap>
      <div className="border-t border-ink/15 grid grid-cols-5">
        {NAV.map((t, i) => {
          const Icon = ICONS[t.icon];
          const active = i === 0;
          return (
            <div key={t.id} className={`relative flex flex-col items-center gap-1.5 py-3 ${active ? "text-forest" : "text-slate"}`}>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-forest" />}
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.1em] font-semibold">{t.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
