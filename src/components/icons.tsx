// Small custom glyphs that don't exist in lucide. Same call shape as lucide
// icons (size / className / strokeWidth) so they drop into the same slots.

type IconProps = { size?: number; className?: string; strokeWidth?: number };

// Stacked, balanced stones (a cairn) — for rest / recovery / mobility.
export function CairnIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      role="img"
      aria-hidden
    >
      <ellipse cx="12" cy="18.5" rx="7" ry="2.7" />
      <ellipse cx="12" cy="12.6" rx="5.2" ry="2.5" />
      <ellipse cx="12" cy="7.4" rx="3.4" ry="2.1" />
    </svg>
  );
}

// Gymnastics high bar: a horizontal bar on two uprights with feet.
export function HighBarIcon({ size = 24, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-hidden
    >
      <path d="M3 6.5h18" />
      <path d="M6.5 6.5V20" />
      <path d="M17.5 6.5V20" />
      <path d="M3.5 20h6M14.5 20h6" />
    </svg>
  );
}
