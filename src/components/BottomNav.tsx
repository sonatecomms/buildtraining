"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Clients", icon: "👥", match: (p: string) => p === "/" || p.startsWith("/clients") },
  { href: "/numbers", label: "Numbers", icon: "🔢", match: (p: string) => p.startsWith("/numbers") },
  { href: "/exercises", label: "Library", icon: "📚", match: (p: string) => p.startsWith("/exercises") },
  { href: "/install", label: "Settings", icon: "⚙️", match: (p: string) => p.startsWith("/install") },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-line bg-surface/95 backdrop-blur">
      <div
        className="max-w-2xl mx-auto grid grid-cols-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {tabs.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? "text-forest" : "text-slate"
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
