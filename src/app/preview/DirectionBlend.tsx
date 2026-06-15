"use client";

// Direction A+C — "Blend": A's refined, layered, legible base (soft-shadow white
// cards, crisp line icons, big display numbers, calm rhythm) with C's energetic
// color-blocked HERO moments (forest→green gradient hero cards, gradient score
// tiles, emoji energy) where they motivate. Calm where it should be, punchy where
// it counts.

import { sample, FEELINGS, NAV } from "./sample";
import { ICONS, PlayIcon, CheckIcon, PlusIcon } from "./icons";

const card =
  "rounded-[22px] bg-surface border border-line/70 shadow-[0_1px_2px_rgba(25,53,12,0.04),0_10px_28px_-12px_rgba(25,53,12,0.16)]";
const hero =
  "rounded-[26px] bg-gradient-to-br from-forest to-green text-bone shadow-[0_16px_36px_-14px_rgba(25,53,12,0.55)]";

function Cap({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate/70 mt-8 mb-2 px-1">
      {children}
    </p>
  );
}

export default function DirectionBlend() {
  const { workout: w, movement: m, metcon, pr, numbers, coachAthlete: ca } = sample;
  const pct = Math.round((w.done / w.count) * 100);

  return (
    <div className="bg-bone px-4 pb-10">
      {/* 1 — Train header: C energetic gradient hero + A clean week strip */}
      <Cap>Train · home</Cap>
      <div className={`${hero} p-5`}>
        <p className="text-bone/70 text-sm font-medium">{sample.day} · {sample.dateLabel}</p>
        <h1 className="font-display text-3xl mt-1">Let’s go, {sample.athleteFirst} 💪</h1>
        <div className="flex gap-3 mt-4">
          <div className="flex-1 rounded-2xl bg-bone/15 backdrop-blur p-3.5">
            <p className="font-display text-4xl leading-none">🔥 {sample.streak}</p>
            <p className="text-bone/75 text-xs mt-1.5">day streak</p>
          </div>
          <div className="flex-1 rounded-2xl bg-bone/15 backdrop-blur p-3.5">
            <p className="font-display text-4xl leading-none">3<span className="text-bone/60 text-xl">/4</span></p>
            <p className="text-bone/75 text-xs mt-1.5">this week</p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-between px-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[11px] text-slate">{d}</span>
            <span
              className={`w-7 h-7 rounded-full grid place-items-center text-xs font-semibold ${
                i === 3 ? "bg-forest text-bone" : i < 3 ? "bg-green/15 text-forest" : "text-slate/60"
              }`}
            >
              {17 + i - 3}
            </span>
          </div>
        ))}
      </div>

      {/* 2 — Today's workout: A clean card + C gradient progress + display title */}
      <Cap>Today’s workout</Cap>
      <div className={`${card} p-4`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl leading-none">{w.name}</h2>
            <p className="text-sm text-slate mt-1.5">{w.focus}</p>
          </div>
          <span className="rounded-full bg-green/12 text-forest text-xs font-semibold px-2.5 py-1">
            {w.count} moves · {w.minutes}m
          </span>
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-field overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-forest to-green" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-slate mt-1.5">{w.done} of {w.count} done</p>
        <button className="mt-4 w-full rounded-2xl bg-forest text-bone font-semibold py-3 flex items-center justify-center gap-2 shadow-[0_8px_20px_-8px_rgba(25,53,12,0.5)] active:scale-[0.99] transition-transform">
          <PlayIcon size={18} /> Continue session
        </button>
      </div>

      {/* 3 — Runner: BOLD aesthetic + metcon LEVEL selector */}
      <Cap>In the runner</Cap>
      <div className="space-y-3">
        <div className="rounded-3xl bg-green/10 border-2 border-green/30 p-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-green text-bone grid place-items-center shrink-0">
              <CheckIcon size={18} />
            </span>
            <div className="flex-1">
              <p className="font-bold leading-tight">{m.name}</p>
              <p className="text-xs text-slate font-medium">{m.scheme} · {m.rest} rest</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[["Weight", m.weight], ["Sets", m.sets], ["Reps", m.reps]].map(([l, v]) => (
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

            {/* metcon level the athlete actually did */}
            <p className="text-[10px] uppercase tracking-wide text-slate font-semibold mt-3 mb-1.5">Level you did</p>
            <div className="flex gap-1.5">
              {metcon.levelOptions.map((lvl) => {
                const on = lvl === metcon.level;
                return (
                  <span
                    key={lvl}
                    className={`flex-1 text-center rounded-full text-xs font-bold py-1.5 ${
                      on ? "bg-forest text-bone" : "bg-field text-slate"
                    }`}
                  >
                    {lvl}
                  </span>
                );
              })}
            </div>

            <div className="mt-3 rounded-2xl bg-gradient-to-br from-forest to-green text-bone p-4 flex items-end justify-between">
              <div>
                <p className="text-bone/70 text-[10px] uppercase tracking-wide font-semibold">Your result · {metcon.scoreLabel}</p>
                <p className="font-display text-4xl leading-none mt-1">{metcon.score}</p>
              </div>
              <span className="text-3xl">{FEELINGS[metcon.feeling - 1]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 — Numbers: C gradient PR hero + A clean stat tiles */}
      <Cap>Numbers</Cap>
      <div className={`${hero} p-5`}>
        <p className="text-bone/75 text-sm font-medium">{pr.lift} · 1RM 🏆</p>
        <div className="flex items-end gap-2 mt-1">
          <span className="font-display text-7xl leading-[0.8]">{pr.value}</span>
          <span className="font-display text-2xl text-bone/70 mb-1">{pr.unit}</span>
        </div>
        <p className="text-bone/70 text-xs mt-2">{pr.sub}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {numbers.map((n) => (
          <div key={n.lift} className={`${card} p-3 text-center`}>
            <p className="font-display text-2xl text-forest leading-none">{n.value}</p>
            <p className="text-[11px] text-slate mt-1">{n.lift}</p>
          </div>
        ))}
      </div>

      {/* 6 — Coach roster: A clean card, gradient avatar */}
      <Cap>Coach · roster</Cap>
      <div className={`${card} p-4 flex items-center gap-3`}>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest to-green text-bone grid place-items-center font-bold">AR</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {ca.behind && <span className="w-2 h-2 rounded-full bg-brick shrink-0" />}
            <p className="font-semibold truncate">{ca.name}</p>
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {ca.goals.map((g) => (
              <span key={g} className="rounded-full bg-green/12 text-forest text-xs font-medium px-2 py-0.5">{g}</span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate">{ca.week}</p>
          <p className="text-xs text-brick mt-1">{ca.last}</p>
        </div>
      </div>

      {/* 4 — Bottom nav: A crisp line icons + sliding highlighter */}
      <Cap>Bottom nav</Cap>
      <div className={`${card} px-1 py-1 grid grid-cols-5 relative`}>
        <span
          className="absolute rounded-2xl bg-forest/10"
          style={{ left: "calc(0% + 6px)", top: 6, bottom: 6, width: "calc(20% - 12px)" }}
        />
        {NAV.map((t, i) => {
          const Icon = ICONS[t.icon];
          const active = i === 0;
          return (
            <div key={t.id} className={`relative z-[1] flex flex-col items-center gap-1 py-2.5 ${active ? "text-forest" : "text-slate"}`}>
              <Icon size={22} className={active ? "scale-110" : ""} />
              <span className="text-[11px] font-medium">{t.label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-4">
        <button className="w-14 h-14 rounded-full bg-forest text-bone grid place-items-center shadow-[0_10px_24px_-8px_rgba(25,53,12,0.6)]">
          <PlusIcon size={26} />
        </button>
      </div>
    </div>
  );
}
