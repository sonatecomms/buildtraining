"use client";

import { useEffect } from "react";

// The old service worker was caching stale app code (cache-first), which pinned
// devices on outdated builds. Until we ship a smarter SW, actively unregister
// any existing one and clear its caches so every load gets fresh code.
export default function ServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
    }
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  }, []);
  return null;
}
