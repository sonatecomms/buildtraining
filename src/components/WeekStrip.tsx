"use client";

import { DOW_LETTER, isoDate, weekDatesForOffset, weekLabel } from "@/lib/week";

// Sun–Sat strip of dated circles, centered, with prev/next week navigation.
// `weekOffset` selects which week (0 = current, -1 = last week, …). Tap a day to
// select it. `marked` = weekdays that have a workout scheduled (shown with a dot).
export default function WeekStrip({
  selected,
  onSelect,
  marked,
  weekOffset = 0,
  onWeekOffset,
  minOffset = -Infinity,
  maxOffset = 0,
}: {
  selected: number;
  onSelect: (dow: number) => void;
  marked?: Set<number>;
  weekOffset?: number;
  onWeekOffset?: (next: number) => void;
  minOffset?: number;
  maxOffset?: number;
}) {
  const dates = weekDatesForOffset(weekOffset);
  const todayIso = isoDate();
  const canBack = !!onWeekOffset && weekOffset > minOffset;
  const canFwd = !!onWeekOffset && weekOffset < maxOffset;

  return (
    <div className="mb-4">
      {onWeekOffset && (
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => canBack && onWeekOffset(weekOffset - 1)}
            disabled={!canBack}
            aria-label="Previous week"
            className="w-8 h-8 rounded-full grid place-items-center text-lg text-slate disabled:opacity-30 active:scale-95 transition-transform"
          >
            ‹
          </button>
          <button
            onClick={() => weekOffset !== 0 && onWeekOffset(0)}
            className={`text-sm font-semibold ${weekOffset === 0 ? "text-accent" : "text-slate"}`}
            title={weekOffset === 0 ? undefined : "Back to this week"}
          >
            {weekLabel(weekOffset)}
          </button>
          <button
            onClick={() => canFwd && onWeekOffset(weekOffset + 1)}
            disabled={!canFwd}
            aria-label="Next week"
            className="w-8 h-8 rounded-full grid place-items-center text-lg text-slate disabled:opacity-30 active:scale-95 transition-transform"
          >
            ›
          </button>
        </div>
      )}
      <div className="flex justify-between gap-1">
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
              <span className={`text-[11px] font-medium ${isSel ? "text-accent" : "text-slate"}`}>
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
    </div>
  );
}
