"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { isReservedEmail, loginKind, toLoginId } from "@/lib/login";
import { APP_VERSION } from "@/lib/version";
import { Button, Card } from "./ui";

// Turn raw Supabase auth errors into plain, reassuring language for end users.
function friendlyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "That email/phone and password don't match. Check both and try again.";
  if (m.includes("already registered") || m.includes("already exists")) return "You already have an account — switch to Sign in.";
  if (m.includes("email not confirmed")) return "Your account isn't active yet. Ask your coach to finish setting you up.";
  if (m.includes("network") || m.includes("fetch")) return "Something went wrong. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}

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
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    setIsAthlete(new URLSearchParams(window.location.search).get("role") === "athlete");
  }, []);

  const resetPassword = async () => {
    const sb = getSupabase();
    setNotice(null);
    setError(null);
    if (!sb || !email.trim()) {
      setError("Enter your email, phone, or username above first, then tap “Forgot password?”.");
      return;
    }
    const id = toLoginId(email);
    if (loginKind(id) === "email") {
      // real inbox → Supabase's own reset link
      const { error } = await sb.auth.resetPasswordForEmail(id);
      if (error) {
        setError(friendlyAuthError(error.message));
      } else {
        setNotice("If that email has an account, a reset link is on its way.");
      }
      return;
    }
    // phone / username → no inbox; send the reset link to their recovery email
    try {
      await fetch("/api/athlete/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: id }),
      });
    } catch {
      /* generic response either way — don't reveal whether an account exists */
    }
    setNotice(
      "If a recovery email is on file for that login, a reset link is on its way to it. No recovery email? Ask your coach to reset you.",
    );
  };

  const submit = async () => {
    const sb = getSupabase();
    if (!sb || !email.trim() || password.length < 6) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    // a real email must not live in our synthetic namespaces (it would collide
    // with a phone/username login on the same auth account)
    if (email.includes("@") && isReservedEmail(email)) {
      setBusy(false);
      setError("That email address can’t be used here. Try a different one.");
      return;
    }

    // accept email, phone, or username (phone/username → synthetic email, no SMS)
    const id = toLoginId(email);

    if (mode === "signin") {
      const { error } = await sb.auth.signInWithPassword({ email: id, password });
      setBusy(false);
      if (error) {
        setError(friendlyAuthError(error.message));
      }
      // success → SessionProvider's auth listener takes over
      return;
    }

    // sign up — record athlete intent so we never seed them a coach account, and
    // skip the first-login password reset (they chose their own password)
    const { data, error } = await sb.auth.signUp({
      email: id,
      password,
      options: { data: { password_set: true, intent: isAthlete ? "athlete" : "coach" } },
    });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("already")) setMode("signin");
      setError(friendlyAuthError(error.message));
    } else if (data.session) {
      // confirmation disabled → already signed in
    } else {
      setMode("signin");
      setNotice("Account created — you can sign in now.");
    }
  };

  // allow short usernames (≥3) and short emails; the real check is in submit()
  const canSubmit = email.trim().length > 0 && password.length >= 6;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-icon.png?v=10" alt="BUILD" className="w-20 h-20 mb-2" />
      <h1 className="text-2xl font-bold">BUILD</h1>
      <p className="text-slate text-sm mt-1 mb-6">
        {isAthlete ? "Sign in to see your training" : mode === "signup" ? "Create your account" : "Sign in"}
      </p>

      <Card className="p-5 w-full max-w-sm text-left">
        <label htmlFor="auth-id" className="text-xs text-slate font-medium">Email, phone, or username</label>
        <input
          id="auth-id"
          autoFocus
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email, phone, or username"
          className="w-full mt-1.5 mb-3 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
        />

        <label htmlFor="auth-pw" className="text-xs text-slate font-medium">Password</label>
        <div className="relative mt-1.5">
          <input
            id="auth-pw"
            type={showPw ? "text" : "password"}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()}
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

        {mode === "signin" && (
          <button onClick={resetPassword} className="text-sky-dark text-xs mt-2 font-medium py-2 px-1 -mx-1 inline-flex items-center min-h-[32px]">
            Forgot password?
          </button>
        )}

        {error && <p className="text-brick text-xs mt-2">{error}</p>}
        {notice && <p className="text-slate text-xs mt-2">{notice}</p>}

        <Button className="w-full mt-4" onClick={submit} disabled={busy || !canSubmit}>
          {busy ? (mode === "signin" ? "Signing in…" : "Creating…") : mode === "signin" ? "Sign in" : "Create account"}
        </Button>

        {isAthlete ? (
          <p className="w-full text-center text-slate text-xs mt-3">
            Your coach sets up your account. Tap “Forgot password?” if you can’t get in.
          </p>
        ) : (
          <button
            onClick={() => {
              setMode((m) => (m === "signin" ? "signup" : "signin"));
              setError(null);
              setNotice(null);
            }}
            className="w-full text-center text-sky-dark text-sm mt-3 underline-offset-2 hover:underline"
          >
            {mode === "signin" ? "No account yet? Create one" : "Have an account? Sign in"}
          </button>
        )}
      </Card>
      <p className="text-[10px] text-slate mt-4">build {APP_VERSION}</p>
    </div>
  );
}
