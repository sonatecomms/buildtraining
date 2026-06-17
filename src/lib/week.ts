// Helpers for the Sun–Sat week strip and weekday-scheduled workouts.

export const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DOW_LETTER = ["S", "M", "T", "W", "T", "F", "S"];
export const DOW_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Local calendar date (yyyy-mm-dd). Using toISOString() here would be UTC, which
// shifts the "day" by one every evening in western timezones — breaking the
// today highlight, streaks, and which calendar day a workout logs to.
export function isoDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayDow(): number {
  return new Date().getDay();
}

// Human-friendly date for logs/PRs: "Today", "Yesterday", else "Mon, Jun 2".
// Accepts a yyyy-mm-dd string (parsed as local, not UTC).
export function relativeDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

// Whole days between a yyyy-mm-dd date and today (today = 0). Negative if future.
export function daysAgo(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return Infinity;
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - date.getTime()) / 86400000);
}

// The actual calendar date (yyyy-mm-dd) a weekday-scheduled workout falls on:
// its week's Sunday (weekStart) plus `dow` days.
export function workoutDateIso(weekStart: string, dow: number): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + dow);
  return isoDate(date);
}

// True if a workout is dated today or in the future (so it's "upcoming" and safe
// to remove); false for past sessions, which are read-only history. An unstamped
// workout is treated as current/removable.
export function isUpcomingWorkout(w: { weekStart?: string; dow: number }): boolean {
  if (!w.weekStart) return true;
  return daysAgo(workoutDateIso(w.weekStart, w.dow)) <= 0; // 0 = today, <0 = future
}

// The seven dates of the week containing `ref` (Sunday first).
export function weekDates(ref = new Date()): Date[] {
  const start = new Date(ref);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay()); // back to Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

// The seven dates of the week `offset` weeks from this one (0 = current week,
// -1 = last week, +1 = next week).
export function weekDatesForOffset(offset: number): Date[] {
  const ref = new Date();
  ref.setDate(ref.getDate() + offset * 7);
  return weekDates(ref);
}

// yyyy-mm-dd of the Sunday that anchors the week `offset` weeks from now. This is
// the key a per-week program override is stamped with.
export function weekStartIso(offset: number): string {
  return isoDate(weekDatesForOffset(offset)[0]);
}

// yyyy-mm-dd of the Sunday anchoring week `w` of a plan that starts on the week
// containing `startISO` (yyyy-mm-dd; empty → this week). Used to apply a plan
// from a chosen calendar start date.
export function weekStartIsoFrom(startISO: string | undefined, w: number): string {
  const base = startISO ? new Date(startISO + "T00:00:00") : new Date();
  const sunday = weekDates(base)[0];
  sunday.setDate(sunday.getDate() + w * 7);
  return isoDate(sunday);
}

// Friendly label for the week strip: "This week" / "Last week" / "Next week",
// else a "May 25 – 31" date range.
export function weekLabel(offset: number): string {
  if (offset === 0) return "This week";
  if (offset === -1) return "Last week";
  if (offset === 1) return "Next week";
  const [a, , , , , , b] = weekDatesForOffset(offset);
  const month = (d: Date) => d.toLocaleDateString(undefined, { month: "short" });
  const left = `${month(a)} ${a.getDate()}`;
  const right = month(a) === month(b) ? String(b.getDate()) : `${month(b)} ${b.getDate()}`;
  return `${left} – ${right}`;
}
