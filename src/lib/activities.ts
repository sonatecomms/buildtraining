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
  { id: "act-bike", name: "Cycling (Outdoor)", category: "Activity", equipment: "Other", primaryMuscle: "Legs / Cardio", activity: true, speedUnit: "mph" },
  { id: "act-swim", name: "Swim", category: "Activity", equipment: "Other", primaryMuscle: "Full Body / Cardio", activity: true },
  { id: "act-yoga", name: "Yoga", category: "Activity", equipment: "Bodyweight", primaryMuscle: "Mobility", activity: true, intensity: true },
  { id: "act-pilates", name: "Pilates", category: "Activity", equipment: "Bodyweight", primaryMuscle: "Core / Mobility", activity: true, intensity: true },
  { id: "act-mobility", name: "Stretching / Mobility", category: "Activity", equipment: "Bodyweight", primaryMuscle: "Mobility", activity: true, intensity: true },
  { id: "act-elliptical", name: "Elliptical", category: "Activity", equipment: "Cardio Machine", primaryMuscle: "Cardio", activity: true },
  { id: "act-stairs", name: "Stair Climber", category: "Activity", equipment: "Cardio Machine", primaryMuscle: "Legs / Cardio", activity: true },
  { id: "act-row-cardio", name: "Rowing (Cardio)", category: "Activity", equipment: "Cardio Machine", primaryMuscle: "Full Body / Cardio", activity: true, calories: true },
  { id: "act-sport", name: "Sport / Pickup Game", category: "Activity", equipment: "Other", primaryMuscle: "Full Body", activity: true, intensity: true },
];

// ---- pace math for logged activities -------------------------------------
// Inputs are free text, so parse loosely and bail (null) on anything unclear.

// "30 min" | "30" | "45 sec" | "1 hr" | "1:05:00" | "8:30" → total minutes
export function parseDurationMin(input?: string): number | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (!s) return null;
  if (s.includes(":")) {
    const parts = s.split(":");
    if (parts.length < 2 || parts.length > 3) return null;
    const n = parts.map((p) => parseFloat(p));
    if (n.some((x) => Number.isNaN(x))) return null;
    const [h, m, sec] = n.length === 3 ? n : [0, n[0], n[1]];
    return h * 60 + m + sec / 60;
  }
  const num = parseFloat(s);
  if (Number.isNaN(num)) return null;
  if (s.includes("h")) return num * 60; // 1h, 1.5 hr, 2 hours
  if (s.includes("min")) return num; // 30 min, 30 mins
  if (s.includes("sec") || /s$/.test(s)) return num / 60; // 45s, 45 sec
  return num; // bare number → minutes
}

// "3 mi" | "3" | "5k" | "5 km" | "800m" → miles
export function parseDistanceMi(input?: string): number | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (!s) return null;
  const num = parseFloat(s);
  if (Number.isNaN(num)) return null;
  if (s.includes("mi")) return num; // 3 mi, 3 miles
  if (s.includes("km") || /k$/.test(s)) return num * 0.621371; // 5k, 5 km
  if (s.includes("m")) return num / 1609.344; // 800m, 1500 m → meters
  return num; // bare number → miles
}

// Running pace as "M:SS / mi" from a duration + distance, or null if not derivable.
export function runPace(duration?: string, distance?: string): string | null {
  const min = parseDurationMin(duration);
  const mi = parseDistanceMi(distance);
  if (min == null || mi == null || min <= 0 || mi <= 0) return null;
  const paceMin = min / mi;
  if (!Number.isFinite(paceMin) || paceMin > 60) return null; // sanity guard
  let m = Math.floor(paceMin);
  let sec = Math.round((paceMin - m) * 60);
  if (sec === 60) { m += 1; sec = 0; }
  return `${m}:${String(sec).padStart(2, "0")} / mi`;
}

// Calorie rate as "X.X cal/min" from a duration + calories, or null if not derivable.
export function calsPerMin(duration?: string, calories?: string): string | null {
  const min = parseDurationMin(duration);
  const cal = calories ? parseFloat(calories) : NaN;
  if (min == null || min <= 0 || Number.isNaN(cal) || cal <= 0) return null;
  const rate = cal / min;
  if (!Number.isFinite(rate) || rate > 100) return null; // sanity guard
  return `${rate.toFixed(1)} cal/min`;
}

// Average speed as "X.X mph" from a duration + distance, or null if not derivable.
export function speedMph(duration?: string, distance?: string): string | null {
  const min = parseDurationMin(duration);
  const mi = parseDistanceMi(distance);
  if (min == null || mi == null || min <= 0 || mi <= 0) return null;
  const mph = mi / (min / 60);
  if (!Number.isFinite(mph) || mph <= 0 || mph > 80) return null; // sanity guard
  return `${mph.toFixed(1)} mph`;
}
