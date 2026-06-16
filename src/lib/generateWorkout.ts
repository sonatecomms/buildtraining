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
  levels?: boolean;
  items?: GenItem[];
}

export interface GeneratedWorkout {
  name: string;
  blocks: GenBlock[];
}

// Demo mode has no Supabase session, so the auth-gated AI endpoint would 401.
// Build a believable workout locally from the exercise library instead — instant,
// free, and offline. Shapes match the API so the rest of the flow is identical.
const FOCUS_CATS: Record<string, string[]> = {
  full: ["Lower Body", "Push", "Pull", "Core"],
  upper: ["Push", "Pull"],
  lower: ["Lower Body"],
  push: ["Push"],
  pull: ["Pull"],
  core: ["Core"],
  cardio: ["Cardio", "Conditioning"],
  metcon: ["Lower Body", "Push", "Pull"],
};
const FOCUS_LABEL: Record<string, string> = {
  full: "Full body",
  upper: "Upper body",
  lower: "Lower body",
  push: "Push",
  pull: "Pull",
  core: "Core",
  cardio: "Engine",
  metcon: "Metcon",
};

export function buildDemoWorkout(opts: {
  focus: string;
  metconType?: string;
  timeMin: number;
  exercises: Exercise[];
}): GeneratedWorkout {
  const { focus, metconType, timeMin, exercises } = opts;
  const cats = FOCUS_CATS[focus] ?? FOCUS_CATS.full;
  const fromCat = (cat: string) =>
    exercises.filter((e) => e.category === cat && !e.activity && !e.intensity);
  const shuffle = <T,>(arr: T[]) => arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
  const pickAcross = (n: number): Exercise[] => {
    const out: Exercise[] = [];
    const pools = cats.map((c) => shuffle(fromCat(c)));
    let i = 0;
    while (out.length < n && pools.some((p) => p.length)) {
      const p = pools[i % pools.length];
      const ex = p.shift();
      if (ex && !out.includes(ex)) out.push(ex);
      i++;
    }
    return out;
  };

  const blocks: GenBlock[] = [];

  if (focus === "metcon" || focus === "cardio") {
    const strength = pickAcross(2);
    if (strength.length) {
      blocks.push({ kind: "strength", title: "Strength primer" });
      for (const ex of strength) {
        blocks.push({ kind: "strength", items: [{ exerciseName: ex.name, sets: 4, reps: "5", rest: "120s" }] });
      }
    }
    const movements = pickAcross(3).map((e) => e.name);
    const reps = [21, 15, 9];
    blocks.push({
      kind: "note",
      title: `Metcon · ${metconType ?? "Mixed"}`,
      text:
        movements.length >= 2
          ? `${Math.max(8, Math.round(timeMin * 0.7))}-min AMRAP:\n` +
            movements.map((m, i) => `${reps[i] ?? 12} ${m}`).join("\n")
          : `${timeMin}-min effort, steady pace.`,
      logResult: true,
      scoreType: "rounds",
      levels: true,
    });
    return { name: `${FOCUS_LABEL[focus]} · ${timeMin} min`, blocks };
  }

  // strength focuses: a titled block of single movements
  const count = Math.min(6, Math.max(3, Math.round(timeMin / 10) + 1));
  const movements = pickAcross(count);
  blocks.push({ kind: "strength", title: FOCUS_LABEL[focus] ?? "Session" });
  movements.forEach((ex, idx) => {
    const heavy = idx < 2;
    blocks.push({
      kind: "strength",
      items: [{ exerciseName: ex.name, sets: heavy ? 4 : 3, reps: heavy ? "5" : "10", rest: heavy ? "150s" : "75s" }],
    });
  });
  return { name: `${FOCUS_LABEL[focus]} · ${timeMin} min`, blocks };
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
        // reportable generated metcons offer scaling levels by default
        levels: gb.logResult ? gb.levels ?? true : undefined,
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
