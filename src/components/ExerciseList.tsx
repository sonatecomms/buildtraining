"use client";

import { useMemo, useState } from "react";
import type { Exercise, ExerciseCategory } from "@/lib/types";
import { youtubeThumb } from "@/lib/youtube";
import { Card, Pill } from "./ui";

const CATEGORIES: (ExerciseCategory | "All")[] = [
  "All",
  "Lower Body",
  "Push",
  "Pull",
  "Core",
  "Cardio",
  "Mobility",
  "Full Body",
  "Olympic",
];

// Shared browsable list. `onPick` turns each row into a tappable picker (used in
// the program builder); without it, rows just open the demo video.
export default function ExerciseList({
  exercises,
  onPick,
}: {
  exercises: Exercise[];
  onPick?: (ex: Exercise) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return exercises.filter((e) => {
      const matchCat = cat === "All" || e.category === cat;
      const matchQ =
        !needle ||
        e.name.toLowerCase().includes(needle) ||
        e.primaryMuscle.toLowerCase().includes(needle) ||
        e.equipment.toLowerCase().includes(needle);
      return matchCat && matchQ;
    });
  }, [exercises, q, cat]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search movement, muscle, equipment…"
        className="w-full rounded-xl bg-surface border border-line px-4 py-2.5 text-sm outline-none focus:border-forest mb-3"
      />
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-3 -mx-1 px-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              cat === c ? "bg-forest text-bone" : "bg-surface border border-line text-slate"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((ex) => {
          const thumb = youtubeThumb(ex.youtubeUrl);
          const body = (
            <Card className="p-2.5 flex items-center gap-3" onClick={onPick ? () => onPick(ex) : undefined}>
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-field shrink-0 flex items-center justify-center">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">🎬</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{ex.name}</p>
                <p className="text-xs text-slate truncate">{ex.primaryMuscle}</p>
                <div className="flex gap-1.5 mt-1">
                  <Pill tone="sky">{ex.equipment}</Pill>
                  {ex.custom && <Pill tone="brick">Custom</Pill>}
                </div>
              </div>
              {onPick ? (
                <span className="text-forest font-bold text-lg pr-1">+</span>
              ) : (
                ex.youtubeUrl && <span className="text-slate text-xs pr-1">▶</span>
              )}
            </Card>
          );
          // In browse mode, wrap in a link to the video; in pick mode the card handles taps.
          if (!onPick && ex.youtubeUrl) {
            return (
              <a key={ex.id} href={ex.youtubeUrl} target="_blank" rel="noreferrer">
                {body}
              </a>
            );
          }
          return <div key={ex.id}>{body}</div>;
        })}
        {filtered.length === 0 && (
          <p className="text-center text-slate text-sm py-8">No movements match.</p>
        )}
      </div>
    </div>
  );
}
