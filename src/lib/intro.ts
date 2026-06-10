// Shared launch-intro state. The splash sets this when it finishes; the nav
// reads it so it can pop in at the right moment even if it mounts AFTER the
// splash already cleared (e.g. a session revisit where the splash is skipped),
// instead of waiting on a transient event it may have missed. Resets naturally
// on a full page load (fresh module instance).
let done = false;

export function markIntroDone() {
  done = true;
}

export function isIntroDone() {
  return done;
}
