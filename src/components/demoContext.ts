"use client";

import { createContext, useContext } from "react";

// Demo context lives in its own module so leaf components (e.g. the nav) can read
// demo state without importing DemoMode — which pulls in the whole app shell and
// would create an import cycle.

export type DemoRole = "coach" | "athlete";

export type DemoCtx = {
  active: boolean;
  role: DemoRole;
  enter: (user: string, pass: string) => boolean;
  exit: () => void;
  setRole: (r: DemoRole) => void;
};

export const DemoContext = createContext<DemoCtx | null>(null);

export function useDemo(): DemoCtx {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoModeProvider");
  return ctx;
}

// Safe accessor — never throws; reports whether demo mode is active.
export function useIsDemo(): boolean {
  return useContext(DemoContext)?.active ?? false;
}
