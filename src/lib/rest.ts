// Parse a coach's free-text rest field into seconds so the athlete runner can
// offer a countdown. Rest is stored loosely ("60s", "90 sec", "2 min", "1:30"),
// so we accept the handful of forms a coach actually types and bail (null) on
// anything we can't read confidently — including work:rest ratios like "1:1".
export function parseRest(rest?: string): number | null {
  if (!rest) return null;
  const s = rest.trim().toLowerCase();
  if (!s) return null;

  // mm:ss — only when the seconds part is a real 2-digit value (<60), so "1:30"
  // reads as 90s but a "2:1" work:rest ratio is left alone.
  const clock = s.match(/^(\d+):([0-5]\d)$/);
  if (clock) {
    const secs = Number(clock[1]) * 60 + Number(clock[2]);
    return secs > 0 ? secs : null;
  }

  // "2 min", "1.5 min", "2m" → minutes
  const min = s.match(/^(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)$/);
  if (min) {
    const secs = Math.round(Number(min[1]) * 60);
    return secs > 0 ? secs : null;
  }

  // "90s", "90 sec", or a bare number → seconds
  const sec = s.match(/^(\d+)\s*(?:s|sec|secs|second|seconds)?$/);
  if (sec) {
    const secs = Number(sec[1]);
    return secs > 0 && secs <= 3600 ? secs : null;
  }

  return null;
}

// "1:05", "0:45" — runner countdown display.
export function formatClock(totalSeconds: number): string {
  const t = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(t / 60);
  const sec = t % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
