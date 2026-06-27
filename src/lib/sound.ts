// Shared audio + haptic cues for the workout timers. All no-ops when WebAudio or
// the Vibration API are unavailable (older browsers, desktop), so callers never
// have to guard.

// ONE shared AudioContext for the whole app. Creating a fresh context per beep
// (the old approach) exhausts the browser's small concurrent-context cap once a
// timer fires many cues in quick succession — count-in ticks, 3-2-1s, beeps,
// chime — after which every new sound silently fails. A single reused context,
// resumed on a user gesture, avoids that and is also what iOS/Safari needs.
let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  ctx = Ctx ? new Ctx() : null;
  return ctx;
}

// Resume the shared context from within a user gesture (e.g. the Start tap) so
// later timer-driven cues are allowed to play, especially on iOS/Safari.
export function unlockAudio() {
  const c = audioCtx();
  if (c && c.state === "suspended") void c.resume().catch(() => {});
}

// Play a sequence of short sine tones, 0.18s apart.
function tones(freqs: number[]) {
  try {
    const c = audioCtx();
    if (!c) return;
    if (c.state === "suspended") void c.resume().catch(() => {});
    const now = c.currentTime;
    freqs.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain).connect(c.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    // Keep the shared context open — do NOT close it after each cue.
  } catch {}
}

// Two-tone "done" chime (interval end, time's up).
export function chime() {
  tones([880, 1175]);
}

// Single short beep — phase/round transitions inside an interval timer.
export function beep() {
  tones([988]);
}

// Higher, brighter click for the final 3-2-1 countdown before a boundary.
export function tick() {
  tones([1320]);
}

// Rising two-tone "go" — end of the count-in, work starts.
export function go() {
  tones([784, 1175]);
}

// Speak a short phrase (e.g. "halfway through"). No-op without speech support.
export function say(text: string) {
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel(); // don't let cues queue up behind each other
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;
    s.speak(u);
  } catch {}
}

// Vibrate, if supported.
export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}
