"use client";

// Direction A — "Refined": evolve the current language. Layered surfaces, soft
// multi-layer shadows, generous rhythm, big League Spartan display numbers,
// crisp line icons for chrome, emoji kept for expressive moments.

import { sample, FEELINGS, NAV } from "./sample";
import { ICONS, FlameIcon, PlayIcon, CheckIcon, PlusIcon } from "./icons";

const card =
  "rounded-[20px] bg-surface border border-line/70 shadow-[0_1px_2px_rgba(25,53,12,0.04),0_10px_28px_-12px_rgba(25,53,12,0.16)]";

function Cap({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate/70 mt-8 mb-2 px-1">
      {children}
    </p>
  );
}

export default function DirectionRefined() {
  const { workout: w, movement: m, metcon, pr, numbers, coachAthlete: ca } = sample;
  const pct = Math.round((w.done / w.count) * 100);

  return (
    <div className="bg-bone px-4 pb-10">
      {/* 1 — Train header + streak */}
      <Cap>Train · home</Cap>
      <div className="pt-2">
        <p className="text-xs font-medium text-slate">{sample.day} · {sample.dateLabel}</p>
        <h1 className="text-[26px] leading-tight font-display mt-0.5">Good work, {sample.athleteFirst} 👋</h1>
        <div className="mt-3 flex gap-3">
          <div className={`${card} flex-1 p-4 flex items-center gap-3`}>
            <div className="w-11 h-11 rounded-2xl bg-green/12 grid place-items-center text-green">
              <FlameIcon size={24} />
            </div>
            <div className="leading-none">
              <span className="font-display text-4xl text-forest">{sample.streak}</span>
              <p className="text-xs text-slate mt-1">day streak</p>
            </div>
          </div>
          <div className={`${card} flex-1 p-4`}>
            <p className="text-xs text-slate">This week</p>
            <p className="font-display text-4xl text-forest leading-none mt-1">3<span className="text-slate text-lg font-sans font-semibold">/4</span></p>
            <p className="text-xs text-slate mt-1">sessions</p>
          </div>
        </div>
        {/* week strip stub */}
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
      </div>

      {/* 2 — Today's workout card */}
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
        <div className="mt-4 h-2 rounded-full bg-field overflow-hidden">
          <div className="h-full rounded-full bg-forest" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-slate mt-1.5">{w.done} of {w.count} done</p>
        <button className="mt-4 w-full rounded-2xl bg-forest text-bone font-semibold py-3 flex items-center justify-center gap-2 shadow-[0_8px_20px_-8px_rgba(25,53,12,0.5)] active:scale-[0.99] transition-transform">
          <PlayIcon size={18} /> Continue session
        </button>
      </div>

      {/* 3 — Runner snippet */}
      <Cap>In the runner</Cap>
      <div className="space-y-2.5">
        {/* movement, expanded/logged */}
        <div className={`${card} p-3`}>
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-forest text-bone grid place-items-center shrink-0">
              <CheckIcon size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-tight">{m.name}</p>
              <p className="text-xs text-slate">{m.scheme} · {m.rest} rest</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[["Weight", m.weight], ["Sets", m.sets], ["Reps", m.reps]].map(([l, v]) => (
              <div key={l}>
                <span className="block text-[10px] uppercase tracking-wide text-slate">{l}</span>
                <div className="mt-0.5 rounded-xl bg-field border border-line px-2.5 py-2 text-sm font-medium">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-slate mr-1">Effort</span>
            {FEELINGS.map((f, i) => (
              <span key={i} className={`text-xl ${i + 1 === m.feeling ? "scale-110" : "opacity-40"}`}>{f}</span>
            ))}
          </div>
        </div>
        {/* metcon result card */}
        <div className={`${card} p-3 border-l-4 border-l-forest`}>
          <p className="font-display text-lg leading-none">{metcon.title}</p>
          <p className="text-sm whitespace-pre-wrap text-ink/90 mt-2">{metcon.text}</p>
          <p className="text-[11px] text-slate mt-2">{metcon.levels}</p>
          <div className="mt-3 rounded-xl bg-field/70 border border-line p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-slate">Your result · {metcon.scoreLabel}</span>
              <span className="text-xl">{FEELINGS[metcon.feeling - 1]}</span>
            </div>
            <div className="mt-1 font-display text-3xl text-forest">{metcon.score}</div>
          </div>
        </div>
      </div>

      {/* 5 — Numbers hero */}
      <Cap>Numbers</Cap>
      <div className={`${card} p-5`}>
        <p className="text-sm text-slate">{pr.lift}</p>
        <div className="flex items-end gap-1.5 mt-1">
          <span className="font-display text-6xl leading-none text-forest">{pr.value}</span>
          <span className="font-display text-2xl text-slate mb-1">{pr.unit}</span>
        </div>
        <p className="text-xs text-slate mt-1.5">{pr.sub}</p>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {numbers.map((n) => (
            <div key={n.lift} className="rounded-2xl bg-field/70 border border-line p-3 text-center">
              <p className="font-display text-2xl text-forest leading-none">{n.value}</p>
              <p className="text-[11px] text-slate mt-1">{n.lift}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6 — Coach roster row */}
      <Cap>Coach · roster</Cap>
      <div className={`${card} p-4 flex items-center gap-3`}>
        <div className="w-12 h-12 rounded-full bg-forest text-bone grid place-items-center font-bold">AR</div>
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

      {/* 4 — Bottom nav */}
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

      {/* floating add, to show FAB ergonomics */}
      <div className="flex justify-end mt-4">
        <button className="w-14 h-14 rounded-full bg-forest text-bone grid place-items-center shadow-[0_10px_24px_-8px_rgba(25,53,12,0.6)]">
          <PlusIcon size={26} />
        </button>
      </div>
    </div>
  );
}
