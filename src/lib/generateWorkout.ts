"use client";

// Convert the generator API's JSON into the app's Workout shape. Strength
// movements are matched by name against the coach's exercise library (so demos +
// per-movement reporting work); anything unmatched is kept as note text rather
// than inventing a phantom exercise. Metcons come back as reportable note blocks.

import { uid } from "./store";
import type { Block, Exercise, ScoreType, Workout } from "./types";

export interface GenItem {
  exerciseName: string;
  sets?: number;
  reps?: string;
  rest?: string;
}

export interface GenBlock {
  kind: "note" | "strength";
  title?: string;
  text?: string;
  logResult?: boolean;
  scoreType?: ScoreType;
  items?: GenItem[];
}

export interface GeneratedWorkout {
  name: string;
  blocks: GenBlock[];
}

export function toWorkout(
  gen: GeneratedWorkout,
  exercises: Exercise[],
  dow: number,
  weekStart: string,
): Workout {
  const byName = new Map(exercises.map((e) => [e.name.trim().toLowerCase(), e]));
  const blocks: Block[] = [];

  for (const gb of gen.blocks ?? []) {
    if (gb.kind === "note") {
      blocks.push({
        id: uid("b"),
        type: "note",
        items: [],
        title: gb.title ?? "",
        text: gb.text ?? "",
        logResult: gb.logResult || undefined,
        scoreType: gb.logResult ? gb.scoreType ?? "time" : undefined,
      });
      continue;
    }

    // Strength: a header note (movement blocks can't show a title), then one
    // single block per matched movement; unmatched movements fall back to text.
    if (gb.title) {
      blocks.push({ id: uid("b"), type: "note", items: [], title: gb.title, text: "" });
    }
    const unmatched: string[] = [];
    for (const it of gb.items ?? []) {
      const ex = byName.get(it.exerciseName.trim().toLowerCase());
      if (!ex) {
        const prefix = it.sets ? `${it.sets} × ` : "";
        unmatched.push(
          `${it.exerciseName} — ${prefix}${it.reps ?? ""}${it.rest ? ` · ${it.rest} rest` : ""}`.trim(),
        );
        continue;
      }
      blocks.push({
        id: uid("b"),
        type: "single",
        items: [
          {
            id: uid("i"),
            exerciseId: ex.id,
            sets: it.sets ?? 3,
            reps: it.reps ?? "",
            rest: it.rest ?? "",
            variant: ex.variants?.[0],
          },
        ],
      });
    }
    if (unmatched.length) {
      blocks.push({
        id: uid("b"),
        type: "note",
        items: [],
        title: gb.title ? "" : "Movements",
        text: unmatched.join("\n"),
      });
    }
  }

  return { id: uid("w"), name: gen.name || "Generated workout", dow, blocks, weekStart };
}
