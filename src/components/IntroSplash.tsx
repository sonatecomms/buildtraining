"use client";

import { useEffect, useState } from "react";
import { B_PATH, KETTLEBELL_PATH, KB_PIVOT } from "./BrandMark";

// Launch animation: a kettlebell swings in from up-and-behind on a pendulum
// arc, falls down through the B, and at the moment it reaches rest it carves the
// kettlebell-shaped negative space — the swinging bell fades out exactly as the
// cutout punches in, so the eye reads it as one object becoming the hole. Then
// the BUILD wordmark fades up, holds, and the overlay clears (~1.9s total).
//
// Plays once per app launch (sessionStorage), skipped under reduced motion. Tap
// anywhere to skip. The timings live as CSS custom props / keyframes in
// globals.css so they stay tunable in one place.

const DURATION = 1900; // ms until the overlay unmounts

export function IntroSplash() {
  // Start VISIBLE so the overlay is in the server-rendered HTML and covers the
  // app from the first paint (no peek-through). The effect only decides WHEN to
  // dismiss it: immediately if it should be skipped, otherwise after the run.
  const [phase, setPhase] = useState<"playing" | "done">("playing");

  useEffect(() => {
    const finish = () => {
      setPhase("done");
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
        <svg viewBox="0 0 200 200" className="build-splash-mark" aria-label="BUILD" role="img">
          {/* the solid B, with a subtle impact bounce when the bell lands */}
          <path className="build-b" d={B_PATH} fill="var(--color-forest)" />

          {/* faint ring that pulses out of the impact point */}
          <circle
            className="build-impact-ring"
            cx={KB_PIVOT.x}
            cy={120}
            r={42}
            fill="none"
            stroke="var(--color-forest)"
            strokeWidth={3}
          />

          {/* the bone cutout: hidden until impact, then punches in to scale,
              making it look like the swinging bell knocked the hole through */}
          <path
            className="build-kb-cut"
            d={KETTLEBELL_PATH}
            fill="var(--background)"
            fillRule="evenodd"
          />

          {/* the swinging kettlebell: pendulum about a pivot above the B, then
              fades out the instant the cutout appears */}
          <path
            className="build-kb-swing"
            d={KETTLEBELL_PATH}
            fill="var(--background)"
            fillRule="evenodd"
          />
        </svg>

        <span className="build-word">BUILD</span>
      </div>
    </div>
  );
}
