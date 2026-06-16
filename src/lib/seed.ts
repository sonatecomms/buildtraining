import type { Client, DB, Exercise, Grade, Program, WorkoutLog } from "./types";
import { CROSSFIT_EXERCISES } from "./crossfit";
import { ACTIVITIES } from "./activities";
import { isoDate } from "./week";

// A starter exercise repository. YouTube links point at well-known form demos.
// Coaches can add their own on top of these.
export const SEED_EXERCISES: Exercise[] = [
  { id: "ex-backsquat", name: "Back Squat", category: "Lower Body", equipment: "Barbell", primaryMuscle: "Quads", youtubeUrl: "https://www.youtube.com/watch?v=ultWZbUMPL8" },
  { id: "ex-frontsquat", name: "Front Squat", category: "Lower Body", equipment: "Barbell", primaryMuscle: "Quads", youtubeUrl: "https://www.youtube.com/watch?v=uYumuL_G_V0" },
  { id: "ex-deadlift", name: "Conventional Deadlift", category: "Lower Body", equipment: "Barbell", primaryMuscle: "Posterior Chain", youtubeUrl: "https://www.youtube.com/watch?v=op9kVnSso6Q" },
  { id: "ex-rdl", name: "Romanian Deadlift", category: "Lower Body", equipment: "Barbell", primaryMuscle: "Hamstrings", youtubeUrl: "https://www.youtube.com/watch?v=JCXUYuzwNrM" },
  { id: "ex-lunge", name: "Walking Lunge", category: "Lower Body", equipment: "Dumbbell", primaryMuscle: "Quads / Glutes", youtubeUrl: "https://www.youtube.com/watch?v=L8fvypPrzzs" },
  { id: "ex-bulgarian", name: "Bulgarian Split Squat", category: "Lower Body", equipment: "Dumbbell", primaryMuscle: "Quads / Glutes", youtubeUrl: "https://www.youtube.com/watch?v=2C-uNgKwPLE" },
  { id: "ex-hipthrust", name: "Hip Thrust", category: "Lower Body", equipment: "Barbell", primaryMuscle: "Glutes", youtubeUrl: "https://www.youtube.com/watch?v=LM8XHLYJoYs" },
  { id: "ex-legcurl", name: "Leg Curl", category: "Lower Body", equipment: "Machine", primaryMuscle: "Hamstrings", youtubeUrl: "https://www.youtube.com/watch?v=1Tq3QdYUuHs" },
  { id: "ex-calfraise", name: "Standing Calf Raise", category: "Lower Body", equipment: "Machine", primaryMuscle: "Calves", youtubeUrl: "https://www.youtube.com/watch?v=-M4-G8p8fmc" },

  { id: "ex-bench", name: "Barbell Bench Press", category: "Push", equipment: "Barbell", primaryMuscle: "Chest", youtubeUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg" },
  { id: "ex-inclinedb", name: "Incline DB Press", category: "Push", equipment: "Dumbbell", primaryMuscle: "Upper Chest", youtubeUrl: "https://www.youtube.com/watch?v=8iPEnn-ltC8" },
  { id: "ex-ohp", name: "Overhead Press", category: "Push", equipment: "Barbell", primaryMuscle: "Shoulders", youtubeUrl: "https://www.youtube.com/watch?v=2yjwXTZQDDI" },
  { id: "ex-dips", name: "Dips", category: "Push", equipment: "Bodyweight", primaryMuscle: "Chest / Triceps", youtubeUrl: "https://www.youtube.com/watch?v=2z8JmcrW-As" },
  { id: "ex-lateralraise", name: "Lateral Raise", category: "Push", equipment: "Dumbbell", primaryMuscle: "Side Delts", youtubeUrl: "https://www.youtube.com/watch?v=3VcKaXpzqRo" },
  { id: "ex-pushdown", name: "Triceps Pushdown", category: "Push", equipment: "Cable", primaryMuscle: "Triceps", youtubeUrl: "https://www.youtube.com/watch?v=2-LAMcpzODU" },

  { id: "ex-pullup", name: "Pull-Up", category: "Pull", equipment: "Bodyweight", primaryMuscle: "Lats", youtubeUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g" },
  { id: "ex-row", name: "Barbell Row", category: "Pull", equipment: "Barbell", primaryMuscle: "Back", youtubeUrl: "https://www.youtube.com/watch?v=9efgcAjQe7E" },
  { id: "ex-latpulldown", name: "Lat Pulldown", category: "Pull", equipment: "Cable", primaryMuscle: "Lats", youtubeUrl: "https://www.youtube.com/watch?v=CAwf7n6Luuc" },
  { id: "ex-facepull", name: "Face Pull", category: "Pull", equipment: "Cable", primaryMuscle: "Rear Delts", youtubeUrl: "https://www.youtube.com/watch?v=rep-qVOkqgk" },
  { id: "ex-curl", name: "DB Biceps Curl", category: "Pull", equipment: "Dumbbell", primaryMuscle: "Biceps", youtubeUrl: "https://www.youtube.com/watch?v=ykJmrZ5v0Oo" },

  { id: "ex-plank", name: "Plank", category: "Core", equipment: "Bodyweight", primaryMuscle: "Core", youtubeUrl: "https://www.youtube.com/watch?v=pSHjTRCQxIw" },
  { id: "ex-hangingleg", name: "Hanging Leg Raise", category: "Core", equipment: "Bodyweight", primaryMuscle: "Lower Abs", youtubeUrl: "https://www.youtube.com/watch?v=Pr1ieGZ5atk" },
  { id: "ex-pallof", name: "Pallof Press", category: "Core", equipment: "Cable", primaryMuscle: "Anti-Rotation", youtubeUrl: "https://www.youtube.com/watch?v=AH_QZLm_0-s" },
  { id: "ex-deadbug", name: "Dead Bug", category: "Core", equipment: "Bodyweight", primaryMuscle: "Core", youtubeUrl: "https://www.youtube.com/watch?v=4XLEnwUr1d8" },

  { id: "ex-row-erg", name: "Rowing Erg", category: "Cardio", equipment: "Cardio Machine", primaryMuscle: "Full Body", activity: true, calories: true, youtubeUrl: "https://www.youtube.com/watch?v=H0r_ZPXJLtg" },
  { id: "ex-assaultbike", name: "Assault Bike", category: "Cardio", equipment: "Cardio Machine", primaryMuscle: "Full Body", activity: true, calories: true, speedUnit: "mph", youtubeUrl: "https://www.youtube.com/watch?v=zV2DPjFvtb4" },
  { id: "ex-run", name: "Treadmill Run", category: "Cardio", equipment: "Cardio Machine", primaryMuscle: "Legs / Heart", activity: true, youtubeUrl: "" },
  { id: "ex-jumprope", name: "Jump Rope", category: "Cardio", equipment: "Other", primaryMuscle: "Calves / Heart", youtubeUrl: "https://www.youtube.com/watch?v=u3zgHI8QnqE" },

  { id: "ex-90-90", name: "90/90 Hip Switch", category: "Mobility", equipment: "Bodyweight", primaryMuscle: "Hips", youtubeUrl: "https://www.youtube.com/watch?v=lro-2Ny8Hgo" },
  { id: "ex-catcow", name: "Cat-Cow", category: "Mobility", equipment: "Bodyweight", primaryMuscle: "Spine", youtubeUrl: "https://www.youtube.com/watch?v=kqnua4rHVVA" },
  { id: "ex-worldsgreatest", name: "World's Greatest Stretch", category: "Mobility", equipment: "Bodyweight", primaryMuscle: "Full Body", youtubeUrl: "https://www.youtube.com/watch?v=tThdHwBycRk" },
  { id: "ex-couchstretch", name: "Couch Stretch", category: "Mobility", equipment: "Bodyweight", primaryMuscle: "Hip Flexors", youtubeUrl: "https://www.youtube.com/watch?v=t8MyZThyhf8" },

  { id: "ex-clean", name: "Power Clean", category: "Olympic", equipment: "Barbell", primaryMuscle: "Full Body", youtubeUrl: "https://www.youtube.com/watch?v=KwYJTpQ_x5A" },
  { id: "ex-kbswing", name: "Kettlebell Swing", category: "Full Body", equipment: "Kettlebell", primaryMuscle: "Posterior Chain", youtubeUrl: "https://www.youtube.com/watch?v=YSxHifyI6s8" },
  { id: "ex-thruster", name: "Thruster", category: "Full Body", equipment: "Barbell", primaryMuscle: "Full Body", youtubeUrl: "https://www.youtube.com/watch?v=L219ltL15zk" },
  { id: "ex-burpee", name: "Burpee", category: "Full Body", equipment: "Bodyweight", primaryMuscle: "Full Body", youtubeUrl: "https://www.youtube.com/watch?v=dZgVxmf6jkA" },
  ...CROSSFIT_EXERCISES,
  ...ACTIVITIES,
];

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

const demoClient: Client = {
  id: "client-jordan",
  name: "Jordan Rivera",
  stats: { heightFt: 5, heightIn: 10, weightLb: 181, age: 31, bodyfatPct: 18 },
  goals: ["strength", "muscle_gain", "mobility"],
  intendedFrequency: 4,
  notes: "Right shoulder tweaks on heavy overhead — keep volume moderate.",
  positions: ["RB", "DB"],
  grade: "Senior",
  createdAt: isoDaysAgo(40),
};

const demoProgram: Program = {
  id: "prog-jordan-1",
  clientId: "client-jordan",
  name: "Strength Base — Block A",
  updatedAt: isoDaysAgo(2),
  workouts: [
    {
      id: "w-lower",
      name: "Lower",
      dow: 1, // Monday
      blocks: [
        {
          id: "b1",
          type: "single",
          items: [{ id: "i1", exerciseId: "ex-backsquat", sets: 4, reps: "5", rest: "180s", notes: "Build to a hard 5." }],
        },
        {
          id: "b2",
          type: "superset",
          items: [
            { id: "i2", exerciseId: "ex-rdl", sets: 3, reps: "8", rest: "90s" },
            { id: "i3", exerciseId: "ex-legcurl", sets: 3, reps: "12", rest: "60s" },
          ],
        },
        {
          id: "b3",
          type: "circuit",
          rounds: 3,
          items: [
            { id: "i4", exerciseId: "ex-plank", sets: 1, reps: "45s", rest: "30s" },
            { id: "i5", exerciseId: "ex-pallof", sets: 1, reps: "10/side", rest: "30s" },
            { id: "i6", exerciseId: "ex-calfraise", sets: 1, reps: "15", rest: "30s" },
          ],
        },
      ],
    },
    {
      id: "w-push",
      name: "Push",
      dow: 3, // Wednesday
      blocks: [
        { id: "b4", type: "single", items: [{ id: "i7", exerciseId: "ex-bench", sets: 4, reps: "6", rest: "150s" }] },
        {
          id: "b5",
          type: "superset",
          items: [
            { id: "i8", exerciseId: "ex-inclinedb", sets: 3, reps: "10", rest: "75s" },
            { id: "i9", exerciseId: "ex-lateralraise", sets: 3, reps: "15", rest: "45s" },
          ],
        },
        { id: "b6", type: "single", items: [{ id: "i10", exerciseId: "ex-pushdown", sets: 3, reps: "12", rest: "60s" }] },
      ],
    },
    {
      id: "w-pull",
      name: "Pull",
      dow: 5, // Friday
      blocks: [
        { id: "b7", type: "single", items: [{ id: "i11", exerciseId: "ex-deadlift", sets: 3, reps: "3", rest: "210s" }] },
        {
          id: "b8",
          type: "superset",
          items: [
            { id: "i12", exerciseId: "ex-pullup", sets: 4, reps: "AMRAP", rest: "90s" },
            { id: "i13", exerciseId: "ex-row", sets: 4, reps: "8", rest: "90s" },
          ],
        },
        { id: "b9", type: "single", items: [{ id: "i14", exerciseId: "ex-curl", sets: 3, reps: "12", rest: "60s" }] },
      ],
    },
  ],
};

export function buildSeedDB(): DB {
  return {
    clients: [demoClient],
    programs: [demoProgram],
    exercises: SEED_EXERCISES,
    // a few prior sessions so the streak/gamification has something to show
    logs: [
      { id: "log-1", clientId: "client-jordan", workoutId: "w-lower", workoutName: "Lower", date: isoDaysAgo(2), durationMin: 58, completedItemIds: [], rpe: 8 },
      { id: "log-2", clientId: "client-jordan", workoutId: "w-push", workoutName: "Push", date: isoDaysAgo(1), durationMin: 47, completedItemIds: [], rpe: 7 },
      { id: "log-3", clientId: "client-jordan", workoutId: "w-pull", workoutName: "Pull", date: isoDaysAgo(0), durationMin: 52, completedItemIds: [], rpe: 8 },
    ],
  };
}

// ── Demo-only roster ─────────────────────────────────────────────────────────
// A full team so the white-label demo (and the Numbers-tab scoreboard) looks
// real. Kept OUT of buildSeedDB so brand-new real coaches aren't seeded with
// fake athletes — only the demo mode uses buildDemoDB().
type TeamMax = {
  id: string;
  name: string;
  lifts: [number, number, number, number, number];
  pos: string[];
  grade: Grade;
};
// maxes order: [clean, bench, back squat, deadlift, overhead press]. Profiles
// vary so the leaderboard reshuffles per lift — Diego is the genetic freak (tops
// nearly everything); linemen (OL/DL) post big bench/squat/deadlift but lower
// cleans; skill players (RB/WR/DB) are explosive (high cleans) with lighter
// absolute pressing.
const DEMO_TEAM: TeamMax[] = [
  { id: "client-diego", name: "Diego Santos", lifts: [275, 320, 440, 525, 210], pos: ["OL", "DL"], grade: "Senior" },
  { id: "client-liam", name: "Liam O'Connor", lifts: [245, 285, 390, 470, 185], pos: ["DL", "TE"], grade: "Junior" },
  { id: "client-marcus", name: "Marcus Bell", lifts: [265, 255, 360, 440, 170], pos: ["LB", "RB"], grade: "Senior" },
  { id: "client-nate", name: "Nate Kowalski", lifts: [195, 290, 430, 500, 195], pos: ["OL"], grade: "Junior" },
  { id: "client-cole", name: "Cole Whitman", lifts: [225, 215, 305, 385, 150], pos: ["WR", "DB"], grade: "Sophomore" },
  { id: "client-andre", name: "Andre Jackson", lifts: [250, 225, 315, 405, 155], pos: ["WR", "RB", "DB"], grade: "Junior" },
  { id: "client-tyler", name: "Tyler Brooks", lifts: [235, 250, 335, 415, 185], pos: ["QB", "ATH"], grade: "Sophomore" },
  { id: "client-ben", name: "Ben Foster", lifts: [215, 205, 285, 365, 145], pos: ["K/P", "WR"], grade: "Freshman" },
];

const SCOREBOARD_IDS = ["ex-clean", "ex-bench", "ex-backsquat", "ex-deadlift", "ex-ohp"] as const;

// Tuned 18% lighter than the raw figures (more realistic HS numbers), rounded
// to the nearest 5 lb.
const MAX_SCALE = 0.82;
const scaleMax = (n: number) => Math.round((n * MAX_SCALE) / 5) * 5;

// Two test sessions per athlete so each lift carries a real test date: a
// lower/Olympic day (clean, squat, deadlift) and an upper day (bench, OHP), a
// few days apart. `base` varies per athlete so dates differ across the roster.
function maxesLogs(clientId: string, lifts: readonly number[], base: number): WorkoutLog[] {
  const entry = (i: number) => ({
    itemId: `m-${i}`,
    exerciseId: SCOREBOARD_IDS[i],
    weight: String(scaleMax(lifts[i])),
  });
  return [
    {
      id: `log-max-${clientId}-a`,
      clientId,
      workoutId: `maxes-${clientId}-a`,
      workoutName: "Max test — lower",
      date: isoDaysAgo(base),
      completedItemIds: [],
      entries: [entry(0), entry(2), entry(3)],
    },
    {
      id: `log-max-${clientId}-b`,
      clientId,
      workoutId: `maxes-${clientId}-b`,
      workoutName: "Max test — upper",
      date: isoDaysAgo(Math.max(1, base - 4)),
      completedItemIds: [],
      entries: [entry(1), entry(4)],
    },
  ];
}

function teamClient(t: TeamMax, i: number): Client {
  return {
    id: t.id,
    name: t.name,
    stats: { heightFt: 5, heightIn: 8 + (i % 5), weightLb: 165 + i * 6, age: 16 + (i % 3) },
    goals: ["strength", "muscle_gain"],
    intendedFrequency: 4,
    positions: t.pos,
    grade: t.grade,
    createdAt: isoDaysAgo(60 - i),
  };
}

/** The demo store: the seed plus a full team, each with tested maxes for the
 *  five scoreboard lifts (clean, bench, squat, deadlift, overhead press). */
export function buildDemoDB(): DB {
  const base = buildSeedDB();
  return {
    ...base,
    clients: [...base.clients, ...DEMO_TEAM.map(teamClient)],
    logs: [
      ...base.logs,
      ...maxesLogs("client-jordan", [255, 245, 355, 435, 165], 6),
      ...DEMO_TEAM.flatMap((t, i) => maxesLogs(t.id, t.lifts, 5 + (i % 6) * 2)),
    ],
  };
}
