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
  const [id, setId] = useState<string>(BUILD_DEFAULT.id);
  const [mode, setModeState] = useState<SurfaceMode>("cream");

  // Restore the demo selection on mount (client-only; SSR stays on the default
  // brand + cream shell so first paint matches the served HTML).
  useEffect(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId) setId(savedId);
      const savedMode = localStorage.getItem(MODE_KEY);
      if (savedMode === "light" || savedMode === "dark") setModeState(savedMode);
    } catch {
      /* storage unavailable */
    }
  }, []);

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
