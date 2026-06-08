import type { Exercise } from "./types";

// Cardio / wellness activities the athlete can log (run, walk, yoga, etc.).
// `activity: true` makes the logger show Duration + Distance instead of weight/reps.
export const ACTIVITIES: Exercise[] = [
  { id: "act-run", name: "Outdoor Run", category: "Activity", equipment: "Other", primaryMuscle: "Cardio", activity: true },
  { id: "act-trailrun", name: "Trail Run", category: "Activity", equipment: "Other", primaryMuscle: "Cardio", activity: true },
  { id: "act-jog", name: "Easy Jog", category: "Activity", equipment: "Other", primaryMuscle: "Cardio", activity: true },
  { id: "act-walk", name: "Walk", category: "Activity", equipment: "Other", primaryMuscle: "Cardio", activity: true },
  { id: "act-hike", name: "Hike", category: "Activity", equipment: "Other", primaryMuscle: "Cardio / Legs", activity: true },
  { id: "act-ruck", name: "Rucking", category: "Activity", equipment: "Other", primaryMuscle: "Full Body / Cardio", activity: true },
  { id: "act-bike", name: "Cycling (Outdoor)", category: "Activity", equipment: "Other", primaryMuscle: "Legs / Cardio", activity: true },
  { id: "act-swim", name: "Swim", category: "Activity", equipment: "Other", primaryMuscle: "Full Body / Cardio", activity: true },
  { id: "act-yoga", name: "Yoga", category: "Activity", equipment: "Bodyweight", primaryMuscle: "Mobility", activity: true },
  { id: "act-pilates", name: "Pilates", category: "Activity", equipment: "Bodyweight", primaryMuscle: "Core / Mobility", activity: true },
  { id: "act-mobility", name: "Stretching / Mobility", category: "Activity", equipment: "Bodyweight", primaryMuscle: "Mobility", activity: true },
  { id: "act-elliptical", name: "Elliptical", category: "Activity", equipment: "Cardio Machine", primaryMuscle: "Cardio", activity: true },
  { id: "act-stairs", name: "Stair Climber", category: "Activity", equipment: "Cardio Machine", primaryMuscle: "Legs / Cardio", activity: true },
  { id: "act-row-cardio", name: "Rowing (Cardio)", category: "Activity", equipment: "Cardio Machine", primaryMuscle: "Full Body / Cardio", activity: true },
  { id: "act-sport", name: "Sport / Pickup Game", category: "Activity", equipment: "Other", primaryMuscle: "Full Body", activity: true },
];
