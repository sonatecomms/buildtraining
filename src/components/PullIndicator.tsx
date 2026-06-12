"use client";

// The little badge that follows a pull-to-refresh drag down from the top of the
// screen: a circular arrow that rotates with the pull, then spins once the
// refresh fires. Driven by `pull` (px) / `refreshing` from useAppGestures.
// TRIGGER is shared with the hook so the "ready" state always matches the fire point.
import { PULL_TRIGGER as TRIGGER } from "@/lib/useAppGestures";

export function PullIndicator({ pull, refreshing }: { pull: number; refreshing: boolean }) {
  if (pull <= 0 && !refreshing) return null;
  const progress = Math.min(1, pull / TRIGGER);
  const ready = pull >= TRIGGER || refreshing;
  const stroke = ready ? "var(--color-forest)" : "var(--color-slate)";
  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-30 flex justify-center pointer-events-none"
      style={{ transform: `translateY(${(refreshing ? TRIGGER : pull) - 44}px)`, transition: "transform 0.2s ease-out" }}
    >
      <div
        className="grid place-items-center w-9 h-9 rounded-full bg-surface border border-line"
        style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.12)", opacity: Math.max(0.4, progress) }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={stroke}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={refreshing ? "build-pull-spin" : undefined}
          style={!refreshing ? { transform: `rotate(${progress * 270}deg)` } : undefined}
        >
          {/* clean circular-arrow refresh glyph (Feather rotate-cw), arrowhead tangent to the arc */}
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          <path d="M23 4v6h-6" />
        </svg>
      </div>
    </div>
  );
}
