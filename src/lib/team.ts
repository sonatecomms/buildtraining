import type { Client, Grade } from "./types";

// Roster vocabulary for the team/demo. Positions are football groups (the most
// common high-school weight-room sport); coaches assign up to MAX_POSITIONS.
export const POSITIONS = ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "DB", "ATH", "K/P"] as const;
export const MAX_POSITIONS = 3;

export const GRADES: Grade[] = ["Freshman", "Sophomore", "Junior", "Senior"];
// compact chip label
export const GRADE_SHORT: Record<Grade, string> = {
  Freshman: "Fr",
  Sophomore: "So",
  Junior: "Jr",
  Senior: "Sr",
};

export type TeamFilter = { positions: string[]; grades: Grade[] };
export const EMPTY_FILTER: TeamFilter = { positions: [], grades: [] };

/** A client passes the filter if it matches ANY selected position AND ANY
 *  selected grade (each empty group means "no constraint"). */
export function matchesFilter(c: Client, f: TeamFilter): boolean {
  const posOk =
    f.positions.length === 0 || (c.positions ?? []).some((p) => f.positions.includes(p));
  const gradeOk = f.grades.length === 0 || (c.grade ? f.grades.includes(c.grade) : false);
  return posOk && gradeOk;
}

export function isFilterActive(f: TeamFilter): boolean {
  return f.positions.length > 0 || f.grades.length > 0;
}
