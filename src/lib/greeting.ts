// The athlete greeting emoji rotates on each login, and each one truly animates
// using Google's Noto Animated Emoji (Lottie, fetched by codepoint — real
// articulation: the wink actually closes an eye). `anim`/`origin` are a CSS
// motion used only as a fallback if a Lottie fails to load (e.g. offline).
export interface Greeting {
  emoji: string;
  cp: string; // Noto animated-emoji codepoint
  anim: string; // CSS fallback class in globals.css
  origin?: string; // transform-origin override (CSS fallback)
}

export const GREETINGS: Greeting[] = [
  { emoji: "👋", cp: "1f44b", anim: "build-anim-wave", origin: "75% 80%" },
  { emoji: "😄", cp: "1f604", anim: "build-anim-smile" },
  { emoji: "😉", cp: "1f609", anim: "build-anim-wink" },
  { emoji: "👍", cp: "1f44d", anim: "build-anim-thumb", origin: "50% 80%" },
  { emoji: "💪", cp: "1f4aa", anim: "build-anim-flex" },
  { emoji: "🙌", cp: "1f64c", anim: "build-anim-raise" },
];

// The Noto animated-emoji Lottie endpoint for a codepoint.
export const notoLottieUrl = (cp: string) =>
  `https://fonts.gstatic.com/s/e/notoemoji/latest/${cp}/lottie.json`;

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
