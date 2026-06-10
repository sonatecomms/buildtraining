"use client";

import { useEffect, useState } from "react";
import { MARK_W, MARK_H, B_SOLID_PATH, KETTLEBELL_PATH, KB_PIVOT, KB_CENTER } from "./markPaths";
import { markIntroDone } from "@/lib/intro";

// Launch animation: a cast-iron kettlebell swings in the SAGITTAL plane — into
// and out of the screen (depth), not side to side. It emerges deep inside the
// screen pitched away, swings down through the bottom and OUT toward the viewer
// (looming forward at the apex), then comes top-down, pitches back to vertical
// and seats flat into the B. At the moment it lands its iron fill cross-fades to
// the background colour, so the bell BECOMES the negative-space cutout (no layer
// swap), with an impact bounce + ring on contact. Then the overlay clears
// (~1.9s total).
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
              y-axis (up over the top) and z-axis (in from behind, then forward
              toward the viewer) on top of the pendulum rotation. It flies as a
              solid cast-iron bell (.build-kb cross-fades the fill from iron to
              the background colour as it lands) so the forward loom reads, then
              seats as the negative-space cutout. transform-origin = the grip,
              as a % of the box. */}
          <svg
            viewBox={`0 0 ${MARK_W} ${MARK_H}`}
            className="build-splash-swing-layer build-kb-swing"
            aria-hidden
            style={{ transformOrigin: `${(KB_PIVOT.x / MARK_W) * 100}% ${(KB_PIVOT.y / MARK_H) * 100}%` }}
          >
            <path className="build-kb" d={KETTLEBELL_PATH} fill="var(--background)" fillRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
}
