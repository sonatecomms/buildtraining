"use client";

import { useEffect, useState } from "react";
import { resetAll } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import { useSession } from "@/components/SessionProvider";
import { Button, Card, PageHeader, Pill } from "@/components/ui";

// The browser fires `beforeinstallprompt` on installable Android/desktop Chrome.
// iOS Safari has no such event, so we show manual Add-to-Home-Screen steps there.
interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export default function InstallPage() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { session, cloud } = useSession();

  useEffect(() => {
    const ua = window.navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua));
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

      <div className="mt-8 border-t border-line pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate">Cloud sync</p>
          {cloud ? (
            <Pill tone="green">● Supabase connected</Pill>
          ) : (
            <Pill tone="slate">○ Local only</Pill>
          )}
        </div>

        {cloud && session && (
          <Card className="p-3 flex items-center justify-between gap-2">
            <span className="text-sm text-slate truncate">{session.user.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => getSupabase()?.auth.signOut()}
            >
              Sign out
            </Button>
          </Card>
        )}

        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm("Reset all data back to the seeded demo?")) resetAll();
          }}
        >
          Reset demo data
        </Button>
      </div>
    </div>
  );
}
