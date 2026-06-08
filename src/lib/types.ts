// Domain model for the coaching app.
// Kept serializable end-to-end so the same shapes map cleanly onto Supabase rows later.

export type GoalType =
  | "strength"
  | "muscle_gain"
  | "cardio"
  | "endurance"
  | "mobility"
  | "weight_loss";

export type ExerciseCategory =
  | "Lower Body"
  | "Upper Body"
  | "Push"
  | "Pull"
  | "Core"
  | "Cardio"
  | "Mobility"
  | "Full Body"
  | "Olympic"
  | "Gymnastics"
  | "Conditioning"
  | "Activity";

export type Equipment =
  | "Barbell"
  | "Dumbbell"
  | "Kettlebell"
  | "Machine"
  | "Cable"
  | "Bodyweight"
  | "Bands"
  | "Cardio Machine"
  | "Medicine Ball"
  | "Rings"
  | "Box"
  | "Sandbag"
  | "Sled"
  | "Jump Rope"
  | "Other";

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  equipment: Equipment;
  primaryMuscle: string;
  youtubeUrl?: string;
  custom?: boolean; // coach-added vs seeded
  // implement/loading options the coach can pick per prescription
  // (e.g. ["Barbell", "Double DB", "Single DB"], ["Both", "Single arm"])
  variants?: string[];
  // cardio/wellness (run, walk, yoga…) — logged with duration/distance, not load
  activity?: boolean;
}

export type BlockType = "single" | "superset" | "circuit" | "note";

export interface ProgramItem {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string; // free text so "8-10", "30s", "AMRAP" all work
  rest: string; // free text: "90s", "2 min", "1:1", "2:1"…
  tempo?: string;
  notes?: string;
  youtubeUrl?: string; // per-use override; falls back to the exercise's demo
  variant?: string; // chosen implement/side (from the exercise's variants)
}

export interface Block {
  id: string;
  type: BlockType;
  rounds?: number; // for circuits
  items: ProgramItem[];
  // for "note" blocks: free text with no movements (warm-ups, metcons, cues)
  title?: string;
  text?: string;
}

export interface Workout {
  id: string;
  name: string; // "Lower", "Push"…
  dow: number; // day of week the workout is scheduled, 0 = Sunday … 6 = Saturday
  blocks: Block[];
}

export interface Program {
  id: string;
  clientId: string;
  name: string;
  workouts: Workout[];
  updatedAt: string;
}

export interface ClientStats {
  heightFt?: number;
  heightIn?: number;
  weightLb?: number;
  age?: number;
  bodyfatPct?: number;
}

export interface Client {
  id: string;
  name: string;
  avatarUrl?: string; // data URL in local mode, storage URL with Supabase
  stats: ClientStats;
  goals: GoalType[];
  intendedFrequency: number; // sessions / week
  notes?: string;
  athleteEmail?: string; // login email so the athlete can sign in to their own view
  archived?: boolean; // hidden from the active roster, recoverable
  createdAt: string;
}

// What the athlete actually did for one movement during a session.
export interface ItemResult {
  itemId: string;
  exerciseId?: string; // captured at log time so PRs survive program edits
  weight?: string; // free text: "135", "BW", "red band"
  setsDone?: string;
  repsDone?: string;
  duration?: string; // activities: "30 min", "1:05:00"
  distance?: string; // activities: "3 mi", "5k"
  feeling?: number; // 1 (rough) … 5 (great)
  note?: string;
  extra?: boolean; // athlete-added movement, beyond what the coach programmed
}

export interface WorkoutLog {
  id: string;
  clientId: string;
  workoutId: string;
  workoutName: string;
  date: string; // ISO date (yyyy-mm-dd) of completion
  durationMin?: number;
  completedItemIds: string[];
  rpe?: number; // rate of perceived exertion 1-10
  entries?: ItemResult[]; // per-movement results the athlete logged
}

export interface DB {
  clients: Client[];
  programs: Program[];
  exercises: Exercise[];
  logs: WorkoutLog[];
}
