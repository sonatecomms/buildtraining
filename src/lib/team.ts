import type { Client, Grade } from "./types";

// Roster vocabulary for the team/demo. Positions are football groups (the most
// common high-school weight-room sport); coaches assign up to MAX_POSITIONS.
export const POSITIONS = ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "DB", "ATH", "K/P"] as const;
export const MAX_POSITIONS = 3;

// Unit groupings — coarse filters that expand to their positions (ATH plays both
// ways, so it counts toward Offense and Defense).
export const UNITS: { name: string; positions: string[] }[] = [
  { name: "Offense", positions: ["QB", "RB", "WR", "TE", "OL", "ATH"] },
  { name: "Defense", positions: ["DL", "LB", "DB", "ATH"] },
  { name: "Special Teams", positions: ["K/P"] },
];

// Full names [singular, plural] for readable copy.
export const POSITION_NAMES: Record<string, [string, string]> = {
  QB: ["quarterback", "quarterbacks"],
  RB: ["running back", "running backs"],
  WR: ["wide receiver", "wide receivers"],
  TE: ["tight end", "tight ends"],
  OL: ["offensive lineman", "offensive linemen"],
  DL: ["defensive lineman", "defensive linemen"],
  LB: ["linebacker", "linebackers"],
  DB: ["defensive back", "defensive backs"],
  ATH: ["athlete", "athletes"], // versatile / two-way player
  "K/P": ["specialist", "specialists"],
};

export const GRADES: Grade[] = ["Freshman", "Sophomore", "Junior", "Senior"];
// compact chip label
export const GRADE_SHORT: Record<Grade, string> = {
  Freshman: "Fr",
  Sophomore: "So",
  Junior: "Jr",
  Senior: "Sr",
};
const GRADE_PLURAL: Record<Grade, string> = {
  Freshman: "freshmen",
  Sophomore: "sophomores",
  Junior: "juniors",
  Senior: "seniors",
};

export type TeamFilter = { positions: string[]; units: string[]; grades: Grade[] };
export const EMPTY_FILTER: TeamFilter = { positions: [], units: [], grades: [] };

// Positions implied by the filter: those picked directly plus those covered by
// any selected unit.
function effectivePositions(f: TeamFilter): string[] {
  const fromUnits = f.units.flatMap((u) => UNITS.find((x) => x.name === u)?.positions ?? []);
  return Array.from(new Set([...f.positions, ...fromUnits]));
}

/** A client passes the filter if it matches ANY selected position/unit AND ANY
 *  selected grade (each empty group means "no constraint"). */
export function matchesFilter(c: Client, f: TeamFilter): boolean {
  const pos = effectivePositions(f);
  const posOk = pos.length === 0 || (c.positions ?? []).some((p) => pos.includes(p));
  const gradeOk = f.grades.length === 0 || (c.grade ? f.grades.includes(c.grade) : false);
  return posOk && gradeOk;
}

export function isFilterActive(f: TeamFilter): boolean {
  return f.positions.length > 0 || f.units.length > 0 || f.grades.length > 0;
}

/** A natural-language name for the filtered group (for the bulk-program block). */
export function describeFilterTarget(f: TeamFilter, count: number): string {
  const { units, positions, grades } = f;
  if (units.length === 0 && positions.length === 0 && grades.length === 0) return "the whole squad";
  // selecting every unit = everyone
  if (units.length === UNITS.length) return "the whole squad";
  const plural = count !== 1;

  // pure units
  if (positions.length === 0 && grades.length === 0 && units.length > 0) {
    return "the " + units.map((u) => u.toLowerCase()).join(" & ");
  }
  // pure positions
  if (units.length === 0 && grades.length === 0 && positions.length > 0) {
    const set = new Set(positions);
    if (set.size === 2 && set.has("OL") && set.has("DL")) return "the line";
    return "the " + positions.map((p) => POSITION_NAMES[p]?.[plural ? 1 : 0] ?? p).join(" & ");
  }
  // pure grades
  if (units.length === 0 && positions.length === 0 && grades.length > 0) {
    return "the " + grades.map((g) => GRADE_PLURAL[g]).join(" & ");
  }
  // mixed selection → a plain count
  return `the ${count} ${count === 1 ? "athlete" : "athletes"}`;
}
