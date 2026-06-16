"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  POSITIONS,
  UNITS,
  GRADES,
  GRADE_SHORT,
  EMPTY_FILTER,
  isFilterActive,
  type TeamFilter,
} from "@/lib/team";
import type { Grade } from "@/lib/types";

// Multiselect unit + position + grade filter, shared by the roster and scoreboard.
export default function TeamFilterBar({
  filter,
  onChange,
}: {
  filter: TeamFilter;
  onChange: (f: TeamFilter) => void;
}) {
  const toggle = <K extends "positions" | "units" | "grades">(key: K, val: string) =>
    onChange({
      ...filter,
      [key]: (filter[key] as string[]).includes(val)
        ? (filter[key] as string[]).filter((x) => x !== val)
        : [...(filter[key] as string[]), val],
    });

  const [open, setOpen] = useState(false);
  const count = filter.positions.length + filter.units.length + filter.grades.length;

  return (
    <div className="rounded-card border border-line bg-surface p-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-slate"
          aria-expanded={open}
        >
          <SlidersHorizontal size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Filter</span>
          {count > 0 && (
            <span className="grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full bg-forest text-bone text-[10px] font-bold">
              {count}
            </span>
          )}
          <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {isFilterActive(filter) && (
          <button onClick={() => onChange(EMPTY_FILTER)} className="text-[11px] font-semibold text-forest">
            Clear
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-3 mt-3">
          <Group label="Unit">
            {UNITS.map((u) => (
              <Chip key={u.name} on={filter.units.includes(u.name)} onClick={() => toggle("units", u.name)}>
                {u.name}
              </Chip>
            ))}
          </Group>
          <Group label="Position">
            {POSITIONS.map((p) => (
              <Chip key={p} on={filter.positions.includes(p)} onClick={() => toggle("positions", p)}>
                {p}
              </Chip>
            ))}
          </Group>
          <Group label="Grade">
            {GRADES.map((g) => (
              <Chip
                key={g}
                on={filter.grades.includes(g)}
                tone="grade"
                onClick={() => toggle("grades", g as Grade)}
              >
                {GRADE_SHORT[g]}
              </Chip>
            ))}
          </Group>
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate/55 mb-1.5">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  tone = "default",
  children,
}: {
  on: boolean;
  onClick: () => void;
  tone?: "default" | "grade";
  children: React.ReactNode;
}) {
  const active = tone === "grade" ? "bg-sky-dark text-bone" : "bg-forest text-bone";
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full px-3 h-8 text-xs font-semibold transition-colors active:scale-95 ${
        on ? active : "bg-field text-slate hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
