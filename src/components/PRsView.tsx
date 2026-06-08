"use client";

import { useExercises, useLogsForClient } from "@/lib/store";
import type { Client } from "@/lib/types";
import { Card, EmptyState } from "./ui";

// Personal records from the athlete's logged weights: the heaviest load recorded
// per movement (parsed from the free-text weight field), with reps and date.
export default function PRsView({ client }: { client: Client }) {
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
    .sort((a, b) => exById[a.exId].name.localeCompare(exById[b.exId].name));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Personal records</h1>
      <p className="text-slate text-sm mb-4">Your heaviest logged load per movement.</p>

      {prs.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="No PRs yet"
          hint="Log a weight on your movements during a workout and your bests show up here."
        />
      ) : (
        <div className="space-y-2">
          {prs.map((p) => (
            <Card key={p.exId} className="p-3 flex items-center gap-3">
              <span className="text-xl">🏆</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{exById[p.exId].name}</p>
                <p className="text-xs text-slate">{p.date}{p.reps ? ` · ${p.reps} reps` : ""}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-bold text-forest">{p.weight}</span>
                <span className="text-xs text-slate"> lbs</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
