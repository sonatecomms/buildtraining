"use client";

import { usePathname } from "next/navigation";
import { Users, Calculator, Dumbbell, Settings } from "lucide-react";
import { NavBar } from "./NavBar";

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
  return <NavBar items={COACH_TABS} activeId={coachActiveId(pathname)} />;
}
