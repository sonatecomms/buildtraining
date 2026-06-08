import type { GoalType } from "./types";

export const GOALS: Record<
  GoalType,
  { label: string; blurb: string; icon: string }
> = {
  strength: { label: "Gain Strength", blurb: "Lift heavier over time", icon: "🏋️" },
  muscle_gain: { label: "Build Muscle", blurb: "Add lean mass", icon: "💪" },
  cardio: { label: "Up Cardio", blurb: "Improve heart & lungs", icon: "❤️" },
  endurance: { label: "Endurance", blurb: "Go longer, recover faster", icon: "🏃" },
  mobility: { label: "Mobility", blurb: "Move better, stay supple", icon: "🤸" },
  weight_loss: { label: "Lose Weight", blurb: "Lean out, cut fat", icon: "🔥" },
};

export const ALL_GOALS = Object.keys(GOALS) as GoalType[];
