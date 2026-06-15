"use client";

// Direction C — "Bold Energetic": color-blocked filled hero cards, chunky 24px+
// radii, bold buttons, green/sky accents as fills, white-on-forest stat tiles,
// emoji kept for energy. Motivating / gamified.

import { sample, FEELINGS } from "./sample";

const NAV_EMOJI = [
  { label: "Train", icon: "🔥" },
  { label: "Numbers", icon: "🔢" },
  { label: "Library", icon: "📚" },
  { label: "Timer", icon: "⏱️" },
  { label: "You", icon: "👤" },
];

function Cap({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate/70 mt-8 mb-2 px-1">{children}</p>;
}

export default function DirectionBold() {
  const { workout: w, movement: m, metcon, pr, numbers, coachAthlete: ca } = sample;
  const pct = Math.round((w.done / w.count) * 100);

  return (
    <div className="bg-bone px-4 pb-10">
      {/* 1 — Train header + streak (forest hero) */}
      <Cap>Train · home</Cap>
      <div className="rounded-[28px] bg-gradient-to-br from-forest to-green text-bone p-5 shadow-[0_16px_36px_-12px_rgba(25,53,12,0.55)]">
        <p className="text-bone/70 text-sm font-medium">{sample.day} · {sample.dateLabel}</p>
        <h1 className="font-display text-3xl mt-1">Let’s go, {sample.athleteFirst}! 💪</h1>
        <div className="flex gap-3 mt-4">
          <div className="flex-1 rounded-3xl bg-bone/15 backdrop-blur p-3.5">
            <p className="text-4xl font-display leading-none">🔥 {sample.streak}</p>
            <p className="text-bone/75 text-xs mt-1.5">day streak</p>
          </div>
          <div className="flex-1 rounded-3xl bg-bone/15 backdrop-blur p-3.5">
            <p className="text-4xl font-display leading-none">3<span className="text-bone/60 text-xl">/4</span></p>
            <p className="text-bone/75 text-xs mt-1.5">this week</p>
          </div>
        </div>
      </div>

      {/* 2 — Today's workout */}
      <Cap>Today’s workout</Cap>
      <div className="rounded-[28px] bg-surface border-2 border-forest/10 p-5 shadow-[0_12px_30px_-14px_rgba(25,53,12,0.4)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl">{w.name} 🏋️</h2>
          <span className="rounded-full bg-sky/25 text-[#234653] text-xs font-bold px-3 py-1">{w.minutes} MIN</span>
        </div>
        <p className="text-sm text-slate mt-1 font-medium">{w.focus} · {w.count} movements</p>
        <div className="mt-4 h-3 rounded-full bg-field overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-forest to-green" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-slate mt-1.5 font-medium">{w.done}/{w.count} crushed 💥</p>
        <button className="mt-4 w-full rounded-2xl bg-forest text-bone font-bold text-base py-3.5 active:scale-[0.98] transition-transform">
          ▶  Continue
        </button>
      </div>

      {/* 3 — Runner snippet */}
      <Cap>In the runner</Cap>
      <div className="space-y-3">
        <div className="rounded-3xl bg-green/10 border-2 border-green/30 p-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-green text-bone grid place-items-center font-bold shrink-0">✓</span>
            <div className="flex-1">
              <p className="font-bold leading-tight">{m.name}</p>
              <p className="text-xs text-slate font-medium">{m.scheme} · {m.rest} rest</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[["Weight", `${m.weight}`], ["Sets", m.sets], ["Reps", m.reps]].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-surface p-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wide text-slate font-semibold">{l}</p>
                <p className="font-display text-2xl text-forest leading-none mt-1">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            {FEELINGS.map((f, i) => (
              <span key={i} className={`text-2xl ${i + 1 === m.feeling ? "scale-125" : "opacity-35"}`}>{f}</span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-surface border-2 border-forest/10 overflow-hidden">
          <div className="bg-forest text-bone px-4 py-2.5 font-display text-lg">{metcon.title}</div>
          <div className="p-4">
            <p className="text-sm whitespace-pre-wrap text-ink/90">{metcon.text}</p>
            <p className="text-[11px] text-slate mt-2 font-medium">{metcon.levels}</p>
            <div className="mt-3 rounded-2xl bg-gradient-to-br from-forest to-green text-bone p-4 flex items-end justify-between">
              <div>
                <p className="text-bone/70 text-[10px] uppercase tracking-wide font-semibold">{metcon.scoreLabel}</p>
                <p className="font-display text-4xl leading-none mt-1">{metcon.score}</p>
              </div>
              <span className="text-3xl">{FEELINGS[metcon.feeling - 1]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 — Numbers hero */}
      <Cap>Numbers</Cap>
      <div className="rounded-[28px] bg-gradient-to-br from-forest to-green text-bone p-5">
        <p className="text-bone/75 text-sm font-medium">{pr.lift} · 1RM 🏆</p>
        <div className="flex items-end gap-2 mt-1">
          <span className="font-display text-7xl leading-[0.8]">{pr.value}</span>
          <span className="font-display text-2xl text-bone/70 mb-1">{pr.unit}</span>
        </div>
        <p className="text-bone/70 text-xs mt-2">{pr.sub}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        {numbers.map((n, i) => (
          <div key={n.lift} className={`rounded-3xl p-4 text-center text-bone ${i === 1 ? "bg-sky/80" : "bg-green"}`}>
            <p className="font-display text-3xl leading-none">{n.value}</p>
            <p className="text-[11px] mt-1.5 opacity-85 font-medium">{n.lift}</p>
          </div>
        ))}
      </div>

      {/* 6 — Coach roster row */}
      <Cap>Coach · roster</Cap>
      <div className="rounded-3xl bg-surface border-2 border-forest/10 p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest to-green text-bone grid place-items-center font-bold">AR</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{ca.name}</p>
          <div className="flex gap-1.5 mt-1.5">
            {ca.goals.map((g) => (
              <span key={g} className="rounded-full bg-green/15 text-forest text-xs font-bold px-2.5 py-0.5">{g}</span>
            ))}
          </div>
        </div>
        {ca.behind && <span className="rounded-full bg-brick/15 text-brick text-[11px] font-bold px-2.5 py-1 shrink-0">Behind</span>}
      </div>

      {/* 4 — Bottom nav (emoji, pill active) */}
      <Cap>Bottom nav</Cap>
      <div className="rounded-[28px] bg-surface border-2 border-forest/10 p-2 grid grid-cols-5">
        {NAV_EMOJI.map((t, i) => {
          const active = i === 0;
          return (
            <div
              key={t.label}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl ${active ? "bg-forest text-bone" : "text-slate"}`}
            >
              <span className={`text-xl ${active ? "scale-110" : ""}`}>{t.icon}</span>
              <span className="text-[11px] font-bold">{t.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
