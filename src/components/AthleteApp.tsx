"use client";

import { useState } from "react";
import { useClient, useExercises, logWorkout, uid, updateClient, getClient } from "@/lib/store";
import { flushPush, saveClientNow } from "@/lib/sync";
import { isoDate } from "@/lib/week";
import { formatClock } from "@/lib/rest";
import {
  displayLogin,
  isValidUsername,
  type LoginKind,
  loginKind,
  toLoginId,
} from "@/lib/login";
import type { Client } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";
import { Avatar, Button, Card } from "./ui";
import TrainView from "./TrainView";
import ProfileEditor from "./ProfileEditor";
import AthleteOnboard from "./AthleteOnboard";
import PRsView from "./PRsView";
import InstallGuide from "./InstallGuide";
import ExerciseList from "./ExerciseList";
import IntervalTimer, { type TimerResult } from "./IntervalTimer";
import { useSession } from "./SessionProvider";

type View = "train" | "timer" | "prs" | "library" | "install" | "profile";

const NAV: { id: View; label: string; icon: string }[] = [
  { id: "train", label: "Train", icon: "🔥" },
  { id: "timer", label: "Timer", icon: "⏱️" },
  { id: "prs", label: "PRs", icon: "🏆" },
  { id: "library", label: "Library", icon: "📚" },
  { id: "install", label: "Install", icon: "📲" },
];

