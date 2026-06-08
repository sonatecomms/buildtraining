import type { Client, DB, Exercise, Program } from "./types";

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

  { id: "ex-row-erg", name: "Rowing Erg", category: "Cardio", equipment: "Cardio Machine", primaryMuscle: "Full Body", youtubeUrl: "https://www.youtube.com/watch?v=H0r_ZPXJLtg" },
  { id: "ex-assaultbike", name: "Assault Bike", category: "Cardio", equipment: "Cardio Machine", primaryMuscle: "Full Body", youtubeUrl: "https://www.youtube.com/watch?v=zV2DPjFvtb4" },
  { id: "ex-run", name: "Treadmill Run", category: "Cardio", equipment: "Cardio Machine", primaryMuscle: "Legs / Heart", youtubeUrl: "" },
  { id: "ex-jumprope", name: "Jump Rope", category: "Cardio", equipment: "Other", primaryMuscle: "Calves / Heart", youtubeUrl: "https://www.youtube.com/watch?v=u3zgHI8QnqE" },

  { id: "ex-90-90", name: "90/90 Hip Switch", category: "Mobility", equipment: "Bodyweight", primaryMuscle: "Hips", youtubeUrl: "https://www.youtube.com/watch?v=lro-2Ny8Hgo" },
  { id: "ex-catcow", name: "Cat-Cow", category: "Mobility", equipment: "Bodyweight", primaryMuscle: "Spine", youtubeUrl: "https://www.youtube.com/watch?v=kqnua4rHVVA" },
  { id: "ex-worldsgreatest", name: "World's Greatest Stretch", category: "Mobility", equipment: "Bodyweight", primaryMuscle: "Full Body", youtubeUrl: "https://www.youtube.com/watch?v=tThdHwBycRk" },
  { id: "ex-couchstretch", name: "Couch Stretch", category: "Mobility", equipment: "Bodyweight", primaryMuscle: "Hip Flexors", youtubeUrl: "https://www.youtube.com/watch?v=t8MyZThyhf8" },

  { id: "ex-clean", name: "Power Clean", category: "Olympic", equipment: "Barbell", primaryMuscle: "Full Body", youtubeUrl: "https://www.youtube.com/watch?v=KwYJTpQ_x5A" },
  { id: "ex-kbswing", name: "Kettlebell Swing", category: "Full Body", equipment: "Kettlebell", primaryMuscle: "Posterior Chain", youtubeUrl: "https://www.youtube.com/watch?v=YSxHifyI6s8" },
  { id: "ex-thruster", name: "Thruster", category: "Full Body", equipment: "Barbell", primaryMuscle: "Full Body", youtubeUrl: "https://www.youtube.com/watch?v=L219ltL15zk" },
  { id: "ex-burpee", name: "Burpee", category: "Full Body", equipment: "Bodyweight", primaryMuscle: "Full Body", youtubeUrl: "https://www.youtube.com/watch?v=dZgVxmf6jkA" },
];

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const demoClient: Client = {
  id: "client-jordan",
  name: "Jordan Rivera",
  stats: { heightFt: 5, heightIn: 10, weightLb: 181, age: 31, bodyfatPct: 18 },
  goals: ["strength", "muscle_gain", "mobility"],
  intendedFrequency: 4,
  notes: "Right shoulder tweaks on heavy overhead — keep volume moderate.",
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
          items: [{ id: "i1", exerciseId: "ex-backsquat", sets: 4, reps: "5", restSec: 180, notes: "Build to a hard 5." }],
        },
        {
          id: "b2",
          type: "superset",
          items: [
            { id: "i2", exerciseId: "ex-rdl", sets: 3, reps: "8", restSec: 90 },
            { id: "i3", exerciseId: "ex-legcurl", sets: 3, reps: "12", restSec: 60 },
          ],
        },
        {
          id: "b3",
          type: "circuit",
          rounds: 3,
          items: [
            { id: "i4", exerciseId: "ex-plank", sets: 1, reps: "45s", restSec: 30 },
            { id: "i5", exerciseId: "ex-pallof", sets: 1, reps: "10/side", restSec: 30 },
            { id: "i6", exerciseId: "ex-calfraise", sets: 1, reps: "15", restSec: 30 },
          ],
        },
      ],
    },
    {
      id: "w-push",
      name: "Push",
      dow: 3, // Wednesday
      blocks: [
        { id: "b4", type: "single", items: [{ id: "i7", exerciseId: "ex-bench", sets: 4, reps: "6", restSec: 150 }] },
        {
          id: "b5",
          type: "superset",
          items: [
            { id: "i8", exerciseId: "ex-inclinedb", sets: 3, reps: "10", restSec: 75 },
            { id: "i9", exerciseId: "ex-lateralraise", sets: 3, reps: "15", restSec: 45 },
          ],
        },
        { id: "b6", type: "single", items: [{ id: "i10", exerciseId: "ex-pushdown", sets: 3, reps: "12", restSec: 60 }] },
      ],
    },
    {
      id: "w-pull",
      name: "Pull",
      dow: 5, // Friday
      blocks: [
        { id: "b7", type: "single", items: [{ id: "i11", exerciseId: "ex-deadlift", sets: 3, reps: "3", restSec: 210 }] },
        {
          id: "b8",
          type: "superset",
          items: [
            { id: "i12", exerciseId: "ex-pullup", sets: 4, reps: "AMRAP", restSec: 90 },
            { id: "i13", exerciseId: "ex-row", sets: 4, reps: "8", restSec: 90 },
          ],
        },
        { id: "b9", type: "single", items: [{ id: "i14", exerciseId: "ex-curl", sets: 3, reps: "12", restSec: 60 }] },
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
