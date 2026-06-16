import type { CSSProperties } from "react";

// ── White-label demo ────────────────────────────────────────────────────────
// BUILD ships with one brand (forest/green). This module proves the app is
// templatizable: one chosen school re-skins the whole app at runtime by
// overriding the three brand tokens that every utility resolves to
// (--color-forest / --color-green / --color-green-soft). Eight high schools in
// proximity to ZIP 44281 (Wadsworth, OH) — five public, three private — each
// with its real colors and mascot. Collegiate programs would slot in the same
// way.

export type School = {
  id: string;
  name: string; // marquee name, e.g. "Wadsworth Grizzlies"
  mascot: string; // nickname, e.g. "Grizzlies"
  emoji: string; // quick visual stand-in for the mascot
  kind: "public" | "private";
  city: string;
  /** The two identifiable school colors, for the picker swatch. */
  swatch: [string, string];
  /** Brand tokens that drive the theme. forest = dark, green = brand, soft = light. */
  forest: string;
  green: string;
  soft: string;
};

// The native BUILD identity — selecting it clears all overrides.
export const BUILD_DEFAULT: School = {
  id: "build",
  name: "BUILD",
  mascot: "Default",
  emoji: "🏋️",
  kind: "public",
  city: "Default theme",
  swatch: ["#19350C", "#357836"],
  forest: "#19350c",
  green: "#357836",
  soft: "#3f8c41",
};

// Within ~20 minutes of 44281. Colors verified from school/athletic sources.
export const SCHOOLS: School[] = [
  {
    id: "wadsworth",
    name: "Wadsworth Grizzlies",
    mascot: "Grizzlies",
    emoji: "🐻",
    kind: "public",
    city: "Wadsworth",
    swatch: ["#b0142a", "#1a1a1a"], // red & black
    forest: "#7e0e1e",
    green: "#b0142a",
    soft: "#cb2b40",
  },
  {
    id: "medina",
    name: "Medina Battling Bees",
    mascot: "Battling Bees",
    emoji: "🐝",
    kind: "public",
    city: "Medina",
    swatch: ["#1c7a3f", "#f4c300"], // green & gold
    forest: "#115c2d",
    green: "#1c7a3f",
    soft: "#2e9a55",
  },
  {
    id: "brunswick",
    name: "Brunswick Blue Devils",
    mascot: "Blue Devils",
    emoji: "😈",
    kind: "public",
    city: "Brunswick",
    swatch: ["#1e40af", "#ffffff"], // royal blue & white
    forest: "#14307f",
    green: "#1e40af",
    soft: "#3257ce",
  },
  {
    id: "barberton",
    name: "Barberton Magics",
    mascot: "Magics",
    emoji: "🎩",
    kind: "public",
    city: "Barberton",
    swatch: ["#5b2a86", "#ffffff"], // purple & white
    forest: "#421e63",
    green: "#5b2a86",
    soft: "#7438a6",
  },
  {
    id: "revere",
    name: "Revere Minutemen",
    mascot: "Minutemen",
    emoji: "🎖️",
    kind: "public",
    city: "Richfield",
    swatch: ["#b31b34", "#16265f"], // scarlet & navy
    forest: "#16265f",
    green: "#b31b34",
    soft: "#ce3147",
  },
  {
    id: "hoban",
    name: "Archbishop Hoban Knights",
    mascot: "Knights",
    emoji: "⚔️",
    kind: "private",
    city: "Akron",
    swatch: ["#102a52", "#c5a572"], // navy & vegas gold
    forest: "#0e2247",
    green: "#214e91",
    soft: "#2e63b0",
  },
  {
    id: "stvm",
    name: "St. Vincent–St. Mary Fighting Irish",
    mascot: "Fighting Irish",
    emoji: "☘️",
    kind: "private",
    city: "Akron",
    swatch: ["#0f5c3f", "#c5a572"], // green & vegas gold
    forest: "#073b2a",
    green: "#0f5c3f",
    soft: "#1b7a55",
  },
  {
    id: "walsh",
    name: "Walsh Jesuit Warriors",
    mascot: "Warriors",
    emoji: "🛡️",
    kind: "private",
    city: "Cuyahoga Falls",
    swatch: ["#6e1423", "#c9a227"], // maroon & gold
    forest: "#4e0e1a",
    green: "#6e1423",
    soft: "#8c2030",
  },
];

export const ALL_THEMES: School[] = [BUILD_DEFAULT, ...SCHOOLS];

export function schoolById(id: string | null | undefined): School {
  return ALL_THEMES.find((s) => s.id === id) ?? BUILD_DEFAULT;
}

function rgba(hex: string, alpha: number): string {
  const s = hex.replace(/^#/, "");
  const r = parseInt(s.slice(0, 2), 16);
  const g = parseInt(s.slice(2, 4), 16);
  const b = parseInt(s.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * The CSS-variable overrides for a school. Driving the three brand tokens
 * recolors every `bg-forest` / `text-green` / `.build-hero` / FAB / nav / brand
 * mark, since each resolves to these vars. We also retint the elevation shadows
 * (otherwise they stay forest-green). The BUILD default returns no overrides.
 */
export function schoolThemeVars(school: School): CSSProperties {
  if (school.id === BUILD_DEFAULT.id) return {};
  const { forest, green, soft } = school;
  return {
    "--color-forest": forest,
    "--color-green": green,
    "--color-green-soft": soft,
    "--shadow-fab": `0 10px 24px -8px ${rgba(forest, 0.6)}`,
    "--shadow-hero": `0 16px 36px -14px ${rgba(forest, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.22), inset 0 0 0 1px rgba(255,255,255,0.08)`,
    "--shadow-card": `0 1px 2px ${rgba(forest, 0.05)}, 0 10px 28px -12px ${rgba(forest, 0.18)}`,
  } as CSSProperties;
}

// The brand-token keys we set on <html>, so the provider can cleanly remove them.
export const THEME_VAR_KEYS = [
  "--color-forest",
  "--color-green",
  "--color-green-soft",
  "--shadow-fab",
  "--shadow-hero",
  "--shadow-card",
] as const;
