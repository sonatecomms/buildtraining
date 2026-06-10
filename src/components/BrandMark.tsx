// The BUILD mark, rendered from an exact vector trace of the real logo art
// (public/logo-icon.png → markPaths.ts via scripts/trace-mark.mjs) so it matches
// the logomark pixel-for-pixel instead of being a hand-drawn approximation. A
// solid "B" with the kettlebell — bell, handle, and the grip slot — punched out
// of its middle. Re-run the script to regenerate the paths if the art changes.

import { MARK_W, MARK_H, B_SOLID_PATH, KETTLEBELL_PATH } from "./markPaths";

export { MARK_W, MARK_H, B_SOLID_PATH, KETTLEBELL_PATH, KB_PIVOT, KB_CENTER } from "./markPaths";

export function BrandMark({
  size = 32,
  color = "var(--color-forest)",
  className,
  title = "BUILD",
}: {
  size?: number;
  color?: string;
  className?: string;
  title?: string;
}) {
  // keep the mark's aspect ratio; `size` is the height
  const w = Math.round((size * MARK_W) / MARK_H);
  return (
    <svg
      viewBox={`0 0 ${MARK_W} ${MARK_H}`}
      width={w}
      height={size}
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <mask id="build-kb-cut">
          <rect width={MARK_W} height={MARK_H} fill="white" />
          <path d={KETTLEBELL_PATH} fill="black" fillRule="evenodd" />
        </mask>
      </defs>
      <path d={B_SOLID_PATH} fill={color} mask="url(#build-kb-cut)" />
    </svg>
  );
}
