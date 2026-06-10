"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAppGestures } from "@/lib/useAppGestures";
import { PullIndicator } from "./PullIndicator";
import BottomNav, { COACH_TABS } from "./BottomNav";

// Wraps the coach app: an edge swipe walks between the top-level tab routes, and
// a pull-down from the top refreshes. We only enable the swipe when the current
// route IS one of the tab roots — on a deeper view like /clients/:id a
// horizontal swipe would fight the day strip and drag, so there we pass no
// handler (the hook then leaves horizontal gestures entirely alone).
export default function CoachShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const onTabRoot = COACH_TABS.some((t) => t.href === pathname);

  const { ref, pull, refreshing } = useAppGestures<HTMLDivElement>({
    onSwipe: onTabRoot
      ? (dir) => {
          const i = COACH_TABS.findIndex((t) => t.href === pathname);
          const next = Math.min(COACH_TABS.length - 1, Math.max(0, i + dir));
          if (next !== i) router.push(COACH_TABS[next].href);
        }
      : undefined,
    onRefresh: () => location.reload(),
  });

  return (
    <div ref={ref} className="flex-1 flex flex-col">
      <PullIndicator pull={pull} refreshing={refreshing} />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pb-28 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
