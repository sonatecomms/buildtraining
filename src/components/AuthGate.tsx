"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button, Card } from "./ui";

// Email + password sign in (testing phase — no emails sent, so no rate limits).
// Create the coach/athlete user here or in Supabase → Authentication → Users.
// The same screen serves coaches and athletes; the role is resolved after auth,
// and athlete invite links pass ?role=athlete so we greet them correctly.
//
// To switch back to magic links later, restore signInWithOtp here (recommended
// once custom SMTP is configured for athletes).
export default function AuthGate() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isAthlete, setIsAthlete] = useState(false);

  useEffect(() => {
    setIsAthlete(new URLSearchParams(window.location.search).get("role") === "athlete");
  }, []);

  const submit = async () => {
    const sb = getSupabase();
    if (!sb || !email.trim() || password.length < 6) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === "signin") {
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) setError(error.message);
      // success → SessionProvider's auth listener takes over
      return;
    }

    // sign up
    const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError(error.message);
    } else if (data.session) {
      // confirmation disabled → already signed in
    } else {
      setMode("signin");
      setNotice(
        "Account created. If it won't sign in, turn off Authentication → Providers → Email → “Confirm email” in Supabase for testing.",
      );
    }
  };

  const canSubmit = email.trim().length > 3 && password.length >= 6;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-icon.png" alt="BUILD" className="w-20 h-20 mb-2" />
      <h1 className="text-2xl font-bold">BUILD</h1>
      <p className="text-slate text-sm mt-1 mb-6">
        {isAthlete ? "Sign in to see your training" : mode === "signup" ? "Create your account" : "Sign in"}
      </p>

      <Card className="p-5 w-full max-w-sm text-left">
        <label className="text-xs text-slate font-medium">Email</label>
        <input
          autoFocus
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full mt-1.5 mb-3 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
        />

        <label className="text-xs text-slate font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()}
          placeholder="At least 6 characters"
          className="w-full mt-1.5 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
        />

        {error && <p className="text-brick text-xs mt-2">{error}</p>}
        {notice && <p className="text-slate text-xs mt-2">{notice}</p>}

        <Button className="w-full mt-4" onClick={submit} disabled={busy || !canSubmit}>
          {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>

        <button
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setError(null);
            setNotice(null);
          }}
          className="w-full text-center text-sky text-sm mt-3"
        >
          {mode === "signin" ? "No account yet? Create one" : "Have an account? Sign in"}
        </button>
      </Card>
    </div>
  );
}
