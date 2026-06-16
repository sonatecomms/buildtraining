"use client";

import { useState } from "react";
import { useClients, useLogs } from "@/lib/store";
import { SCOREBOARD_LIFTS, teamRankings, type ScoreboardMetric } from "@/lib/scoreboard";
import { Avatar, Card } from "./ui";

const MEDALS = ["🥇", "🥈", "🥉"];

// Coach-side team leaderboard: ranks the roster by a single barbell lift or by
// the five-lift total (clean, bench, squat, deadlift, overhead press).
export default function TeamScoreboard() {
  const clients = useClients();
  const logs = useLogs();
  const [metric, setMetric] = useState<ScoreboardMetric>("total");
  const rows = teamRankings(clients, logs, metric);

  const tabs: { id: ScoreboardMetric; label: string }[] = [
    { id: "total", label: "Total" },
    ...SCOREBOARD_LIFTS.map((l) => ({ id: l.id, label: l.short })),
  ];
  const num = (n: number) => n.toLocaleString();

  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg text-forest">Team scoreboard</h2>
        <span className="text-[11px] text-slate">{rows.length} ranked</span>
      </div>
      <p className="text-[12px] text-slate mt-0.5">Top tested lift across the roster.</p>

      {/* metric selector */}
      <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar -mx-1 px-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setMetric(t.id)}
            aria-pressed={metric === t.id}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              metric === t.id ? "bg-forest text-bone" : "bg-field text-slate"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate text-center py-8">No lifts logged yet.</p>
      ) : (
        <ol className="mt-3 space-y-1.5">
          {rows.map((r, i) => (
            <li
              key={r.client.id}
              className={`flex items-center gap-3 rounded-xl px-2 py-2 ${
                i < 3 ? "bg-field/60" : ""
              }`}
            >
              <span className="w-6 shrink-0 text-center text-sm font-bold text-slate">
                {i < 3 ? MEDALS[i] : i + 1}
              </span>
              <Avatar name={r.client.name} src={r.client.avatarUrl} size={36} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{r.client.name}</p>
                {metric === "total" ? (
                  <p className="text-[11px] text-slate truncate">
                    {SCOREBOARD_LIFTS.map((l) => `${l.short} ${r.lifts[l.id] || "—"}`).join(" · ")}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate">5-lift total {num(r.total)} lbs</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <span className="font-display text-lg text-forest leading-none">
                  {r.value ? num(r.value) : "—"}
                </span>
                {r.value ? <span className="text-[10px] text-slate ml-0.5">lbs</span> : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
