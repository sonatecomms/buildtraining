"use client";

import { useEffect } from "react";
import Link from "next/link";

// Branded 404 for any unmatched URL. A live demo must never strand the
// presenter on a dead page (stale link, mistyped URL, deploy-swap race), so in
// demo mode this self-heals straight back to the roster. Real users get a way home.
export default function NotFound() {
  useEffect(() => {
    try {
      if (window.localStorage.getItem("build.demoMode")) window.location.replace("/");
    } catch {
      /* storage unavailable — the manual link below still works */
    }
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-icon.png?v=10" alt="BUILD" className="w-16 h-16 mb-3 opacity-80" />
      <h1 className="text-xl font-bold">Nothing at this address</h1>
      <p className="text-slate text-sm mt-1 mb-5 max-w-xs">
        That page doesn&apos;t exist. The app is one tap away.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-forest text-bone font-semibold px-5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
      >
        Back to BUILD
      </Link>
    </div>
  );
}