export default function AthleteApp({ clientId }: { clientId: string }) {
  const client = useClient(clientId);
  const exercises = useExercises();
  const { session } = useSession();
  const [justSet, setJustSet] = useState(false);
  const [view, setView] = useState<View>("train");

  // Save a finished standalone timer as a "your own work" session in the log.
  const logTimer = (r: TimerResult) => {
    const id = uid("timer");
    logWorkout({
      clientId,
      workoutId: id,
      workoutName: r.name,
      date: isoDate(),
      completedItemIds: [],
      entries: [{ itemId: id, rounds: r.rounds, note: r.seconds != null ? formatClock(r.seconds) : undefined }],
    });
    void flushPush();
  };

  // First sign-in (coach set a temp password) → make them set their own.
  const needsPassword = Boolean(session && !session.user.user_metadata?.password_set);
  if (needsPassword && !justSet) {
    return <AthleteOnboard firstName={client?.name?.split(" ")[0]} onDone={() => setJustSet(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-bone/90 backdrop-blur border-b border-line">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setView("train")} className="font-display text-xl tracking-tight">
            BUILD
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setView(view === "profile" ? "train" : "profile")}
            className={`flex items-center gap-2 ${view === "profile" ? "text-forest" : ""}`}
            aria-label="Profile & settings"
          >
            {client && <Avatar src={client.avatarUrl} name={client.name} size={32} />}
            <span className="text-xs font-medium">{view === "profile" ? "Done" : "Profile"}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pb-28 pt-4">
        {!client ? (
          <div className="min-h-[55vh] grid place-items-center px-6">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 rounded-2xl bg-field grid place-items-center mx-auto mb-3 text-3xl">🌱</div>
              <p className="font-semibold text-lg">You&apos;re in! 🎉</p>
              <p className="text-slate text-sm mt-1">
                Your coach is setting up your program. This page fills in the moment they add your workouts — check back soon.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => location.reload()}>
                Refresh
              </Button>
            </div>
          </div>
        ) : view === "train" ? (
          <>
            <div className="mb-4">
              <h1 className="text-2xl font-bold leading-tight">Hi, {client.name.split(" ")[0]} 👋</h1>
              <p className="text-slate text-sm">Let&apos;s get after it.</p>
            </div>
            <TrainView client={client} />
          </>
        ) : view === "timer" ? (
          <>
            <h1 className="text-2xl font-bold mb-4">Timer</h1>
            <IntervalTimer onLog={logTimer} />
          </>
        ) : view === "prs" ? (
          <PRsView client={client} />
        ) : view === "library" ? (
          <>
            <h1 className="text-2xl font-bold mb-4">Movement library</h1>
            <ExerciseList exercises={exercises} />
          </>
        ) : view === "install" ? (
          <InstallGuide />
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">Profile & settings</h1>
            <ProfileEditor client={client} coachView={false} />
            <div className="mt-4 space-y-3">
              <YourLoginCard client={client} />
              <ChangePasswordCard />
              <Button variant="outline" className="w-full" onClick={() => getSupabase()?.auth.signOut()}>
                Sign out
              </Button>
            </div>
          </>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-line bg-surface/95 backdrop-blur">
        <div className="max-w-2xl mx-auto grid grid-cols-5" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {NAV.map((t) => {
            const active = view === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  active ? "text-forest" : "text-slate"
                }`}
              >
                <span className="text-lg leading-none">{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function YourLoginCard({ client }: { client: Client }) {
  const current = client.athleteEmail;
  const [kind, setKind] = useState<LoginKind>(loginKind(current));
  const [value, setValue] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Recovery email persists on the client row immediately (athlete may set it so
  // they can recover a phone/username login later).
  const saveRecovery = async (raw: string) => {
    const recoveryEmail = raw.trim().toLowerCase() || undefined;
    updateClient(client.id, { recoveryEmail });
    const latest = getClient(client.id);
    if (latest) await saveClientNow(latest);
  };

  const valid =
    pw.length >= 6 &&
    value.trim().length > 0 &&
    (kind === "email" ? value.includes("@") : kind === "phone" ? value.replace(/\D/g, "").length >= 7 : isValidUsername(value));

  const submit = async () => {
    const sb = getSupabase();
    if (!sb || !valid) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    const newLoginId = toLoginId(value, kind);
    try {
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setErr("Your session expired — sign in again.");
        return;
      }
      const res = await fetch("/api/athlete/change-login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newLoginId, currentPassword: pw }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error || "Couldn't change your login.");
      } else if (json.pending) {
        setMsg(`Almost done — tap the confirm link we sent to ${value.trim()} to finish the switch.`);
        setValue("");
        setPw("");
      } else {
        setMsg(`Done. Next time, sign in with ${displayLogin(newLoginId)}.`);
        setValue("");
        setPw("");
      }
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-1">Your login</h3>
      <p className="text-xs text-slate mb-3">
        You sign in with <b className="text-ink">{displayLogin(current)}</b>.
      </p>

      <p className="text-[11px] text-slate font-medium mb-1">Recovery email (so you can reset your own password)</p>
      <input
        type="email"
        defaultValue={client.recoveryEmail ?? ""}
        onBlur={(e) => saveRecovery(e.target.value)}
        placeholder="backup@example.com"
        className="w-full mb-4 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
      />

      <p className="text-[11px] text-slate font-medium mb-1">Change how you sign in</p>
      <div className="flex gap-1 mb-2">
        {(["email", "phone", "username"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setKind(m)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize ${
              kind === m ? "bg-forest text-bone" : "bg-field text-slate border border-line"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <input
        type={kind === "phone" ? "tel" : "text"}
        autoCapitalize="none"
        autoCorrect="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={kind === "email" ? "new@example.com" : kind === "phone" ? "(555) 123-4567" : "e.g. abbyr"}
        className="w-full mb-2 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
      />
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Your current password"
        className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
      />
      {kind === "email" && (
        <p className="text-[11px] text-slate mt-1">We&apos;ll email a confirm link before the change takes effect.</p>
      )}
      {msg && <p className="text-xs text-forest mt-2">{msg}</p>}
      {err && <p className="text-xs text-brick mt-2">{err}</p>}
      <Button className="w-full mt-3" onClick={submit} disabled={busy || !valid}>
        {busy ? "Saving…" : "Change login"}
      </Button>
    </Card>
  );
}

function ChangePasswordCard() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canSave = pw.length >= 6 && pw === confirm;

  const save = async () => {
    const sb = getSupabase();
    if (!sb || !canSave) return;
    setBusy(true);
    setMsg(null);
    const { error } = await sb.auth.updateUser({ password: pw, data: { password_set: true } });
    setBusy(false);
    if (error) {
      console.warn(error.message);
      setMsg("Couldn't update password. Please try again.");
    } else {
      setMsg("Password updated ✓");
      setPw("");
      setConfirm("");
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">Change password</h3>
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="New password (6+ chars)"
        className="w-full mb-2 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
      />
      {msg && <p className="text-xs text-slate mt-2">{msg}</p>}
      <Button className="w-full mt-3" onClick={save} disabled={busy || !canSave}>
        {busy ? "Saving…" : "Update password"}
      </Button>
    </Card>
  );
}
