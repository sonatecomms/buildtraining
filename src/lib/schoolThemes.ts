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
  {
    id: "cloverleaf",
    name: "Cloverleaf Colts",
    mascot: "Colts",
    emoji: "🐴",
    kind: "public",
    city: "Lodi",
    swatch: ["#1d6b34", "#ffffff"], // forest green & white
    forest: "#124a23",
    green: "#1d6b34",
    soft: "#2c8f49",
  },
  {
    id: "highland",
    name: "Highland Hornets",
    mascot: "Hornets",
    emoji: "🐝",
    kind: "public",
    city: "Medina",
    swatch: ["#1f9d4e", "#1a1a1a"], // kelly green & black
    forest: "#11602b",
    green: "#1f9d4e",
    soft: "#29b85a",
  },
  {
    id: "buckeye",
    name: "Buckeye Bucks",
    mascot: "Bucks",
    emoji: "🦌",
    kind: "public",
    city: "Medina County",
    swatch: ["#5b3a1a", "#e07b1a"], // brown & orange
    forest: "#4a2e12",
    green: "#7a4a1c",
    soft: "#9a5f24",
  },
  {
    id: "norton",
    name: "Norton Panthers",
    mascot: "Panthers",
    emoji: "🐾",
    kind: "public",
    city: "Norton",
    swatch: ["#c01825", "#ffffff"], // red & white
    forest: "#841019",
    green: "#c01825",
    soft: "#d83340",
  },
  {
    id: "coventry",
    name: "Coventry Comets",
    mascot: "Comets",
    emoji: "☄️",
    kind: "public",
    city: "Akron",
    swatch: ["#1d4fd0", "#f4c300"], // royal blue & gold
    forest: "#143a99",
    green: "#1d4fd0",
    soft: "#2f63e0",
  },
  {
    id: "cfalls",
    name: "Cuyahoga Falls Black Tigers",
    mascot: "Black Tigers",
    emoji: "🐯",
    kind: "public",
    city: "Cuyahoga Falls",
    swatch: ["#161616", "#d4af37"], // black & gold
    forest: "#161616",
    green: "#2b2b2b",
    soft: "#3d3d3d",
  },
  {
    id: "green",
    name: "Green Bulldogs",
    mascot: "Bulldogs",
    emoji: "🐶",
    kind: "public",
    city: "Green",
    swatch: ["#d35b12", "#1a1a1a"], // orange & black
    forest: "#8a3a06",
    green: "#d35b12",
    soft: "#ef7320",
  },
  {
    id: "tallmadge",
    name: "Tallmadge Blue Devils",
    mascot: "Blue Devils",
    emoji: "🔱",
    kind: "public",
    city: "Tallmadge",
    swatch: ["#1b54b0", "#f4c300"], // blue & gold
    forest: "#123b80",
    green: "#1b54b0",
    soft: "#2a6ad0",
  },
  {
    id: "chippewa",
    name: "Chippewa Chipps",
    mascot: "Chipps",
    emoji: "🪶",
    kind: "public",
    city: "Doylestown",
    swatch: ["#11244a", "#ffffff"], // navy & white
    forest: "#11244a",
    green: "#1c3a73",
    soft: "#28509a",
  },
];

export const ALL_THEMES: School[] = [BUILD_DEFAULT, ...SCHOOLS];

export function schoolById(id: string | null | undefined): School {
  return ALL_THEMES.find((s) => s.id === id) ?? BUILD_DEFAULT;
}

