// Hardcoded sample content for the local design-direction preview (/preview).
// Identical across all three directions so only the styling differs.

export const sample = {
  athleteFirst: "Sam",
  day: "Wednesday",
  dateLabel: "Jun 18",
  streak: 12,
  workout: {
    name: "Lower",
    focus: "Strength + Metcon",
    count: 6,
    minutes: 45,
    done: 4,
  },
  movement: {
    name: "Back Squat",
    scheme: "5 × 5",
    rest: "2 min",
    weight: "225",
    sets: "5",
    reps: "5",
    feeling: 4, // 1..5
  },
  metcon: {
    title: "Metcon — “Helen”",
    text: "3 rounds for time:\n400m run\n21 kettlebell swings (53/35)\n12 pull-ups",
    levels: "Rx+ 70/53 · Rx 53/35 · Scale 1 35/26 · Scale 2 ring rows",
    levelOptions: ["Rx+", "Rx", "Scale 1", "Scale 2"],
    level: "Rx", // the level the athlete did
    scoreLabel: "Time",
    score: "9:42",
    feeling: 4,
  },
  pr: {
    lift: "Back Squat",
    value: "315",
    unit: "lb",
    sub: "1-rep max · +10 since April",
  },
  numbers: [
    { lift: "Deadlift", value: "405" },
    { lift: "Bench", value: "225" },
    { lift: "Clean", value: "185" },
  ],
  coachAthlete: {
    name: "Abby Richie",
    goals: ["Strength", "Conditioning"],
    week: "3/4 this wk",
    last: "2d ago",
    behind: true,
  },
};

export const FEELINGS = ["😣", "😕", "😐", "🙂", "😄"]; // 1..5

export const NAV = [
  { id: "train", label: "Train", icon: "dumbbell" as const },
  { id: "numbers", label: "Numbers", icon: "chart" as const },
  { id: "library", label: "Library", icon: "home" as const },
  { id: "timer", label: "Timer", icon: "timer" as const },
  { id: "you", label: "You", icon: "user" as const },
];
