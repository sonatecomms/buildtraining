"use client";

import { useEffect, useState } from "react";
import { biometricSupported, disableLock, enrollBiometric, isLockEnabled } from "@/lib/biometric";
import { useSession } from "./SessionProvider";
import { useIsDemo } from "./demoContext";
import { Button, Card } from "./ui";

// Face ID / Touch ID app-lock toggle, with success/failure feedback. Shared by the
// Install guide and the athlete's Profile so the security setting is findable.
export default function BiometricLockCard({ className = "" }: { className?: string }) {
  const { session } = useSession();
  const isDemo = useIsDemo();
  const [bioOk, setBioOk] = useState(false);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);

  useEffect(() => {
    setLocked(isLockEnabled());
    biometricSupported().then(setBioOk);
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  const toggleLock = async () => {
    if (locked) {
      disableLock();
      setLocked(false);
      setMsg({ text: "Face ID lock turned off." });
      return;
    }
    setBusy(true);
    const ok = await enrollBiometric(session?.user.id ?? "build-user", session?.user.email ?? "BUILD");
    setBusy(false);
    setLocked(ok);
    setMsg(
      ok
        ? { text: "Face ID lock is on — you'll be asked to unlock next time." }
        : { text: "Couldn't enable Face ID. Make sure it's set up on this device, then try again.", bad: true },
    );
  };

  // A demo session is throwaway: enabling a device-level biometric gate from it
  // would lock the presenter's own machine out of the next launch. Hide it.
  if (isDemo) return null;

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">Face ID lock</p>
          <p className="text-xs text-slate mt-0.5">
            {bioOk
              ? "Require Face ID / Touch ID to open BUILD on this device."
              : "Not available on this device or browser."}
          </p>
        </div>
        {bioOk && (
          <Button size="sm" variant={locked ? "outline" : "primary"} onClick={toggleLock} disabled={busy}>
            {busy ? "…" : locked ? "Turn off" : "Turn on"}
          </Button>
        )}
      </div>
      <p className={`text-[11px] mt-2 ${msg?.bad ? "text-brick" : "text-slate"}`}>
        {msg ? msg.text : "You stay signed in — this just locks the screen until you unlock."}
      </p>
    </Card>
  );
}
