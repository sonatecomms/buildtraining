import type { Exercise, Workout } from "./types";
import { toWorkout, type GeneratedWorkout } from "./generateWorkout";

// Named, multi-week programs a coach can apply to athletes. Each `week(w)`
// returns the sessions (with a weekday) for the 0-based week, progressing over
// time. Movement names are matched against the exercise library (unmatched ones
// fall back to note text), so they survive on any roster.

export interface ProgramTemplate {
  id: string;
  name: string;
  weeks: number;
  daysPerWeek: number;
  blurb: string;
  week: (w: number) => { dow: number; gen: GeneratedWorkout }[];
}

const strength = (exerciseName: string, sets: number, reps: string, rest = "90s") => ({
  kind: "strength" as const,
  items: [{ exerciseName, sets, reps, rest }],
});

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: "pullup-12",
    name: "12-Week Pull-Up Program",
    weeks: 12,
    daysPerWeek: 3,
    blurb: "Grease-the-groove volume ramp from your first reps to double digits.",
    week: (w) => [
      {
        dow: 1,
        gen: {
          name: `Pull Volume · Wk ${w + 1}`,
          blocks: [
            { kind: "strength", title: "Pull-ups" },
            strength("Pull-Up", 4 + Math.floor(w / 2), "submax (leave 1-2)", "120s"),
            strength("Lat Pulldown", 3, "10", "75s"),
            strength("Barbell Row", 3, "8", "90s"),
          ],
        },
      },
      {
        dow: 3,
        gen: {
          name: `Scap & Grip · Wk ${w + 1}`,
          blocks: [
            strength("Pull-Up", 5, "5 · 3s hold at top", "90s"),
            strength("Face Pull", 3, "15", "60s"),
            { kind: "note", title: "Dead hangs", text: `${30 + w * 3}s × 4` },
          ],
        },
      },
      {
        dow: 5,
        gen: {
          name: `Max Pull · Wk ${w + 1}`,
          blocks: [
            { kind: "note", title: "AMRAP test", text: "Max strict pull-ups — log your best set", logResult: true, scoreType: "reps" },
            strength("DB Biceps Curl", 3, "12", "60s"),
          ],
        },
      },
    ],
  },
  {
    id: "wendler-8",
    name: "8-Week Wendler 5/3/1",
    weeks: 8,
    daysPerWeek: 4,
    blurb: "Two classic 5/3/1 cycles — squat, bench, deadlift, press with % progression.",
    week: (w) => {
      const phase = w % 4;
      const scheme = phase === 0 ? "5 · 5 · 5+" : phase === 1 ? "3 · 3 · 3+" : phase === 2 ? "5 · 3 · 1+" : "deload 5 · 5 · 5";
      const pct = phase === 0 ? "65/75/85%" : phase === 1 ? "70/80/90%" : phase === 2 ? "75/85/95%" : "40/50/60%";
      const main = (name: string) => strength(name, 3, `${scheme} @ ${pct}`, "180s");
      const cycle = phase < 2 ? "Cycle " + (Math.floor(w / 4) + 1) : phase === 2 ? "PR week" : "Deload";
      return [
        { dow: 1, gen: { name: `Squat · ${cycle}`, blocks: [main("Back Squat"), strength("Romanian Deadlift", 3, "10"), strength("Hanging Leg Raise", 3, "12", "60s")] } },
        { dow: 2, gen: { name: `Bench · ${cycle}`, blocks: [main("Barbell Bench Press"), strength("Dips", 3, "AMRAP"), strength("Barbell Row", 3, "10")] } },
        { dow: 4, gen: { name: `Deadlift · ${cycle}`, blocks: [main("Conventional Deadlift"), strength("Walking Lunge", 3, "10/leg"), strength("Plank", 3, "45s", "45s")] } },
        { dow: 5, gen: { name: `Press · ${cycle}`, blocks: [main("Overhead Press"), strength("Pull-Up", 5, "5"), strength("Lateral Raise", 3, "15", "45s")] } },
      ];
    },
  },
  {
    id: "power-10",
    name: "10-Week Power & Explosion",
    weeks: 10,
    daysPerWeek: 3,
    blurb: "Olympic lifts, jumps and sprints to build rate of force for the field.",
    week: (w) => {
      const intensity = 70 + w * 2;
      return [
        { dow: 1, gen: { name: `Clean & Jump · Wk ${w + 1}`, blocks: [strength("Power Clean", 5, `3 @ ${intensity}%`, "150s"), { kind: "note", title: "Box jumps", text: "5 × 3 — reset each rep, max height" }, strength("Front Squat", 4, "4", "150s")] } },
        { dow: 3, gen: { name: `Speed & Pull · Wk ${w + 1}`, blocks: [strength("Power Clean", 5, "hang · 2 fast", "150s"), { kind: "note", title: "Sprints", text: "6 × 20yd — full recovery" }, strength("Romanian Deadlift", 3, "6", "120s")] } },
        { dow: 5, gen: { name: `Push Press & Throw · Wk ${w + 1}`, blocks: [strength("Overhead Press", 5, "3 · push press", "150s"), { kind: "note", title: "Med-ball throws", text: "5 × 5 — explosive overhead/rotational" }, strength("Back Squat", 4, `3 @ ${Math.min(85, intensity + 5)}%`, "180s")] } },
      ];
    },
  },
  {
    id: "beginner-12",
    name: "12-Week Beginner Barbell",
    weeks: 12,
    daysPerWeek: 3,
    blurb: "Linear strength for new lifters — add a little weight every session.",
    week: (w) => [
      { dow: 1, gen: { name: `Squat day · Wk ${w + 1}`, blocks: [strength("Back Squat", 3, "5 · add 5 lb", "180s"), strength("Barbell Bench Press", 3, "5 · add 5 lb", "180s"), strength("Conventional Deadlift", 1, "5 · add 10 lb", "210s")] } },
      { dow: 3, gen: { name: `Press day · Wk ${w + 1}`, blocks: [strength("Back Squat", 3, "5 · add 5 lb", "180s"), strength("Overhead Press", 3, "5 · add 5 lb", "180s"), strength("Barbell Row", 3, "5", "120s")] } },
      { dow: 5, gen: { name: `Squat day · Wk ${w + 1}`, blocks: [strength("Back Squat", 3, "5 · add 5 lb", "180s"), strength("Barbell Bench Press", 3, "5 · add 5 lb", "180s"), strength("Pull-Up", 3, "AMRAP", "120s")] } },
    ],
  },
  {
    id: "hypertrophy-6",
    name: "6-Week Hypertrophy Block",
    weeks: 6,
    daysPerWeek: 4,
    blurb: "Upper/lower volume to add lean mass — work the 8-12 rep range.",
    week: (w) => [
      { dow: 1, gen: { name: `Upper A · Wk ${w + 1}`, blocks: [strength("Barbell Bench Press", 4, "8", "120s"), strength("Barbell Row", 4, "10", "90s"), strength("Incline DB Press", 3, "12", "75s"), strength("Lat Pulldown", 3, "12", "75s"), strength("Lateral Raise", 3, "15", "45s")] } },
      { dow: 2, gen: { name: `Lower A · Wk ${w + 1}`, blocks: [strength("Back Squat", 4, "8", "150s"), strength("Romanian Deadlift", 3, "10", "120s"), strength("Walking Lunge", 3, "12/leg", "90s"), strength("Standing Calf Raise", 4, "15", "45s")] } },
      { dow: 4, gen: { name: `Upper B · Wk ${w + 1}`, blocks: [strength("Overhead Press", 4, "8", "120s"), strength("Pull-Up", 4, "8-10", "90s"), strength("Dips", 3, "12", "75s"), strength("DB Biceps Curl", 3, "12", "60s"), strength("Triceps Pushdown", 3, "15", "45s")] } },
      { dow: 5, gen: { name: `Lower B · Wk ${w + 1}`, blocks: [strength("Conventional Deadlift", 4, "6", "180s"), strength("Hip Thrust", 3, "12", "90s"), strength("Leg Curl", 3, "12", "60s"), strength("Hanging Leg Raise", 3, "12", "60s")] } },
    ],
  },
  {
    id: "bench-8",
    name: "8-Week Bench Specialization",
    weeks: 8,
    daysPerWeek: 3,
    blurb: "Bring up your bench — heavy, volume and speed work each week.",
    week: (w) => {
      const pct = Math.min(95, 70 + w * 3);
      return [
        { dow: 1, gen: { name: `Heavy Bench · Wk ${w + 1}`, blocks: [strength("Barbell Bench Press", 5, `3 @ ${pct}%`, "180s"), strength("Overhead Press", 3, "6", "120s"), strength("Dips", 3, "AMRAP", "90s")] } },
        { dow: 3, gen: { name: `Volume Bench · Wk ${w + 1}`, blocks: [strength("Incline DB Press", 4, "10", "90s"), strength("Barbell Row", 4, "10", "90s"), strength("Triceps Pushdown", 4, "12", "60s"), strength("Face Pull", 3, "15", "45s")] } },
        { dow: 5, gen: { name: `Speed Bench · Wk ${w + 1}`, blocks: [strength("Barbell Bench Press", 8, "3 @ 60% · fast", "90s"), strength("Pull-Up", 4, "8", "90s"), strength("Lateral Raise", 3, "15", "45s")] } },
      ];
    },
  },
  {
    id: "squat-10",
    name: "10-Week Squat Builder",
    weeks: 10,
    daysPerWeek: 3,
    blurb: "Add to your squat with heavy, volume and a technique day.",
    week: (w) => {
      const pct = Math.min(92, Math.round(70 + w * 2.5));
      return [
        { dow: 1, gen: { name: `Heavy Squat · Wk ${w + 1}`, blocks: [strength("Back Squat", 5, `3 @ ${pct}%`, "210s"), strength("Romanian Deadlift", 3, "8", "120s"), strength("Hanging Leg Raise", 3, "12", "60s")] } },
        { dow: 3, gen: { name: `Front Squat · Wk ${w + 1}`, blocks: [strength("Front Squat", 4, "5", "180s"), strength("Walking Lunge", 3, "10/leg", "90s"), strength("Standing Calf Raise", 4, "15", "45s")] } },
        { dow: 5, gen: { name: `Volume Squat · Wk ${w + 1}`, blocks: [strength("Back Squat", 5, "8 @ 65%", "150s"), strength("Leg Curl", 3, "12", "60s"), strength("Plank", 3, "45s", "45s")] } },
      ];
    },
  },
  {
    id: "engine-8",
    name: "8-Week Conditioning Engine",
    weeks: 8,
    daysPerWeek: 4,
    blurb: "Build a bigger gas tank — intervals, tempo and mixed-modal metcons.",
    week: (w) => [
      { dow: 1, gen: { name: `Intervals · Wk ${w + 1}`, blocks: [{ kind: "note", title: "Rowing intervals", text: `${5 + Math.floor(w / 2)} × 500m, rest 2:00`, logResult: true, scoreType: "time" }, strength("Back Squat", 3, "5", "150s")] } },
      { dow: 2, gen: { name: `Tempo · Wk ${w + 1}`, blocks: [{ kind: "note", title: "Tempo run / bike", text: `${20 + w * 2} min @ conversational-hard` }] } },
      { dow: 4, gen: { name: `Metcon · Wk ${w + 1}`, blocks: [{ kind: "note", title: `AMRAP ${12 + w} min`, text: "10 cal row · 10 KB swing · 10 burpees", logResult: true, scoreType: "rounds", levels: true }, strength("Barbell Bench Press", 3, "8", "120s")] } },
      { dow: 6, gen: { name: `Long & Easy · Wk ${w + 1}`, blocks: [{ kind: "note", title: "Zone-2 cardio", text: `${30 + w * 3} min easy — nose breathing` }] } },
    ],
  },
];

/** Every workout for a plan, stamped across consecutive weeks from `weekIso(w)`. */
export function buildPlanWorkouts(
  t: ProgramTemplate,
  exercises: Exercise[],
  weekIso: (w: number) => string,
  tag?: { planKey: string; planName: string },
): Workout[] {
  const out: Workout[] = [];
  for (let w = 0; w < t.weeks; w++) {
    const ws = weekIso(w);
    for (const { dow, gen } of t.week(w)) out.push({ ...toWorkout(gen, exercises, dow, ws), ...tag });
  }
  return out;
}

export const planSessionCount = (t: ProgramTemplate) => t.weeks * t.daysPerWeek;
