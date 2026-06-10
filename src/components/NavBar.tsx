"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect on the client (measure before paint), useEffect on the server.
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href?: string; // present → renders a <Link> (coach, route-based nav)
}

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// The shared bottom nav. One absolutely-positioned highlighter slides to the
// active tab; the icons pop in (staggered) when the launch splash clears and the
// active icon stays slightly enlarged. Works for both route-based (Link) and
// state-based (button) navigation.
export function NavBar({
  items,
  activeId,
  onSelect,
}: {
  items: NavItem[];
  activeId: string;
  onSelect?: (id: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLElement | null>>({});
  const [ind, setInd] = useState<Rect | null>(null);
  const [animate, setAnimate] = useState(false);
  const [popped, setPopped] = useState(false);

  // Track the active tab's box so the highlighter can slide to it.
  useIso(() => {
    const measure = () => {
      const el = tabRefs.current[activeId];
      if (!el) return;
      setInd({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activeId, items.length]);

  // Enable the slide transition only after the first placement, so the indicator
  // appears already under the active tab instead of flying in from the corner.
  useEffect(() => {
    if (ind && !animate) {
      const id = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(id);
    }
  }, [ind, animate]);

  // Pop the icons to size when the intro splash clears (or immediately if it was
  // skipped). A fallback timer covers the case where the cue never fires.
  useEffect(() => {
    const cue = () => setPopped(true);
    window.addEventListener("build:intro-done", cue);
    const fallback = window.setTimeout(cue, 2600);
    return () => {
      window.removeEventListener("build:intro-done", cue);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-line bg-surface/95 backdrop-blur">
      <div
        ref={wrapRef}
        className={`relative max-w-2xl mx-auto grid`}
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* one shared highlighter, inset a little inside the active cell */}
        <span
          aria-hidden
          className="build-nav-indicator"
          style={{
            left: (ind?.left ?? 0) + 10,
            top: (ind?.top ?? 0) + 6,
            width: Math.max(0, (ind?.width ?? 0) - 20),
            height: Math.max(0, (ind?.height ?? 0) - 12),
            opacity: ind ? 1 : 0,
            transition: animate
              ? "left .28s cubic-bezier(.4,0,.2,1), top .28s cubic-bezier(.4,0,.2,1), width .28s cubic-bezier(.4,0,.2,1), height .28s cubic-bezier(.4,0,.2,1)"
              : "none",
          }}
        />
        {items.map((t, i) => {
          const active = t.id === activeId;
          const inner = (
            <span className={popped ? "build-nav-pop" : undefined} style={popped ? { animationDelay: `${i * 0.1}s` } : undefined}>
              <span className="build-nav-ico">
                <span aria-hidden>{t.icon}</span>
              </span>
              <span className="build-nav-label">{t.label}</span>
            </span>
          );
          const cls = `build-nav-tab relative z-[1] ${active ? "text-forest" : "text-slate"}`;
          return t.href ? (
            <Link
              key={t.id}
              href={t.href}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              data-active={active}
              aria-label={t.label}
              aria-current={active ? "page" : undefined}
              className={cls}
            >
              {inner}
            </Link>
          ) : (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              data-active={active}
              aria-label={t.label}
              aria-current={active ? "true" : undefined}
              onClick={() => onSelect?.(t.id)}
              className={cls}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
