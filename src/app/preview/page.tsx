"use client";

// LOCAL-ONLY design-direction preview. Unlinked from app nav. Renders as a
// full-screen overlay (covers the coach shell + bottom nav) so each direction is
// evaluated cleanly at phone width. View while signed in as the coach.
// Remove (or gate) before the real facelift merges.

import { useState } from "react";
import Link from "next/link";
import DirectionRefined from "./DirectionRefined";
import DirectionEditorial from "./DirectionEditorial";
import DirectionBold from "./DirectionBold";
import DirectionBlend from "./DirectionBlend";

type Dir = "AC" | "A" | "B" | "C";

const DIRS: { id: Dir; label: string; blurb: string }[] = [
  { id: "AC", label: "Blend", blurb: "A+C: refined, legible base (layered cards, line icons, big numbers) with energetic color-blocked hero moments." },
  { id: "A", label: "Refined", blurb: "Evolve today’s look — layered surfaces, soft depth, big display numbers, crisp line icons." },
  { id: "B", label: "Editorial", blurb: "Type-forward strength journal — oversized caps, hairline rules, hero numbers, minimal color." },
  { id: "C", label: "Bold", blurb: "Energetic & gamified — color-blocked forest/green hero cards, chunky shapes, emoji energy." },
];

export default function PreviewPage() {
  const [dir, setDir] = useState<Dir>("AC");
  const active = DIRS.find((d) => d.id === dir)!;

  return (
    <div className="fixed inset-0 z-[60] bg-[#dfe3d7] overflow-y-auto overscroll-contain">
      {/* sticky controls */}
      <div className="sticky top-0 z-10 bg-[#dfe3d7]/95 backdrop-blur border-b border-line">
        <div className="max-w-[440px] mx-auto px-4 pt-3 pb-3" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">Facelift preview · local</p>
            <Link href="/" className="text-xs font-semibold text-slate underline">exit</Link>
          </div>
          <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-surface border border-line">
            {DIRS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDir(d.id)}
                className={`rounded-xl py-2 text-xs font-semibold transition-colors ${
                  dir === d.id ? "bg-forest text-bone" : "text-slate"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate mt-2 leading-snug">{active.blurb}</p>
        </div>
      </div>

      {/* phone-width column */}
      <div className="max-w-[440px] mx-auto pb-24">
        {dir === "AC" && <DirectionBlend />}
        {dir === "A" && <DirectionRefined />}
        {dir === "B" && <DirectionEditorial />}
        {dir === "C" && <DirectionBold />}
      </div>
    </div>
  );
}
