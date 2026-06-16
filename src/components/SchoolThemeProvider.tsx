"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  BUILD_DEFAULT,
  schoolById,
  schoolThemeVars,
  THEME_VAR_KEYS,
  type School,
} from "@/lib/schoolThemes";

const STORAGE_KEY = "build.schoolTheme";

type Ctx = {
  school: School;
  setSchool: (id: string) => void;
};

const SchoolThemeContext = createContext<Ctx | null>(null);

export function useSchoolTheme(): Ctx {
  const ctx = useContext(SchoolThemeContext);
  if (!ctx) throw new Error("useSchoolTheme must be used within SchoolThemeProvider");
  return ctx;
}

export function SchoolThemeProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<string>(BUILD_DEFAULT.id);

  // Restore the demo selection on mount (client-only; SSR stays on the default
  // brand so first paint matches the served HTML).
  useEffect(() => {
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) setId(saved);
  }, []);

  // Apply the chosen school's brand tokens to <html>. Inline custom properties
  // on the root element override the :root values that Tailwind's @theme emits,
  // so every utility (bg-forest, .build-hero, FABs, nav, brand mark) recolors.
  useEffect(() => {
    const root = document.documentElement;
    const vars = schoolThemeVars(schoolById(id)) as Record<string, string>;
    THEME_VAR_KEYS.forEach((k) => {
      if (vars[k]) root.style.setProperty(k, vars[k]);
      else root.style.removeProperty(k);
    });
  }, [id]);

  const setSchool = useCallback((next: string) => {
    setId(next);
    try {
      if (next === BUILD_DEFAULT.id) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode / storage disabled — theme still applies for the session */
    }
  }, []);

  return (
    <SchoolThemeContext.Provider value={{ school: schoolById(id), setSchool }}>
      {children}
    </SchoolThemeContext.Provider>
  );
}
