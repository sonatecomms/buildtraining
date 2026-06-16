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

export const GRADES: Grade[] = ["Freshman", "Sophomore", "Junior", "Senior"];
// compact chip label
export const GRADE_SHORT: Record<Grade, string> = {
  Freshman: "Fr",
  Sophomore: "So",
  Junior: "Jr",
  Senior: "Sr",
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
