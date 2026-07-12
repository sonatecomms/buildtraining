"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  BUILD_DEFAULT,
  schoolById,
  themeVars,
  THEME_VAR_KEYS,
  type School,
  type SurfaceMode,
} from "@/lib/schoolThemes";

const STORAGE_KEY = "build.schoolTheme";
const MODE_KEY = "build.surfaceMode";
// Snapshot of the computed vars for the pre-paint inline script in layout.tsx,
// so a reload paints the saved skin from the first frame (no default-green
// flash on the launch splash before hydration).
export const VARS_KEY = "build.themeVars";

type Ctx = {
  school: School;
  setSchool: (id: string) => void;
  mode: SurfaceMode;
  setMode: (m: SurfaceMode) => void;
};

const SchoolThemeContext = createContext<Ctx | null>(null);

export function useSchoolTheme(): Ctx {
  const ctx = useContext(SchoolThemeContext);
  if (!ctx) throw new Error("useSchoolTheme must be used within SchoolThemeProvider");
  return ctx;
}

export function SchoolThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize straight from storage (SSR falls back to the default brand).
  // Restoring in a mount effect would apply the default theme for one commit
  // and undo the pre-paint inline script's work — the green-flash bug.
  const [id, setId] = useState<string>(() => {
    if (typeof window === "undefined") return BUILD_DEFAULT.id;
    try {
      return localStorage.getItem(STORAGE_KEY) ?? BUILD_DEFAULT.id;
    } catch {
      return BUILD_DEFAULT.id;
    }
  });
  const [mode, setModeState] = useState<SurfaceMode>(() => {
    if (typeof window === "undefined") return "cream";
    try {
      const saved = localStorage.getItem(MODE_KEY);
      return saved === "light" || saved === "dark" ? saved : "cream";
    } catch {
      return "cream";
    }
  });

  // Apply the chosen school's brand + shell tokens to <html>. Inline custom
  // properties on the root element override the :root values Tailwind's @theme
  // emits, so every utility (bg-forest, .build-hero, bg-shell, text-ink, FABs,
  // nav, brand mark) recolors. color-scheme flips native controls/scrollbars.
  useEffect(() => {
    const root = document.documentElement;
    const vars = themeVars(schoolById(id), mode) as Record<string, string>;
    THEME_VAR_KEYS.forEach((k) => {
      if (vars[k]) root.style.setProperty(k, vars[k]);
      else root.style.removeProperty(k);
    });
    root.style.colorScheme = mode === "dark" ? "dark" : "light";
    // drives the dark-only hero override in globals.css
    if (mode === "dark") root.setAttribute("data-surface", "dark");
    else root.removeAttribute("data-surface");
    // Persist the computed snapshot for the pre-paint script (default = none).
    try {
      if (id === BUILD_DEFAULT.id && mode === "cream") localStorage.removeItem(VARS_KEY);
      else localStorage.setItem(VARS_KEY, JSON.stringify({ vars, dark: mode === "dark" }));
    } catch {
      /* ignore */
    }
  }, [id, mode]);

  const setSchool = useCallback((next: string) => {
    setId(next);
    try {
      if (next === BUILD_DEFAULT.id) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode / storage disabled — theme still applies for the session */
    }
  }, []);

  const setMode = useCallback((next: SurfaceMode) => {
    setModeState(next);
    try {
      if (next === "cream") localStorage.removeItem(MODE_KEY);
      else localStorage.setItem(MODE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <SchoolThemeContext.Provider value={{ school: schoolById(id), setSchool, mode, setMode }}>
      {children}
    </SchoolThemeContext.Provider>
  );
}
