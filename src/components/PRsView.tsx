"use client";

import { useState } from "react";
import { useExercises, useLogsForClient } from "@/lib/store";
import type { Client } from "@/lib/types";
import { relativeDate, daysAgo } from "@/lib/week";
import { Card, EmptyState, Hero, Pill } from "./ui";
import PercentageCalculator from "./PercentageCalculator";

// Personal records from the athlete's logged weights: the heaviest load recorded
// per movement (parsed from the free-text weight field), with reps and date.
export default function PRsView({ client }: { client: Client }) {
  const [max, setMax] = useState("");
  const logs = useLogsForClient(client.id);
  const exercises = useExercises();
  const exById = Object.fromEntries(exercises.map((e) => [e.id, e]));

  type PR = { exId: string; weight: number; reps?: string; date: string };
  const best: Record<string, PR> = {};
  for (const log of logs) {
    for (const e of log.entries ?? []) {
      if (!e.exerciseId) continue;
      // first numeric token only — so "135-145" or "2x45" don't concatenate into
      // a garbage PR like 135145
      const m = (e.weight ?? "").match(/\d+(?:\.\d+)?/);
      const w = m ? parseFloat(m[0]) : NaN;
      if (!isFinite(w) || w <= 0) continue;
      const cur = best[e.exerciseId];
      if (!cur || w > cur.weight) {
        best[e.exerciseId] = { exId: e.exerciseId, weight: w, reps: e.repsDone, date: log.date };
      }
    }
  }

  const prs = Object.values(best)
    .filter((p) => exById[p.exId])
    // newest first so a PR set today rises to the top; name as tiebreaker
    .sort((a, b) => b.date.localeCompare(a.date) || exById[a.exId].name.localeCompare(exById[b.exId].name));

  // heaviest logged lift overall → the hero stat
  const top = [...prs].sort((a, b) => b.weight - a.weight)[0];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Maxes &amp; %</h1>

      {top && (
        <Hero className="p-5 mb-4">
          <p className="text-bone/75 text-sm font-medium">{exById[top.exId].name} · top lift 🏆</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="font-display text-6xl leading-[0.8]">{top.weight}</span>
            <span className="font-display text-2xl text-bone/70 mb-1">lb</span>
          </div>
          <p className="text-bone/70 text-xs mt-2">{relativeDate(top.date)}{top.reps ? ` · ${top.reps} reps` : ""}</p>
        </Hero>
      )}

      <PercentageCalculator max={max} onMaxChange={setMax} />

      <div className="mt-6">
        <h2 className="text-lg font-bold mb-1">Personal records</h2>
        <p className="text-slate text-sm mb-3">
          Your heaviest logged load per movement{prs.length ? " — tap one to load it into the calculator." : "."}
        </p>

        {prs.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="No PRs yet"
            hint="Log a weight on your movements during a workout and your bests show up here."
          />
        ) : (
          <div className="space-y-2">
            {prs.map((p) => {
              const fresh = daysAgo(p.date) <= 7;
              return (
                <Card
                  key={p.exId}
                  onClick={() => {
                    setMax(String(p.weight));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`p-3 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform ${
                    fresh ? "border-green/50" : ""
                  }`}
                >
                  <span className="text-xl">🏆</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">
                      {exById[p.exId].name}
                      {fresh && <Pill tone="green" className="ml-2 align-middle">New</Pill>}
                    </p>
                    <p className="text-xs text-slate">{relativeDate(p.date)}{p.reps ? ` · ${p.reps} reps` : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold text-forest">{p.weight}</span>
                    <span className="text-xs text-slate"> lbs</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
