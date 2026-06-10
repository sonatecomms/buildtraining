// The BUILD mark, as vector paths so it can be animated (see IntroSplash) and
// recolored, instead of the raster logo-icon.png. A solid "B" with a
// kettlebell-shaped negative space punched out of its middle — bell + handle,
// with the handle's grip opening left as the B's own color.
//
// Authored on a 0 0 200 200 viewBox. Two pieces are exported so the splash can
// drive them independently:
//   B_PATH          – the solid B silhouette (one closed shape, no counters)
//   KETTLEBELL_PATH – the kettlebell: outer silhouette + an inner grip-hole
//                     subpath. Render with fillRule="evenodd" so the grip reads
//                     as a hole (the B color shows through it).
// The kettlebell is authored at its REST position, centered in the B, so the
// splash can swing it in about a pivot and have it settle exactly into place.

// B with a straight left stem and two right bulges; the waist pinches in at the
// kettlebell's neck (y≈90) so the letter reads as a B once the bell is carved.
export const B_PATH =
  "M 46 32 H 110 C 142 32 156 47 156 67 C 156 84 146 92 128 92 " +
  "C 148 92 162 108 162 132 C 162 156 144 167 108 167 H 46 Z";

export const KETTLEBELL_PATH =
  // outer silhouette: a narrow handle loop sitting on a round bell, with the
  // shoulders/neck where they meet, then the bell as one big arc
  "M 80 88 C 64 68 64 48 86 42 C 95 39 113 39 122 42 C 142 48 142 68 128 88 " +
  "A 40 40 0 1 1 80 88 Z " +
  // inner grip opening (evenodd → hole, so the B color shows through)
  "M 90 82 C 82 68 82 56 93 53 C 99 51 109 51 115 53 C 126 56 126 68 118 82 Z";

// Pivot the kettlebell swings about in the splash (a point above the B).
export const KB_PIVOT = { x: 104, y: 12 };

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
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <mask id="build-kb-cut">
          <rect width="200" height="200" fill="white" />
          <path d={KETTLEBELL_PATH} fill="black" fillRule="evenodd" />
        </mask>
      </defs>
      <path d={B_PATH} fill={color} mask="url(#build-kb-cut)" />
    </svg>
  );
}
