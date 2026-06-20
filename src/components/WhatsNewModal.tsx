"use client";

import { useEffect, useState } from "react";
import { isIntroDone } from "@/lib/intro";
import { whatsNewSince, BUILD_ID, buildDate } from "@/lib/releases";

// "What's new" popup. Fires once per new deployment: the build stamp
// (BUILD_ID = newest commit SHA) is compared to the last one this browser saw.
// The highlights are the commits made since then (auto-generated at build), so
// several deploys before the user opens the app still produce exactly one popup
// listing everything new. When nothing is new, it stays closed.

const STORAGE_KEY = "build:whatsnew:lastSeenBuild";
const SHOW_DELAY = 450; // ms after the intro, so it lands on a settled screen

export function WhatsNewModal() {
  const [highlights, setHighlights] = useState<string[] | null>(null);

  useEffect(() => {
    let lastSeen: string | null = null;
    try {
      lastSeen = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return; // storage blocked — stay quiet rather than nag every load
    }
    const items = whatsNewSince(lastSeen);
    if (!items || items.length === 0) return; // nothing new since last visit

    let timer: number | undefined;
    const reveal = () => {
      timer = window.setTimeout(() => setHighlights(items), SHOW_DELAY);
    };

    // Land after the splash: if it already finished (session revisit where the
    // splash is skipped) show now, otherwise wait for its done signal.
    if (isIntroDone()) {
      reveal();
    } else {
      window.addEventListener("build:intro-done", reveal, { once: true });
    }

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("build:intro-done", reveal);
    };
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, BUILD_ID);
    } catch {
      /* ignore */
    }
    setHighlights(null);
  };

  if (!highlights) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsnew-title"
      onClick={dismiss}
    >
      <div
        className="w-full sm:max-w-md rounded-t-[var(--radius-hero)] sm:rounded-[var(--radius-hero)] overflow-hidden shadow-2xl"
        style={{ background: "var(--color-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* gradient hero header in the brand forest→green */}
        <div
          className="px-6 pt-6 pb-5 text-[var(--color-bone)]"
          style={{ background: "linear-gradient(135deg, var(--color-forest), var(--color-green))" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
            What&apos;s new · {buildDate}
          </p>
          <h2 id="whatsnew-title" className="mt-1 text-2xl font-[var(--font-display)] font-extrabold leading-tight">
            Latest updates
          </h2>
        </div>

        <ul className="px-6 py-5 space-y-3">
          {highlights.map((h, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-snug text-[var(--color-ink)]">
              <span
                aria-hidden
                className="mt-[6px] h-2 w-2 shrink-0 rounded-full"
                style={{ background: "var(--color-green)" }}
              />
              <span>{h}</span>
            </li>
          ))}
        </ul>

        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={dismiss}
            className="w-full rounded-full py-3 text-center text-[15px] font-semibold text-[var(--color-bone)]"
            style={{ background: "var(--color-forest)" }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
