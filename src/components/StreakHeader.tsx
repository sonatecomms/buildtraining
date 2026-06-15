"use client";

import type { StreakInfo } from "@/lib/store";
import { Hero } from "./ui";

// Compact total-volume readout: 950 → "950", 12_400 → "12.4k", 1_200_000 → "1.2M".
function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000) return `${Math.round(v / 1000)}k`;
  if (v >= 1_000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}

function Ring({ pct, light = false }: { pct: number; light?: boolean }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" stroke={light ? "rgba(226,230,218,0.3)" : "#cfd6c4"} strokeWidth="7" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={light ? "#e2e6da" : "#19350c"}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * pct) / 100}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

export default function StreakHeader({ streak }: { streak: StreakInfo }) {
  return (
    <div className="space-y-3">
      {/* energetic gradient hero (the streak moment) */}
      <Hero className="p-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={`text-4xl ${streak.current > 0 ? "animate-flame" : "opacity-50"}`}>🔥</div>
            <div className="font-display text-4xl leading-none mt-1">{streak.current}</div>
            <div className="text-[10px] uppercase tracking-wide text-bone/70">day streak</div>
          </div>

          <div className="flex-1 min-w-0 border-l border-bone/20 pl-4">
            <div>
              <div className="text-xs text-bone/70">Volume lifted</div>
              <div className="font-display text-xl">
                {formatVolume(streak.totalVolume)} <span className="text-sm font-normal text-bone/70">lbs</span>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-bone/80">
              <span>🏅 Best: <b className="text-bone">{streak.longest}d</b></span>
              <span>✅ Total: <b className="text-bone">{streak.totalSessions}</b></span>
            </div>
          </div>

          <div className="relative grid place-items-center">
            <Ring pct={streak.weekProgressPct} light />
            <div className="absolute text-center">
              <div className="text-sm font-bold leading-none">{streak.thisWeek}/{streak.weeklyTarget}</div>
              <div className="text-[8px] text-bone/70">this wk</div>
            </div>
          </div>
        </div>
      </Hero>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {streak.badges.map((b) => (
          <div
            key={b.id}
            title={b.hint}
            className={`shrink-0 w-20 rounded-2xl border p-2.5 text-center ${
              b.earned ? "border-green/40 bg-green/10" : "border-line bg-surface opacity-50"
            }`}
          >
            <div className={`text-2xl ${b.earned ? "" : "grayscale"}`}>{b.icon}</div>
            <div className="text-[10px] font-semibold mt-1 leading-tight">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
