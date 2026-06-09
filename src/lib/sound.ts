// Shared audio + haptic cues for the workout timers. All no-ops when WebAudio or
// the Vibration API are unavailable (older browsers, desktop), so callers never
// have to guard.

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctx ? new Ctx() : null;
}

// Play a sequence of short sine tones, 0.18s apart.
function tones(freqs: number[]) {
  try {
    const ctx = audioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    setTimeout(() => void ctx.close(), 1200);
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

// Vibrate, if supported.
export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}
