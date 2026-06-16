"use client";

import { ReactNode } from "react";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-card bg-surface border border-line/70 shadow-card ${onClick ? "cursor-pointer active:scale-[0.99] transition-transform" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// Energetic forest→green gradient hero card (streak, PR, metcon score moments).
export function Hero({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`build-hero rounded-hero shadow-hero ${className}`}>{children}</div>;
}

// A display-number stat tile (Numbers grid, week stats).
export function StatTile({
  value,
  label,
  className = "",
}: {
  value: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className={`rounded-card bg-surface border border-line/70 shadow-card p-3 text-center ${className}`}>
      <p className="font-display text-2xl text-accent leading-none">{value}</p>
      <p className="text-[11px] text-slate mt-1">{label}</p>
    </div>
  );
}

// Small uppercase tracked section caption.
export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] text-slate/70 ${className}`}>{children}</p>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const variants = {
    primary: "bg-forest text-bone hover:bg-green-soft shadow-[0_8px_20px_-10px_rgba(25,53,12,0.5)]",
    outline: "border border-line text-ink hover:border-slate",
    ghost: "text-slate hover:text-ink",
    danger: "bg-brick/15 text-brick hover:bg-brick/25",
  };
  // min-h guarantees a comfortable tap target (≥44px on md).
  const sizes = { sm: "px-3 min-h-[38px] text-sm", md: "px-4 min-h-[44px] text-sm" };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bone ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// Floating action button (primary action, thumb-reachable).
export function Fab({
  onClick,
  label,
  children,
  className = "",
}: {
  onClick?: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-14 h-14 rounded-full bg-forest text-bone grid place-items-center shadow-fab active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bone ${className}`}
    >
      {children}
    </button>
  );
}

export function Pill({
  children,
  tone = "slate",
  className = "",
}: {
  children: ReactNode;
  tone?: "green" | "sky" | "brick" | "slate";
  className?: string;
}) {
  const tones = {
    green: "bg-green/15 text-accent",
    sky: "bg-sky/20 text-sky-dark", // accessible sky text
    brick: "bg-brick/15 text-brick",
    slate: "bg-slate/15 text-slate",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Avatar({
  src,
  name,
  size = 44,
  gradient = false,
}: {
  src?: string;
  name: string;
  size?: number;
  gradient?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`overflow-hidden flex items-center justify-center text-bone font-bold shrink-0 ${
        gradient ? "build-hero rounded-2xl" : "bg-forest rounded-full"
      }`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-line/60 ${className}`} />;
}

export function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-16 h-16 rounded-2xl bg-field grid place-items-center mx-auto mb-3 text-3xl text-slate">{icon}</div>
      <p className="font-semibold">{title}</p>
      {hint && <p className="text-slate text-sm mt-1 max-w-xs mx-auto">{hint}</p>}
    </div>
  );
}
