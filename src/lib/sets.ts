// Helpers for reading an athlete's per-set log off an ItemResult.
//
// A movement's result can carry either a per-set array (`sets`, the current
// shape) or the older flat weight/setsDone/repsDone fields (logs written before
// per-set logging, plus activities/metcons that never had sets). Everything that
// reads results — PRs, the team scoreboard, total-volume, review cards — goes
// through these so both shapes are handled in one place.

import type { ItemResult, SetLog } from "./types";

const filled = (s: SetLog) => !!(s.weight?.trim() || s.reps?.trim());

/** The sets the athlete actually logged. Prefers the per-set array; falls back to
 *  synthesizing N identical sets from the flat weight/setsDone/repsDone fields. */
export function loggedSets(e: ItemResult): SetLog[] {
  const real = (e.sets ?? []).filter(filled);
  if (real.length) return real;
  if (e.weight?.trim() || e.repsDone?.trim()) {
    const n = Math.max(1, parseInt(e.setsDone ?? "1", 10) || 1);
    return Array.from({ length: n }, () => ({ weight: e.weight, reps: e.repsDone }));
  }
  return [];
}

/** Heaviest single set (numeric weight) the athlete logged, with that set's reps —
 *  the basis for PRs and the scoreboard. */
export function topSet(e: ItemResult): { weight: number; reps?: string } | undefined {
  let best: { weight: number; reps?: string } | undefined;
  for (const s of loggedSets(e)) {
    // first numeric token only, so "135-145" or "2x45" don't concatenate
    const m = (s.weight ?? "").match(/\d+(?:\.\d+)?/);
    const w = m ? parseFloat(m[0]) : NaN;
    if (isFinite(w) && w > 0 && (!best || w > best.weight)) best = { weight: w, reps: s.reps };
  }
  return best;
}

/** Total pounds moved across the logged sets (weight × reps, summed). Non-numeric
 *  loads like "BW"/bands just don't count. */
export function setVolume(e: ItemResult): number {
  let v = 0;
  for (const s of loggedSets(e)) {
    const w = parseFloat(s.weight ?? "");
    const r = parseFloat(s.reps ?? "");
    if (w > 0 && r > 0) v += w * r;
  }
  return v;
}

/** Short chips summarizing the logged sets for review, e.g. ["135 × 5", "145 × 4"].
 *  Collapses to a single chip ("4 × 135 × 5") when every set is identical. */
export function setChips(sets: SetLog[]): string[] {
  const fmt = (s: SetLog) => {
    const w = s.weight?.trim();
    const r = s.reps?.trim();
    if (w && r) return `${w} × ${r}`;
    return w || (r ? `${r} reps` : "");
  };
  const same =
    sets.length > 1 &&
    sets.every((s) => s.weight === sets[0].weight && s.reps === sets[0].reps);
  if (same) return [`${sets.length} × ${fmt(sets[0])}`];
  return sets.map(fmt).filter(Boolean);
}

/** Whether a result row carries anything worth keeping. */
export function entryHasData(e: ItemResult): boolean {
  return !!(
    loggedSets(e).length ||
    e.duration ||
    e.distance ||
    e.calories ||
    e.intensity ||
    e.feeling ||
    e.note ||
    e.rounds ||
    e.level
  );
}
