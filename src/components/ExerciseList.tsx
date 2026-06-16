"use client";

import { useMemo, useState } from "react";
import { Play, Plus, Search, X } from "lucide-react";
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

// A color + glyph per category so the list reads at a glance instead of as one
// undifferentiated wall of rows. Colors map onto the brand palette tints.
const CAT_META: Record<string, { dot: string; glyph: string }> = {
  Olympic: { dot: "#a12323", glyph: "🏋️" },
  Gymnastics: { dot: "#7438a6", glyph: "🤸" },
  Conditioning: { dot: "#c2410c", glyph: "🔥" },
  "Lower Body": { dot: "#357836", glyph: "🦵" },
  Push: { dot: "#2f5563", glyph: "💪" },
  Pull: { dot: "#1d4ed8", glyph: "🪢" },
  Core: { dot: "#b45309", glyph: "🎯" },
  "Full Body": { dot: "#19350c", glyph: "🧍" },
  Cardio: { dot: "#be123c", glyph: "❤️" },
  Mobility: { dot: "#0d9488", glyph: "🧘" },
  Activity: { dot: "#6fa9bb", glyph: "🚶" },
};
const catMeta = (c: string) => CAT_META[c] ?? { dot: "#5c6f76", glyph: "🎬" };

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
  // Default to the full library; Recent stays available as a tab but isn't pre-selected.
  const [cat, setCat] = useState<Filter>("All");
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

  // When simply browsing the whole library, break it into labeled category
  // sections so it's scannable; otherwise (search / a single category / recent)
  // a flat list is clearer.
  const grouped = cat === "All" && !q.trim();
  const sections = useMemo(() => {
    if (!grouped) return null;
    const order = CATEGORIES.filter((c) => c !== "All") as ExerciseCategory[];
    return order
      .map((c) => ({ cat: c, items: filtered.filter((e) => e.category === c) }))
      .filter((s) => s.items.length > 0);
  }, [grouped, filtered]);

  const renderRow = (ex: Exercise) => {
    const thumb = youtubeThumb(ex.youtubeUrl);
    const meta = catMeta(ex.category);
    // pick mode → choose the exercise; browse mode → play the demo in-app
    const onClick = onPick
      ? () => onPick(ex)
      : ex.youtubeUrl
        ? () => setPlaying({ url: ex.youtubeUrl!, name: ex.name })
        : undefined;
    return (
      <Card
        key={ex.id}
        className="p-2.5 flex items-center gap-3 active:bg-surface-2"
        onClick={onClick}
      >
        <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-field shrink-0 flex items-center justify-center">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-xl opacity-70">{meta.glyph}</span>
          )}
          {/* play affordance only in browse mode where the row opens a video */}
          {!onPick && ex.youtubeUrl && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="grid place-items-center w-7 h-7 rounded-full bg-black/55 text-white">
                <Play size={13} className="ml-0.5 fill-current" />
              </span>
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{ex.name}</p>
          <p className="text-xs text-slate truncate">{ex.primaryMuscle}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: meta.dot }}
                aria-hidden
              />
              {ex.category}
            </span>
            <Pill tone="sky">{ex.equipment}</Pill>
            {ex.custom && <Pill tone="brick">Custom</Pill>}
          </div>
        </div>
        {onPick ? (
          <span className="grid place-items-center w-8 h-8 rounded-full bg-forest/10 text-forest shrink-0">
            <Plus size={18} />
          </span>
        ) : null}
      </Card>
    );
  };

  return (
    <div>
      {/* Pinned so the search field + filters stay put while results scroll
          (and never slip behind the on-screen keyboard). */}
      <div className="sticky top-0 z-10 bg-shell pt-3 pb-2 -mx-1 px-1">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none"
          />
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
            className="w-full rounded-xl bg-surface border border-line pl-10 pr-10 py-2.5 text-sm outline-none focus:border-forest [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center w-6 h-6 rounded-full text-slate hover:text-ink active:scale-90 transition-transform"
            >
              <X size={15} />
            </button>
          )}
        </div>
        {/* wraps into a chip cloud so every category is visible at once — no
            sideways scrolling to hunt for a filter */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                cat === c ? "bg-forest text-bone" : "bg-surface border border-line text-slate"
              }`}
            >
              {c === "Recent" ? "⭐ Recent" : c}
            </button>
          ))}
        </div>
        {/* a quiet count so the list scope is always clear */}
        <p className="text-[11px] text-slate/80 mt-2 px-0.5">
          {filtered.length} {filtered.length === 1 ? "movement" : "movements"}
          {cat !== "All" && cat !== "Recent" ? ` · ${cat}` : ""}
        </p>
      </div>

      {sections ? (
        <div className="pt-1 space-y-4">
          {sections.map((s) => (
            <section key={s.cat}>
              <div className="flex items-center gap-2 px-0.5 pb-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: catMeta(s.cat).dot }}
                  aria-hidden
                />
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate">
                  {s.cat}
                </h3>
                <span className="text-[11px] text-slate/70">{s.items.length}</span>
              </div>
              <div className="space-y-2">{s.items.map(renderRow)}</div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          {filtered.map(renderRow)}
          {filtered.length === 0 && (
            <div className="text-center py-10">
              <p className="text-slate text-sm">No movements match.</p>
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="mt-2 text-sm font-semibold text-forest underline underline-offset-2"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {playing && (
        <VideoModal url={playing.url} title={playing.name} onClose={() => setPlaying(null)} />
      )}
    </div>
  );
}
