"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useClients, useLogs } from "@/lib/store";
import { SCOREBOARD_LIFTS, teamRankings, type ScoreboardMetric } from "@/lib/scoreboard";
import { relativeDate } from "@/lib/week";
import { EMPTY_FILTER, matchesFilter, isFilterActive, type TeamFilter } from "@/lib/team";
import { useIsDemo } from "./demoContext";
import TeamFilterBar from "./TeamFilterBar";
import { Avatar, Card } from "./ui";

const MEDALS = ["🥇", "🥈", "🥉"];

// Coach-side team leaderboard: ranks the roster by a single barbell lift or by
// the five-lift total (clean, bench, squat, deadlift, overhead press).
export default function TeamScoreboard() {
  const clients = useClients();
  const logs = useLogs();
  const demo = useIsDemo();
  const [metric, setMetric] = useState<ScoreboardMetric>("total");
  const [filter, setFilter] = useState<TeamFilter>(EMPTY_FILTER);
  const [open, setOpen] = useState(false);
  const pool = demo && isFilterActive(filter) ? clients.filter((c) => matchesFilter(c, filter)) : clients;
  const rows = teamRankings(pool, logs, metric);

  const tabs: { id: ScoreboardMetric; label: string }[] = [
    { id: "total", label: "Total" },
    ...SCOREBOARD_LIFTS.map((l) => ({ id: l.id, label: l.short })),
  ];
  const num = (n: number) => n.toLocaleString();
  // collapsed: just the leaderboard's top 3; expanded: filters + the full list
  const visibleRows = open ? rows : rows.slice(0, 3);

  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full"
        aria-expanded={open}
      >
        <span className="flex items-baseline gap-2">
          <span className="font-display text-lg text-forest">Team scoreboard</span>
          <span className="text-[11px] text-slate">{rows.length} ranked</span>
        </span>
        <ChevronDown size={18} className={`text-slate transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <p className="text-[12px] text-slate mt-0.5">Top tested lift across the roster.</p>
          {demo && (
            <div className="mt-3">
              <TeamFilterBar filter={filter} onChange={setFilter} />
            </div>
          )}
          {/* metric selector — all six fit the width, no horizontal scroll */}
          <div className="grid grid-cols-6 gap-1 mt-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setMetric(t.id)}
                aria-pressed={metric === t.id}
                className={`rounded-lg py-1.5 text-[11px] font-semibold transition-colors ${
                  metric === t.id ? "bg-forest text-bone" : "bg-field text-slate"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-slate text-center py-8">No lifts logged yet.</p>
      ) : (
        <ol className="mt-3 space-y-1.5">
          {visibleRows.map((r, i) => (
            <li key={r.client.id}>
              <Link
                href={`/clients/${r.client.id}`}
                className={`flex items-center gap-3 rounded-xl px-2 py-2 active:scale-[0.99] transition-transform ${
                  i < 3 ? "bg-field/60" : "hover:bg-field/40"
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
                    <p className="text-[11px] text-slate">
                      {r.valueDate ? `Tested ${relativeDate(r.valueDate)} · ` : ""}5-lift {num(r.total)}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span className="font-display text-lg text-forest leading-none">
                    {r.value ? num(r.value) : "—"}
                  </span>
                  {r.value ? <span className="text-[10px] text-slate ml-0.5">lbs</span> : null}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {!open && rows.length > 3 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2.5 w-full text-center text-xs font-semibold text-forest"
        >
          See all {rows.length} · filter
        </button>
      )}
    </Card>
  );
}
