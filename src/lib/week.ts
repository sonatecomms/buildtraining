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

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayDow(): number {
  return new Date().getDay();
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
