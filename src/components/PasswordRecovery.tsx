"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button, Card } from "./ui";

// Shown when an athlete arrives via a password-reset link (Supabase fires a
// PASSWORD_RECOVERY auth event, which puts them in a transient recovery session).
// They set a new password, then continue into the app normally.
export default function PasswordRecovery({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = pw.length >= 6 && pw === confirm;

  const save = async () => {
    const sb = getSupabase();
    if (!sb || !canSave) return;
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.updateUser({ password: pw, data: { password_set: true } });
    setBusy(false);
    if (error) {
      console.warn(error.message);
      setError("Couldn't set your password. The link may have expired — request a new one.");
    } else {
      onDone();
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-icon.png?v=10" alt="BUILD" className="w-20 h-20 mb-2" />
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <p className="text-slate text-sm mt-1 mb-6">You&apos;re almost back in.</p>
      <Card className="p-5 w-full max-w-sm text-left">
        <label className="text-xs text-slate font-medium">New password</label>
        <input
          autoFocus
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="At least 6 characters"
          className="w-full mt-1.5 mb-3 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
        />
        <label className="text-xs text-slate font-medium">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canSave && save()}
          placeholder="Re-enter it"
          className="w-full mt-1.5 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
        />
        {error && <p className="text-brick text-xs mt-2">{error}</p>}
        <Button className="w-full mt-4" onClick={save} disabled={busy || !canSave}>
          {busy ? "Saving…" : "Set password & continue"}
        </Button>
      </Card>
    </div>
  );
}
