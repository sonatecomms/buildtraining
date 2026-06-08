"use client";

import { DOW_LETTER, isoDate, weekDates } from "@/lib/week";

// Sun–Sat strip of dated circles, centered. Tap a day to select it.
// `marked` = weekdays that have a workout scheduled (shown with a dot).
export default function WeekStrip({
  selected,
  onSelect,
  marked,
}: {
  selected: number;
  onSelect: (dow: number) => void;
  marked?: Set<number>;
}) {
  const dates = weekDates();
  const todayIso = isoDate();

  return (
    <div className="flex justify-between gap-1 mb-4">
      {dates.map((d, dow) => {
        const isToday = isoDate(d) === todayIso;
        const isSel = dow === selected;
        const has = marked?.has(dow);
        return (
          <button
            key={dow}
            data-dow={dow}
            onClick={() => onSelect(dow)}
            className="flex flex-col items-center gap-1 flex-1 min-w-0"
          >
            <span className={`text-[11px] font-medium ${isSel ? "text-forest" : "text-slate"}`}>
              {DOW_LETTER[dow]}
            </span>
            <span
              className={`relative w-9 h-9 rounded-full grid place-items-center text-sm font-bold transition-colors ${
                isSel
                  ? "bg-forest text-bone"
                  : isToday
                    ? "bg-surface text-ink ring-1 ring-forest"
                    : "bg-surface text-slate"
              }`}
            >
              {d.getDate()}
              {has && (
                <span
                  className={`absolute -bottom-0.5 w-1.5 h-1.5 rounded-full ${
                    isSel ? "bg-bone" : "bg-green-soft"
                  }`}
                />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
