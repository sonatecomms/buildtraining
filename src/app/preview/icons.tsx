// Tiny inline-SVG icon set for the design-direction preview (no new dependency).
// Stroke icons inherit color via currentColor. If a line-icon direction is chosen
// for the real facelift, swap these for lucide-react.

type IconProps = { size?: number; className?: string; strokeWidth?: number };

function S({
  size = 22,
  className = "",
  strokeWidth = 1.75,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function HomeIcon(p: IconProps) {
  return (
    <S {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </S>
  );
}

export function DumbbellIcon(p: IconProps) {
  return (
    <S {...p}>
      <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" />
    </S>
  );
}

export function TimerIcon(p: IconProps) {
  return (
    <S {...p}>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 13.5V9.5" />
      <path d="M9.5 2.5h5" />
    </S>
  );
}

export function ChartIcon(p: IconProps) {
  return (
    <S {...p}>
      <path d="M3.5 20.5h17" />
      <path d="M6.5 20.5V12" />
      <path d="M12 20.5V4.5" />
      <path d="M17.5 20.5v-6" />
    </S>
  );
}

export function UserIcon(p: IconProps) {
  return (
    <S {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c0-3.6 3.4-5.5 7.5-5.5s7.5 1.9 7.5 5.5" />
    </S>
  );
}

export function PlusIcon(p: IconProps) {
  return (
    <S {...p}>
      <path d="M12 5v14M5 12h14" />
    </S>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <S {...p}>
      <path d="M4.5 12.5l4.5 4.5L19.5 6.5" />
    </S>
  );
}

export function PlayIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8 5.5v13l10-6.5z" />
    </svg>
  );
}

export function FlameIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.5c.6 3 2.2 4.2 3.6 5.8C16.8 9.7 17.5 11.2 17.5 13a5.5 5.5 0 0 1-11 0c0-1.5.6-2.7 1.5-3.7.3 1.2 1 1.8 2 2- .7-1.6-.2-3.9 2-4.8-.4 1.6.1 2.6 1 3.4.2-2.3-.4-4.6-1.5-7.4z" />
    </svg>
  );
}

export const ICONS = {
  home: HomeIcon,
  dumbbell: DumbbellIcon,
  timer: TimerIcon,
  chart: ChartIcon,
  user: UserIcon,
  plus: PlusIcon,
  check: CheckIcon,
  play: PlayIcon,
  flame: FlameIcon,
} as const;

export type IconName = keyof typeof ICONS;
