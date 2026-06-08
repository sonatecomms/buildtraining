"use client";

import { useEffect, useState } from "react";
import { Button, Card, PageHeader } from "./ui";

// `beforeinstallprompt` fires on installable Android/desktop Chrome. iOS Safari
// has no such event, so we show manual Add-to-Home-Screen steps there.
interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export default function InstallGuide() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div>
      <PageHeader title="Install BUILD" subtitle="Run it like a native app" />

      {installed ? (
        <Card className="p-6 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="font-semibold">You&apos;re installed!</p>
          <p className="text-slate text-sm mt-1">BUILD is running as an app.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {deferred && (
            <Card className="p-4">
              <p className="font-semibold mb-1">One-tap install</p>
              <p className="text-slate text-sm mb-3">Your browser supports direct install.</p>
              <Button className="w-full" onClick={install}>📲 Add to Home Screen</Button>
            </Card>
          )}

          <Card className="p-4">
            <p className="font-semibold mb-3">{isIOS ? "On iPhone / iPad" : "On iOS (Safari)"}</p>
            <ol className="space-y-2 text-sm text-slate">
              <li><b className="text-ink">1.</b> Tap the <b className="text-ink">Share</b> button <span className="text-sky">⬆️</span> in Safari.</li>
              <li><b className="text-ink">2.</b> Scroll and tap <b className="text-ink">Add to Home Screen</b>.</li>
              <li><b className="text-ink">3.</b> Tap <b className="text-ink">Add</b> — the BUILD icon lands on your home screen.</li>
            </ol>
          </Card>

          <Card className="p-4">
            <p className="font-semibold mb-3">On Android (Chrome)</p>
            <ol className="space-y-2 text-sm text-slate">
              <li><b className="text-ink">1.</b> Tap the <b className="text-ink">⋮</b> menu, top-right.</li>
              <li><b className="text-ink">2.</b> Tap <b className="text-ink">Install app</b> / <b className="text-ink">Add to Home screen</b>.</li>
              <li><b className="text-ink">3.</b> Confirm — it installs like any app.</li>
            </ol>
          </Card>
        </div>
      )}
    </div>
  );
}
