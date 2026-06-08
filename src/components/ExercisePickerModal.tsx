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
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/40 backdrop-blur-sm">
      <div className="flex-1" onClick={onClose} />
      <div className="bg-bone border-t border-line rounded-t-3xl max-w-2xl w-full mx-auto max-h-[85vh] flex flex-col animate-pop">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h2 className="font-bold">{title}</h2>
          <button onClick={onClose} className="text-slate text-2xl leading-none px-2">×</button>
        </div>
        <div className="overflow-y-auto p-4" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
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
