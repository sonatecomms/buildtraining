"use client";

import { useMemo, useState } from "react";
import type { Exercise, ExerciseCategory } from "@/lib/types";
import { youtubeThumb } from "@/lib/youtube";
import { useRecents } from "@/lib/recents";
import { Card, Pill } from "./ui";
import VideoModal from "./VideoModal";

type Filter = ExerciseCategory | "All" | "Recent";

const CATEGORIES: (ExerciseCategory | "All")[] = [
  "All",
  "Olympic",
  "Gymnastics",
  "Conditioning",
  "Lower Body",
  "Push",
  "Pull",
  "Core",
  "Full Body",
  "Cardio",
  "Mobility",
  "Activity",
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
  const recents = useRecents();
  // "Recent" is only useful when picking (program builder / logging an extra)
  const showRecent = !!onPick && recents.length > 0;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Filter>(showRecent ? "Recent" : "All");
  const [playing, setPlaying] = useState<{ url: string; name: string } | null>(null);

  const cats: Filter[] = showRecent ? ["Recent", ...CATEGORIES] : CATEGORIES;

  // recents resolved to exercises, newest first, dropping any that no longer exist
  const recentList = useMemo(() => {
    const map = new Map(exercises.map((e) => [e.id, e]));
    return recents.map((id) => map.get(id)).filter(Boolean) as Exercise[];
  }, [exercises, recents]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = cat === "Recent" ? recentList : exercises;
    return base.filter((e) => {
      const matchCat = cat === "All" || cat === "Recent" || e.category === cat;
      const matchQ =
        !needle ||
        e.name.toLowerCase().includes(needle) ||
        e.primaryMuscle.toLowerCase().includes(needle) ||
        e.equipment.toLowerCase().includes(needle);
      return matchCat && matchQ;
    });
  }, [exercises, recentList, q, cat]);

  return (
    <div>
      {/* Pinned so the search field + filters stay put while results scroll
          (and never slip behind the on-screen keyboard). */}
      <div className="sticky top-0 z-10 bg-bone pt-3 pb-2 -mx-1 px-1">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Search movements"
          placeholder="Search movement, muscle, equipment…"
          className="w-full rounded-xl bg-surface border border-line px-4 py-2.5 text-sm outline-none focus:border-forest"
        />
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mt-2.5">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                cat === c ? "bg-forest text-bone" : "bg-surface border border-line text-slate"
              }`}
            >
              {c === "Recent" ? "⭐ Recent" : c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {filtered.map((ex) => {
          const thumb = youtubeThumb(ex.youtubeUrl);
          // pick mode → choose the exercise; browse mode → play the demo in-app
          const onClick = onPick
            ? () => onPick(ex)
            : ex.youtubeUrl
              ? () => setPlaying({ url: ex.youtubeUrl!, name: ex.name })
              : undefined;
          return (
            <Card key={ex.id} className="p-2.5 flex items-center gap-3" onClick={onClick}>
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
        })}
        {filtered.length === 0 && (
          <p className="text-center text-slate text-sm py-8">No movements match.</p>
        )}
      </div>

      {playing && (
        <VideoModal url={playing.url} title={playing.name} onClose={() => setPlaying(null)} />
      )}
    </div>
  );
}
