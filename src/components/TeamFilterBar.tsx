"use client";

import { POSITIONS, GRADES, GRADE_SHORT, isFilterActive, type TeamFilter } from "@/lib/team";
import type { Grade } from "@/lib/types";

// Multiselect position + grade filter, shared by the roster and the scoreboard.
export default function TeamFilterBar({
  filter,
  onChange,
}: {
  filter: TeamFilter;
  onChange: (f: TeamFilter) => void;
}) {
  const togglePos = (p: string) =>
    onChange({
      ...filter,
      positions: filter.positions.includes(p)
        ? filter.positions.filter((x) => x !== p)
        : [...filter.positions, p],
    });
  const toggleGrade = (g: Grade) =>
    onChange({
      ...filter,
      grades: filter.grades.includes(g)
        ? filter.grades.filter((x) => x !== g)
        : [...filter.grades, g],
    });

  return (
    <div className="rounded-card border border-line bg-surface p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate/70">
          Filter
        </span>
        {isFilterActive(filter) && (
          <button
            onClick={() => onChange({ positions: [], grades: [] })}
            className="text-[11px] font-semibold text-forest"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {POSITIONS.map((p) => {
          const on = filter.positions.includes(p);
          return (
            <button
              key={p}
              onClick={() => togglePos(p)}
              aria-pressed={on}
              className={`rounded-full px-2.5 h-7 text-xs font-semibold transition-colors ${
                on ? "bg-forest text-bone" : "bg-field text-slate"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {GRADES.map((g) => {
          const on = filter.grades.includes(g);
          return (
            <button
              key={g}
              onClick={() => toggleGrade(g)}
              aria-pressed={on}
              className={`rounded-full px-2.5 h-7 text-xs font-semibold transition-colors ${
                on ? "bg-sky-dark text-bone" : "bg-field text-slate"
              }`}
            >
              <span className="sm:hidden">{GRADE_SHORT[g]}</span>
              <span className="hidden sm:inline">{g}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