function toRgb(hex: string): [number, number, number] {
  const s = hex.replace(/^#/, "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function rgba(hex: string, alpha: number): string {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function hex2(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}
/** Blend `t` of `b` into `a` (t in 0..1). Used to tint near-black / near-white. */
function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = toRgb(a);
  const [br, bg, bb] = toRgb(b);
  return `#${hex2(ar + (br - ar) * t)}${hex2(ag + (bg - ag) * t)}${hex2(ab + (bb - ab) * t)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return `#${hex2((r1 + m) * 255)}${hex2((g1 + m) * 255)}${hex2((b1 + m) * 255)}`;
}

/**
 * A category-dot palette derived from a school's two colors: dots alternate
 * between the two color families, each rotated/lightened a touch so categories
 * stay distinguishable while reading as "the school's colors." Grayscale inputs
 * (black/white) become readable neutrals.
 */
export function categoryDotColors(c1: string, c2: string, n: number): string[] {
  const bases = [rgbToHsl(...toRgb(c1)), rgbToHsl(...toRgb(c2))];
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const [h, s] = bases[i % 2];
    const step = Math.floor(i / 2);
    if (s < 0.14) {
      // black / white / gray → a readable neutral, stepping darker for variety
      out.push(hslToHex(h, 0.05, 0.3 + (step % 3) * 0.07));
    } else {
      const sat = Math.min(0.7, Math.max(0.46, s));
      out.push(hslToHex(h + step * 16, sat, 0.4 + (step % 3) * 0.05));
    }
  }
  return out;
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

// The app's default cream shell can feel soft for some programs (e.g. boys'
// teams). The shell can be retinted: "light" = an off-white in the hue of the
// school's lighter color; "dark" = an off-black in the hue of its saturated one.
export type SurfaceMode = "cream" | "light" | "dark";

/**
 * Retint the *shell* (backdrop, cards, inputs, text) for a surface mode, in the
 * chosen school's hue. Composed on top of schoolThemeVars. "cream" leaves the
 * default. In "dark" we also shift the brand one step lighter so emphasis text
 * (`text-forest`) stays legible while the hero/buttons keep enough depth.
 */
export function surfaceVars(school: School, mode: SurfaceMode): CSSProperties {
  if (mode === "cream") return {};
  // Hue source: saturated brand for dark, the school's lighter accent for light.
  const sat = school.id === BUILD_DEFAULT.id ? "#357836" : school.green;
  const lightAccent = sat;

  if (mode === "light") {
    return {
      "--background": mix("#ffffff", lightAccent, 0.05),
      "--color-shell": mix("#ffffff", lightAccent, 0.05),
      "--color-bone": mix("#ffffff", lightAccent, 0.05),
      "--color-surface": "#ffffff",
      "--color-surface-2": mix("#ffffff", lightAccent, 0.09),
      "--color-field": mix("#ffffff", lightAccent, 0.12),
      "--color-line": mix("#e6e7e4", lightAccent, 0.12),
    } as CSSProperties;
  }

  // dark
  return {
    "--background": mix("#0e0e11", sat, 0.1),
    "--color-shell": mix("#17171b", sat, 0.1),
    "--color-surface": mix("#1d1d22", sat, 0.1),
    "--color-surface-2": mix("#26262c", sat, 0.1),
    "--color-field": mix("#2a2a31", sat, 0.1),
    "--color-line": mix("#3a3a44", sat, 0.12),
    "--color-ink": mix("#f3f4f6", sat, 0.03),
    "--color-slate": mix("#aab2bc", sat, 0.06),
    "--color-bone": mix("#f1f3f5", sat, 0.02), // text-on-brand + hero text stay light
    "--color-brick": "#e8607a",
    "--foreground": mix("#f3f4f6", sat, 0.03),
    // Brighten the brand for legible emphasis text / marks on off-black. The
    // hero keeps a dark gradient via --hero-from/-to (see globals) so its light
    // text stays readable even though bg-forest is now a bright accent.
    "--color-forest": mix(school.green, "#ffffff", 0.42),
    "--color-green": mix(school.green, "#ffffff", 0.55),
    "--color-green-soft": mix(school.green, "#ffffff", 0.66),
    "--hero-from": school.forest,
    "--hero-to": school.green,
    "--shadow-card": "0 1px 2px rgba(0,0,0,0.45), 0 10px 28px -14px rgba(0,0,0,0.7)",
    "--shadow-hero": "0 16px 36px -14px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.14)",
    "--shadow-fab": "0 10px 24px -8px rgba(0,0,0,0.7)",
  } as CSSProperties;
}

/** Combined brand + surface overrides for a school in a given surface mode. */
export function themeVars(school: School, mode: SurfaceMode): CSSProperties {
  return { ...schoolThemeVars(school), ...surfaceVars(school, mode) } as CSSProperties;
}

// Every key we may set on <html>, so the provider can cleanly remove the ones
// not in the current theme when switching schools or modes.
export const THEME_VAR_KEYS = [
  "--color-forest",
  "--color-green",
  "--color-green-soft",
  "--shadow-fab",
  "--shadow-hero",
  "--shadow-card",
  "--hero-from",
  "--hero-to",
  "--background",
  "--foreground",
  "--color-shell",
  "--color-bone",
  "--color-surface",
  "--color-surface-2",
  "--color-field",
  "--color-line",
  "--color-ink",
  "--color-slate",
  "--color-brick",
] as const;
