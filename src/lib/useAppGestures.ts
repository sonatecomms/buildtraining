"use client";

import { useEffect, useRef, useState } from "react";

const SLOP = 10; // px before we commit to an axis
const SWIPE_MIN = 60; // px of horizontal travel to switch view on a slow drag
const FLICK_V = 0.5; // px/ms — a quick flick switches view even on a short drag
const FLICK_MIN = 28; // px minimum travel for a flick to count
const X_DOMINANCE = 1.25; // horizontal must beat vertical by this much to own the gesture
const PULL_DAMP = 0.7; // resistance on the pull-to-refresh drag; lighter = shorter drag,
                       // so the pull can start anywhere on screen (not just near the top)
export const PULL_TRIGGER = 52; // px (after damping) to fire a refresh (shared with the indicator)
const PULL_MAX = 120; // px (after damping) the indicator travels

// Walk up from the touch target: if any ancestor scrolls horizontally, this
// gesture belongs to that scroller (week strip, filter chips, …), not us.
function inHorizontalScroller(start: EventTarget | null): boolean {
  let n = start as HTMLElement | null;
  while (n && n !== document.body) {
    if (n.scrollWidth > n.clientWidth + 4) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === "auto" || ox === "scroll") return true;
    }
    n = n.parentElement;
  }
  return false;
}

// One touch gesture handler for the whole app shell, with a proper axis lock so
// it never fights vertical scrolling. The axis is decided ONCE per gesture (the
// previous version re-decided every move, which cancelled scroll mid-flick —
// the source of the jank). Horizontal → view swipe; a downward drag that starts
// at the very top → pull-to-refresh.
export function useAppGestures<T extends HTMLElement>({
  onSwipe,
  onRefresh,
}: {
  onSwipe?: (dir: 1 | -1) => void;
  onRefresh?: () => void;
}) {
  const ref = useRef<T>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);

  // keep the latest callbacks without re-binding listeners
  const cb = useRef({ onSwipe, onRefresh });
  useEffect(() => {
    cb.current = { onSwipe, onRefresh };
  }, [onSwipe, onRefresh]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let sx = 0;
    let sy = 0;
    let stime = 0;
    let axis: "" | "x" | "y" = "";
    let blocked = false; // gesture began on a scroller/slider → leave it alone
    let atTop = false;
    let pulling = false;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || refreshingRef.current) {
        blocked = true;
        return;
      }
      const t = e.touches[0];
      sx = t.clientX;
      sy = t.clientY;
      stime = e.timeStamp;
      axis = "";
      pulling = false;
      const target = e.target as HTMLElement;
      blocked =
        inHorizontalScroller(target) ||
        !!target.closest?.("input[type=range],[data-noswipe]");
      atTop = (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
    };

    const onMove = (e: TouchEvent) => {
      if (blocked || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;

      // commit to an axis exactly once, then stick with it for the gesture.
      // Horizontal has to clearly dominate to claim the gesture, so a slightly
      // diagonal scroll never gets hijacked into a page swipe (the "tighter" feel).
      if (!axis) {
        if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
        axis = Math.abs(dx) > Math.abs(dy) * X_DOMINANCE ? "x" : "y";
      }

      if (axis === "x") {
        if (!cb.current.onSwipe) return; // nothing to navigate here
        e.preventDefault(); // we own horizontal; lock scroll for the gesture
      } else if (atTop && dy > 0 && cb.current.onRefresh) {
        pulling = true;
        e.preventDefault(); // take over from the native rubber-band
        setPull(Math.min(PULL_MAX, dy * PULL_DAMP));
      }
    };

    const finish = (e: TouchEvent) => {
      if (!blocked) {
        const t = e.changedTouches[0];
        const dx = t.clientX - sx;
        const dy = t.clientY - sy;
        const vx = Math.abs(dx) / Math.max(1, e.timeStamp - stime); // px/ms
        // fire on a long-enough drag OR a quick flick, as long as the motion
        // stayed dominantly horizontal — crisper than a pure distance gate
        if (
          axis === "x" &&
          cb.current.onSwipe &&
          Math.abs(dx) > Math.abs(dy) * 1.3 &&
          (Math.abs(dx) >= SWIPE_MIN || (vx >= FLICK_V && Math.abs(dx) >= FLICK_MIN))
        ) {
          cb.current.onSwipe(dx < 0 ? 1 : -1); // left → next, right → prev
        }
        if (pulling) {
          if (dy * PULL_DAMP >= PULL_TRIGGER && cb.current.onRefresh) {
            refreshingRef.current = true;
            setRefreshing(true);
            setPull(PULL_TRIGGER);
            cb.current.onRefresh();
          } else {
            setPull(0);
          }
        }
      }
      axis = "";
      pulling = false;
      blocked = false;
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", finish, { passive: true });
    el.addEventListener("touchcancel", finish, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", finish);
      el.removeEventListener("touchcancel", finish);
    };
  }, []);

  return { ref, pull, refreshing };
}
