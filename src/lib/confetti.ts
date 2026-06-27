// Dependency-free confetti burst. Draws particles on a transient full-screen
// canvas appended to <body>, then removes itself when the animation settles.
// No-op during SSR. Particles are tinted to the active brand/school theme so
// the burst matches whatever skin is applied.

function brandColors(): string[] {
  const fallback = ["#19350c", "#3f7d20", "#f4b400", "#e63946", "#2f80ed"];
  if (typeof window === "undefined") return fallback;
  try {
    const s = getComputedStyle(document.documentElement);
    const pick = (name: string) => s.getPropertyValue(name).trim();
    const themed = ["--color-forest", "--color-green", "--color-accent"]
      .map(pick)
      .filter(Boolean);
    // round out the brand hues with a couple of bright constants for pop
    return themed.length ? [...themed, "#f4b400", "#ffffff"] : fallback;
  } catch {
    return fallback;
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  size: number;
  color: string;
  shape: 0 | 1; // rectangle | circle
}

export function confetti(opts?: { count?: number; duration?: number }) {
  if (typeof document === "undefined") return;
  // Respect users who ask for reduced motion.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const count = opts?.count ?? 150;
  const duration = opts?.duration ?? 2800;
  const colors = brandColors();

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  // Two launch points (lower-left and lower-right), fired upward and inward.
  const parts: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const left = i % 2 === 0;
    // Fire upward and INWARD: the left cannon (at x≈10%) angles right, the right
    // cannon (at x≈90%) angles left, so the burst fills the screen instead of
    // immediately flying off the near edge.
    const angle = (left ? 1 : -1) * (Math.PI / 4) + (Math.random() - 0.5) * 0.9;
    const speed = 9 + Math.random() * 9;
    parts.push({
      x: left ? W * 0.1 : W * 0.9,
      y: H * 0.95,
      vx: Math.sin(angle) * speed,
      vy: -Math.cos(angle) * speed - 4,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.4,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? 1 : 0,
    });
  }

  const gravity = 0.32;
  const drag = 0.992;
  const start = performance.now();
  let raf = 0;

  const frame = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += gravity;
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      const fade = Math.max(0, 1 - Math.max(0, t - duration * 0.55) / (duration * 0.45));
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 1) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      }
      ctx.restore();
    }
    if (t < duration) {
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  };
  raf = requestAnimationFrame(frame);
}
