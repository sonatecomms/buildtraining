"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { disableLock, isLockEnabled, isUnlocked, unlock } from "@/lib/biometric";
import { Button } from "./ui";

// Gates the signed-in app behind Face ID when the device has enabled the lock.
export default function BiometricLock({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState<boolean>(() => isLockEnabled() && !isUnlocked());
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const tryUnlock = async () => {
    setBusy(true);
    setFailed(false);
    const ok = await unlock();
    setBusy(false);
    if (ok) setLocked(false);
    else setFailed(true);
  };

  // Prompt as soon as the lock screen appears.
  useEffect(() => {
    if (locked) void tryUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!locked) return <>{children}</>;

  return (
    <div className="min-h-screen grid place-items-center bg-shell px-6 text-center">
      <div className="w-full max-w-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png?v=10" alt="BUILD" className="w-20 h-20 mx-auto mb-3" />
        <p className="font-bold text-lg">BUILD is locked</p>
        <p className="text-slate text-sm mb-5">Unlock with Face ID to continue.</p>
        <Button className="w-full" onClick={tryUnlock} disabled={busy}>
          {busy ? "…" : "🔓 Unlock with Face ID"}
        </Button>
        {failed && <p className="text-brick text-xs mt-2">Couldn&apos;t verify. Try again.</p>}
        <div className="mt-5 flex flex-col gap-2">
          <button onClick={() => getSupabase()?.auth.signOut()} className="text-slate text-sm">
            Sign out instead
          </button>
          <button
            onClick={() => {
              disableLock();
              setLocked(false);
            }}
            className="text-brick text-xs"
          >
            Can&apos;t unlock? Turn off the lock on this device
          </button>
        </div>
      </div>
    </div>
  );
}
