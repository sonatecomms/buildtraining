"use client";

import { useEffect, useState } from "react";
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

  // iOS overlays the on-screen keyboard without resizing the layout viewport, so a
  // `vh`-sized sheet ends up partly behind the keyboard. Bind the overlay to the
  // *visual* viewport instead so the sheet always sits in the visible area.
  const [vpHeight, setVpHeight] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => setVpHeight(vv.height);
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex flex-col bg-ink/40 backdrop-blur-sm h-[100dvh]"
      style={vpHeight ? { height: vpHeight } : undefined}
    >
      <div className="flex-1 min-h-0" onClick={onClose} />
      <div
        className="bg-bone border-t border-line rounded-t-3xl max-w-2xl w-full mx-auto flex flex-col min-h-0 animate-pop"
        style={{ maxHeight: "85%" }}
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
