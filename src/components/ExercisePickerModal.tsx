"use client";

import { useExercises } from "@/lib/store";
import type { Exercise } from "@/lib/types";
import ExerciseList from "./ExerciseList";

export default function ExercisePickerModal({
  title = "Add movement",
  onClose,
  onPick,
}: {
  title?: string;
  onClose: () => void;
  onPick: (ex: Exercise) => void;
}) {
  const exercises = useExercises();

  return (
    <div
      data-noswipe
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bone w-full sm:max-w-lg max-h-[88dvh] sm:max-h-[85dvh] rounded-t-3xl sm:rounded-3xl border border-line shadow-hero flex flex-col min-h-0 animate-pop overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
          <h2 className="font-bold">{title}</h2>
          <button onClick={onClose} className="text-slate text-2xl leading-none px-2" aria-label="Close">×</button>
        </div>
        <div
          className="overflow-y-auto px-4 min-h-0 flex-1 overscroll-contain"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <ExerciseList
            exercises={exercises}
            onPick={(ex) => {
              onPick(ex);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
