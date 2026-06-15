"use client";

// Summarize the muscle / movement load programmed on the days around a target
// day, so the workout generator can balance fatigue (avoid hammering the same
// muscles on back-to-back days, and lean into recovery when the week is heavy).

import type { Exercise, Program } from "./types";
import { workoutsForWeek } from "./store";
import { DOW_LONG } from "./week";

export interface DayLoad {
  dow: number;
  dayLabel: string;
  offset: number; // days relative to the target day (e.g. -1 = the day before)
  muscles: string[];
  categories: string[];
  movements: string[];
}

// Build a per-day load summary for days within ±`span` of `targetDow` in the
// given week. Structured movement blocks give exact muscle/category coverage;
// free-text note blocks (metcons) contribute their title only — best-effort.
export function surroundingLoad(
  program: Program | undefined,
  weekStart: string,
  targetDow: number,
  byId: Record<string, Exercise>,
  span = 2,
): DayLoad[] {
  const week = workoutsForWeek(program, weekStart);
  const out: DayLoad[] = [];

  for (let offset = -span; offset <= span; offset++) {
    if (offset === 0) continue; // skip the target day itself
    const dow = targetDow + offset;
    if (dow < 0 || dow > 6) continue; // keep within the week (boundary days omitted)

    const dayWorkouts = week.filter((w) => w.dow === dow);
    if (dayWorkouts.length === 0) continue;

    const muscles = new Set<string>();
    const categories = new Set<string>();
    const movements = new Set<string>();

    for (const w of dayWorkouts) {
      for (const b of w.blocks) {
        if (b.type === "note") {
          // metcon/notes have no items — surface the title so the model can infer
          if (b.title) movements.add(b.title);
          continue;
        }
        for (const it of b.items) {
          const ex = byId[it.exerciseId];
          if (!ex) continue;
          if (ex.primaryMuscle) muscles.add(ex.primaryMuscle);
          if (ex.category) categories.add(ex.category);
          movements.add(ex.name);
        }
      }
    }

    if (muscles.size === 0 && categories.size === 0 && movements.size === 0) continue;

    out.push({
      dow,
      dayLabel: DOW_LONG[dow],
      offset,
      muscles: [...muscles],
      categories: [...categories],
      movements: [...movements],
    });
  }

  return out;
}
