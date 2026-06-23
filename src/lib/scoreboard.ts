import type { Client, WorkoutLog } from "./types";
import { topSet } from "./sets";

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

/** Best numeric lift a client has logged for an exercise, with the date it was
 *  posted (free-text weight parsed). */
export function bestEntry(
  logs: WorkoutLog[],
  clientId: string,
  exId: string,
): { weight: number; date: string } | null {
  let best: { weight: number; date: string } | null = null;
  for (const l of logs) {
    if (l.clientId !== clientId || !l.entries) continue;
    for (const e of l.entries) {
      if (e.exerciseId !== exId) continue;
      const w = topSet(e)?.weight; // heaviest set across the per-set log
      if (w != null && (!best || w > best.weight)) best = { weight: w, date: l.date };
    }
  }
  return best;
}

export function bestFor(logs: WorkoutLog[], clientId: string, exId: string): number {
  return bestEntry(logs, clientId, exId)?.weight ?? 0;
}

export type Ranked = {
  client: Client;
  lifts: Record<string, number>; // exId -> best (0 if none logged)
  total: number; // sum of the five lifts
  value: number; // the metric being ranked on
  valueDate?: string; // for a single lift: the date that best was posted
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
      const valueDate = metric === "total" ? undefined : bestEntry(logs, c.id, metric)?.date;
      return { client: c, lifts, total, value: metric === "total" ? total : lifts[metric], valueDate };
    })
    .filter((r) => r.total > 0) // only athletes with at least one lift on record
    .sort((a, b) => b.value - a.value || b.total - a.total);
}
