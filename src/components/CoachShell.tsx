"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEdgeSwipe } from "@/lib/useEdgeSwipe";
import BottomNav, { COACH_TABS } from "./BottomNav";

// Wraps the coach app so an edge swipe can walk between the top-level tab routes.
// We only switch when the current route IS one of the tab roots — on a deeper
// view like /clients/:id a horizontal swipe would fight the day strip and drag,
// so there we leave it alone.
export default function CoachShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const swipeRef = useEdgeSwipe<HTMLDivElement>((dir) => {
    const i = COACH_TABS.findIndex((t) => t.href === pathname);
    if (i < 0) return; // not on a top-level tab root → ignore
    const next = Math.min(COACH_TABS.length - 1, Math.max(0, i + dir));
    if (next !== i) router.push(COACH_TABS[next].href);
  });

  return (
    <div ref={swipeRef} className="flex-1 flex flex-col">
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pb-28 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
