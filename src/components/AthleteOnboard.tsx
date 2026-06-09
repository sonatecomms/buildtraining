"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button, Card } from "./ui";

// Shown the first time an athlete signs in (their coach set a temporary password).
// They must choose their own password before reaching their training. We mark
// user_metadata.password_set so this only appears once.
export default function AthleteOnboard({
  firstName,
  onDone,
}: {
  firstName?: string;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = password.length >= 6 && password === confirm;

  const save = async () => {
    const sb = getSupabase();
    if (!sb || !canSubmit) return;
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.updateUser({
      password,
      data: { password_set: true },
    });
    setBusy(false);
    if (error) {
      setError("Couldn't save your password. Please try again.");
    } else onDone();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-3">👋</div>
      <h1 className="text-2xl font-bold">Welcome{firstName ? `, ${firstName}` : ""}</h1>
      <p className="text-slate text-sm mt-1 mb-6">Set your own password to get started.</p>

      <Card className="p-5 w-full max-w-sm text-left">
        <label className="text-xs text-slate font-medium">New password</label>
        <input
          autoFocus
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          className="w-full mt-1.5 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
        />
        {password.length > 0 && password.length < 6 && (
          <p className="text-slate text-xs mt-1 mb-2">{6 - password.length} more character{6 - password.length === 1 ? "" : "s"}</p>
        )}
        {password.length >= 6 && <p className="text-forest text-xs mt-1 mb-2">Looks good ✓</p>}
        <label className="text-xs text-slate font-medium mt-1 block">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canSubmit && save()}
          placeholder="Re-enter it"
          className="w-full mt-1.5 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
        />
        {confirm.length > 0 && password !== confirm && (
          <p className="text-brick text-xs mt-2">Passwords don&apos;t match.</p>
        )}
        {error && <p className="text-brick text-xs mt-2">{error}</p>}
        <Button className="w-full mt-4" onClick={save} disabled={busy || !canSubmit}>
          {busy ? "Saving…" : "Set password"}
        </Button>
      </Card>
    </div>
  );
}
