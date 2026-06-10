"use client";

import { useEffect, useRef } from "react";

const EDGE_ZONE = 32; // px from a screen edge where a swipe may begin
const SWIPE_MIN = 55; // px of horizontal travel needed to switch
const LOCK_AT = 10; // px of horizontal travel before we lock vertical scroll

// Edge-anchored horizontal swipe to walk between top-level views. The gesture
// must START near a screen edge so it never fights in-content scrolling, drags,
// or sliders, and must read as horizontally dominant. Once it does, we lock out
// vertical scroll for the rest of the gesture — and because framework touch
// listeners are passive (preventDefault is a no-op there), the move handler is
// attached natively as non-passive.
//
// Returns a ref to put on the container element. `onSwipe(1)` = next (swipe
// left), `onSwipe(-1)` = previous (swipe right).
export function useEdgeSwipe<T extends HTMLElement>(onSwipe: (dir: 1 | -1) => void) {
  const ref = useRef<T>(null);
  const cb = useRef(onSwipe);
  // keep the ref pointed at the latest callback without re-binding listeners
  useEffect(() => {
    cb.current = onSwipe;
  }, [onSwipe]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { x: number; y: number } | null = null;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        start = null;
        return;
      }
      const t = e.touches[0];
      const w = window.innerWidth;
      const fromEdge = t.clientX <= EDGE_ZONE || t.clientX >= w - EDGE_ZONE;
      start = fromEdge ? { x: t.clientX, y: t.clientY } : null;
    };

    const onMove = (e: TouchEvent) => {
      if (!start || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) > LOCK_AT && Math.abs(dx) > Math.abs(dy)) e.preventDefault();
    };

    const onEnd = (e: TouchEvent) => {
      const s = start;
      start = null;
      if (!s) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      // ignore vertical-leaning or too-short gestures
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      cb.current(dx < 0 ? 1 : -1); // swipe left advances, swipe right goes back
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, []);

  return ref;
}
