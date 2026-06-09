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
  const [showPw, setShowPw] = useState(false);
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
        <label htmlFor="pr-new" className="text-xs text-slate font-medium">New password</label>
        <div className="relative mt-1.5 mb-3">
          <input
            id="pr-new"
            autoFocus
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-xl bg-field border border-line px-3 py-2.5 pr-14 text-sm outline-none focus:border-forest"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-1 inset-y-0 px-3 text-xs text-slate font-medium"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
        <label htmlFor="pr-confirm" className="text-xs text-slate font-medium">Confirm password</label>
        <input
          id="pr-confirm"
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canSave && save()}
          placeholder="Re-enter it"
          className="w-full mt-1.5 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
        />
        {confirm.length > 0 && pw !== confirm && (
          <p className="text-brick text-[11px] mt-1.5">Passwords don&apos;t match.</p>
        )}
        {error && <p className="text-brick text-xs mt-2" role="alert">{error}</p>}
        <Button className="w-full mt-4" onClick={save} disabled={busy || !canSave}>
          {busy ? "Saving…" : "Set password & continue"}
        </Button>
      </Card>
    </div>
  );
}
