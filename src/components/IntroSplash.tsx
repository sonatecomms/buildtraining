"use client";

import { useEffect, useState } from "react";
import { MARK_W, MARK_H, B_SOLID_PATH, KETTLEBELL_PATH, KB_PIVOT, KB_CENTER } from "./markPaths";
import { markIntroDone } from "@/lib/intro";

// Launch animation: a kettlebell swings in from up-and-behind on a pendulum arc,
// falls down through the B, and at the moment it reaches rest it carves the
// kettlebell-shaped negative space — the swinging bell fades out exactly as the
// cutout punches in, so the eye reads it as one object becoming the hole. Then
// the BUILD wordmark fades up, holds, and the overlay clears (~1.9s total).
//
// The mark is an exact trace of the real logo art (see markPaths.ts). Plays once
// per app launch (sessionStorage), skipped under reduced motion, tap to skip.

const DURATION = 1900; // ms until the overlay unmounts

export function IntroSplash() {
  // Start VISIBLE so the overlay is in the server-rendered HTML and covers the
  // app from the first paint (no peek-through). The effect only decides WHEN to
  // dismiss it: immediately if it should be skipped, otherwise after the run.
  const [phase, setPhase] = useState<"playing" | "done">("playing");

  useEffect(() => {
    const finish = () => {
      setPhase("done");
      markIntroDone();
      window.dispatchEvent(new Event("build:intro-done")); // cue the nav icons
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || sessionStorage.getItem("build:intro")) {
      finish();
      return;
    }
    sessionStorage.setItem("build:intro", "1");
    const t = window.setTimeout(finish, DURATION);
    return () => window.clearTimeout(t);
  }, []);

  if (phase === "done") return null;

  return (
    <div className="build-splash" onClick={() => setPhase("done")} role="presentation">
      <div className="build-splash-stack">
        {/* perspective lives on the figure so the swing layer can move in depth */}
        <div className="build-splash-figure">
          <svg viewBox={`0 0 ${MARK_W} ${MARK_H}`} className="build-splash-mark" aria-label="BUILD" role="img">
            {/* the solid B, with a subtle impact bounce when the bell lands */}
            <path className="build-b" d={B_SOLID_PATH} fill="var(--color-forest)" />

            {/* faint ring that pulses out of the impact point */}
            <circle
              className="build-impact-ring"
              cx={KB_CENTER.x}
              cy={KB_CENTER.y}
              r={88}
              fill="none"
              stroke="var(--color-forest)"
              strokeWidth={5}
            />
          </svg>

          {/* the swinging kettlebell, on its own layer so it can travel on the
              y-axis (drops down) and z-axis (swings in from behind, in depth)
              on top of the pendulum rotation, then SETTLES and holds — a bone
              shape over the forest B reads as the cutout, so the last frame of
              the swing IS the finished mark (no separate static layer swapped
              in). transform-origin = the grip, as a % of the box. */}
          <svg
            viewBox={`0 0 ${MARK_W} ${MARK_H}`}
            className="build-splash-swing-layer build-kb-swing"
            aria-hidden
            style={{ transformOrigin: `${(KB_PIVOT.x / MARK_W) * 100}% ${(KB_PIVOT.y / MARK_H) * 100}%` }}
          >
            <path d={KETTLEBELL_PATH} fill="var(--background)" fillRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
}
