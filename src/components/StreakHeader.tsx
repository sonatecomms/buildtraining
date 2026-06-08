"use client";

import type { StreakInfo } from "@/lib/store";
import { Card } from "./ui";

function Ring({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#cfd6c4" strokeWidth="7" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="#19350c"
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
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={`text-4xl ${streak.current > 0 ? "animate-flame" : "opacity-40"}`}>🔥</div>
            <div className="text-2xl font-extrabold leading-none mt-1">{streak.current}</div>
            <div className="text-[10px] uppercase tracking-wide text-slate">day streak</div>
          </div>

          <div className="flex-1 min-w-0 border-l border-line pl-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate">Level</div>
                <div className="text-xl font-bold text-forest">{streak.level}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate">Points</div>
                <div className="text-xl font-bold">{streak.points.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-slate">
              <span>🏅 Best: <b className="text-ink">{streak.longest}d</b></span>
              <span>✅ Total: <b className="text-ink">{streak.totalSessions}</b></span>
            </div>
          </div>

          <div className="relative grid place-items-center">
            <Ring pct={streak.weekProgressPct} />
            <div className="absolute text-center">
              <div className="text-sm font-bold leading-none">{streak.thisWeek}/{streak.weeklyTarget}</div>
              <div className="text-[8px] text-slate">this wk</div>
            </div>
          </div>
        </div>
      </Card>

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
