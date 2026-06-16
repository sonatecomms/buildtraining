"use client";

import { usePathname } from "next/navigation";
import { Users, Calculator, Dumbbell, Settings } from "lucide-react";
import { NavBar } from "./NavBar";
import { useIsDemo } from "./demoContext";

// Top-level coach tabs, in swipe order. `match` decides which tab the current
// route lights up; `/clients/:id` lives under the Clients tab.
export const COACH_TABS = [
  { id: "clients", label: "Clients", icon: Users, href: "/", match: (p: string) => p === "/" || p.startsWith("/clients") },
  { id: "numbers", label: "Numbers", icon: Calculator, href: "/numbers", match: (p: string) => p.startsWith("/numbers") },
  { id: "library", label: "Library", icon: Dumbbell, href: "/exercises", match: (p: string) => p.startsWith("/exercises") },
  { id: "settings", label: "Settings", icon: Settings, href: "/install", match: (p: string) => p.startsWith("/install") },
];

export function coachActiveId(pathname: string) {
  return (COACH_TABS.find((t) => t.match(pathname)) ?? COACH_TABS[0]).id;
}

export default function BottomNav() {
  const pathname = usePathname();
  const demo = useIsDemo();
  // In the demo (a school team), "Clients" reads as "Athletes".
  const items = demo
    ? COACH_TABS.map((t) => (t.id === "clients" ? { ...t, label: "Athletes" } : t))
    : COACH_TABS;
  return <NavBar items={items} activeId={coachActiveId(pathname)} />;
}
