"use client";

import { useSyncExternalStore } from "react";

// Recently-picked exercises, per-device (not synced — it's a UI convenience, not
// program data). Powers the "Recent" shortcut in the exercise picker so the lifts
// a coach reaches for constantly are one tap away.

const KEY = "build.recentExercises.v1";
const MAX = 12;

let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (cache) return cache;
  if (typeof window === "undefined") return (cache = []);
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

export function pushRecent(id: string) {
  const next = [id, ...read().filter((x) => x !== id)].slice(0, MAX);
  cache = next;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const empty: string[] = [];

export function useRecents(): string[] {
  return useSyncExternalStore(subscribe, read, () => empty);
}
