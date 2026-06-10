// The athlete greeting emoji rotates on each login, and each one animates in a
// way that fits it: a hand waves, a face smiles, a wink winks, a thumb jabs up,
// a bicep flexes, a runner scurries. (Emoji glyphs are static, so each "action"
// is approximated with motion.)
export interface Greeting {
  emoji: string;
  anim: string; // CSS class in globals.css
  origin?: string; // transform-origin override
}

export const GREETINGS: Greeting[] = [
  { emoji: "👋", anim: "build-anim-wave", origin: "75% 80%" },
  { emoji: "😄", anim: "build-anim-smile" },
  { emoji: "😉", anim: "build-anim-wink" },
  { emoji: "👍", anim: "build-anim-thumb", origin: "50% 80%" },
  { emoji: "💪", anim: "build-anim-flex" },
  { emoji: "🏃", anim: "build-anim-run" },
];

// Advance to the next greeting once per app load (the module is fresh each
// load), persisting the position so each login rotates to the next one. Cached
// in a module variable so re-mounts within the same session stay consistent.
let chosen: number | null = null;

export function nextGreeting(): Greeting {
  if (chosen === null) {
    let n = 0;
    try {
      const prev = parseInt(localStorage.getItem("build:greet") ?? "-1", 10);
      n = ((Number.isFinite(prev) ? prev : -1) + 1) % GREETINGS.length;
      localStorage.setItem("build:greet", String(n));
    } catch {
      n = 0;
    }
    chosen = n;
  }
  return GREETINGS[chosen];
}
