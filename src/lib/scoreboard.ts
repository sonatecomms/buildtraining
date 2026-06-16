import type { Client, WorkoutLog } from "./types";

// The five tracked barbell lifts, in scoreboard order.
export type LiftKey = "ex-clean" | "ex-bench" | "ex-backsquat" | "ex-deadlift" | "ex-ohp";

export const SCOREBOARD_LIFTS: { id: LiftKey; label: string; short: string }[] = [
  { id: "ex-clean", label: "Clean", short: "Clean" },
  { id: "ex-bench", label: "Bench Press", short: "Bench" },
  { id: "ex-backsquat", label: "Back Squat", short: "Squat" },
  { id: "ex-deadlift", label: "Deadlift", short: "Dead" },
  { id: "ex-ohp", label: "Overhead Press", short: "OHP" },
];

export type ScoreboardMetric = "total" | LiftKey;

/** Best numeric weight a client has logged for one exercise (free-text parsed). */
export function bestFor(logs: WorkoutLog[], clientId: string, exId: string): number {
  let best = 0;
  for (const l of logs) {
    if (l.clientId !== clientId || !l.entries) continue;
    for (const e of l.entries) {
      if (e.exerciseId !== exId || !e.weight) continue;
      const w = parseFloat(e.weight);
      if (!Number.isNaN(w) && w > best) best = w;
    }
  }
  return best;
}

export type Ranked = {
  client: Client;
  lifts: Record<string, number>; // exId -> best (0 if none logged)
  total: number; // sum of the five lifts
  value: number; // the metric being ranked on
};

/** Athletes ranked by the chosen metric (a single lift or the five-lift total). */
export function teamRankings(
  clients: Client[],
  logs: WorkoutLog[],
  metric: ScoreboardMetric,
): Ranked[] {
  return clients
    .filter((c) => !c.archived)
    .map((c) => {
      const lifts: Record<string, number> = {};
      let total = 0;
      for (const lf of SCOREBOARD_LIFTS) {
        const b = bestFor(logs, c.id, lf.id);
        lifts[lf.id] = b;
        total += b;
      }
      return { client: c, lifts, total, value: metric === "total" ? total : lifts[metric] };
    })
    .filter((r) => r.total > 0) // only athletes with at least one lift on record
    .sort((a, b) => b.value - a.value || b.total - a.total);
}
