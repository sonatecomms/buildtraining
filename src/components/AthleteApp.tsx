"use client";

import { useEffect, useId, useState } from "react";
import { useClient, useExercises, useLogsForClient, computeStreak, logWorkout, uid, updateClient, getClient } from "@/lib/store";
import dynamic from "next/dynamic";
import { isIntroDone } from "@/lib/intro";
import { nextGreeting, notoLottieUrl } from "@/lib/greeting";
import { useSchoolTheme } from "./SchoolThemeProvider";
import { BUILD_DEFAULT } from "@/lib/schoolThemes";

// lottie-react is only needed for the greeting flourish — code-split it out of
// the main bundle and keep it client-only.
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
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
import { Dumbbell, Timer, Calculator, BookOpen, MessageCircle, User, type LucideIcon } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { Avatar, Button } from "./ui";
import TrainView from "./TrainView";
import ProfileEditor from "./ProfileEditor";
import AthleteOnboard from "./AthleteOnboard";
import PRsView from "./PRsView";
import InstallGuide from "./InstallGuide";
import ExerciseList from "./ExerciseList";
import IntervalTimer, { type TimerResult } from "./IntervalTimer";
import MessageThread from "./MessageThread";
import { useUnread } from "@/lib/messages";
import { NavBar } from "./NavBar";
import { useAppGestures } from "@/lib/useAppGestures";
import { PullIndicator } from "./PullIndicator";
import { useSession } from "./SessionProvider";

type View = "train" | "timer" | "prs" | "library" | "coach" | "settings";

// Bottom nav. "You" (Profile + Settings) is also reachable via the header avatar.
const NAV: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "train", label: "Train", icon: Dumbbell },
  { id: "timer", label: "Timer", icon: Timer },
  { id: "prs", label: "Numbers", icon: Calculator },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "coach", label: "Coach", icon: MessageCircle },
  { id: "settings", label: "You", icon: User },
];

export default function AthleteApp({ clientId }: { clientId: string }) {
  const client = useClient(clientId);
  const exercises = useExercises();
  const { session } = useSession();
  const [justSet, setJustSet] = useState(false);
  const [view, setView] = useState<View>("train");
  const unread = useUnread(clientId, "athlete");
  const navItems = NAV.map((it) =>
    it.id === "coach" ? { ...it, badge: unread > 0 && view !== "coach" } : it,
  );

  // Swipe walks between the bottom-nav views in tab order; pull-down refreshes.
  const { ref: swipeRef, pull, refreshing } = useAppGestures<HTMLDivElement>({
    onSwipe: (dir) => {
      setView((v) => {
        const i = NAV.findIndex((t) => t.id === v);
        const next = Math.min(NAV.length - 1, Math.max(0, i + dir));
        return NAV[next].id;
      });
    },
    onRefresh: () => location.reload(),
  });

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
    <div ref={swipeRef} className="min-h-screen flex flex-col">
      <PullIndicator pull={pull} refreshing={refreshing} />
      <header
        className="sticky z-30 bg-shell/90 backdrop-blur border-b border-line"
        style={{ top: "var(--demo-bar, 0px)" }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setView("train")}
            aria-label="Go to training"
            className="font-display text-xl tracking-tight rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
          >
            BUILD
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setView(view === "settings" ? "train" : "settings")}
            className={`flex items-center gap-2 ${view === "settings" ? "text-accent" : ""}`}
            aria-label="Profile & settings"
          >
            {client && <Avatar src={client.avatarUrl} name={client.name} size={32} gradient />}
            <span className="text-xs font-medium">{view === "settings" ? "Done" : "Profile"}</span>
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
            <TrainGreeting client={client} />
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
        ) : view === "coach" ? (
          <>
            <h1 className="text-2xl font-bold mb-4">Your coach</h1>
            <MessageThread client={client} me="athlete" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">Settings</h1>
            <Collapsible title="Profile" icon="👤">
              <ProfileEditor client={client} coachView={false} />
            </Collapsible>
            <Collapsible title="Your login" icon="🔑">
              <YourLoginCard client={client} />
            </Collapsible>
            <Collapsible title="Change password" icon="🔒">
              <ChangePasswordCard />
            </Collapsible>
            <Collapsible title="Install app" icon="📲">
              <InstallGuide embedded />
            </Collapsible>
            <Button
              variant="outline"
              className="w-full mt-6"
              onClick={() => getSupabase()?.auth.signOut()}
            >
              Sign out
            </Button>
          </>
        )}
      </main>

      <NavBar items={navItems} activeId={view} onSelect={(id) => setView(id as View)} />
    </div>
  );
}

// Greeting row: name + rotating emoji on the left, the week's goal ring on the
// right (fills what used to be dead space and gives the header a real anchor).
// The ring tracks the CURRENT real week's logged sessions vs the athlete's
// intended frequency — same data the green strip used to carry.
function TrainGreeting({ client }: { client: Client }) {
  const logs = useLogsForClient(client.id);
  const streak = computeStreak(logs, client.intendedFrequency);
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold leading-tight">
          Hi, {client.name.split(" ")[0]} <GreetingEmoji />
        </h1>
        <p className="text-slate text-sm">Let&apos;s get after it.</p>
      </div>
      <WeekRing pct={streak.weekProgressPct} done={streak.thisWeek} target={streak.weeklyTarget} />
    </div>
  );
}

// The weekly-goal progress ring, sized for the header.
function WeekRing({ pct, done, target }: { pct: number; done: number; target: number }) {
  const r = 31;
  const c = 2 * Math.PI * r;
  return (
    <div className="shrink-0 relative grid place-items-center">
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-line)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute text-center leading-none">
        <div className="font-display text-base text-accent">{done}/{target}</div>
        <div className="text-[8px] uppercase tracking-wide text-slate mt-1">this wk</div>
      </div>
    </div>
  );
}

// The greeting emoji rotates per login and truly animates via Noto Animated
// Emoji (Lottie) — the wink actually closes an eye. It renders as the Lottie
// from the start (resting at frame 0, no static native glyph shown first), then
// plays once 1 second after the launch splash clears. The glyph + CSS motion
// is only a fallback if the Lottie can't load (e.g. offline).
function GreetingEmoji() {
  // When a school is selected, greet with that school's mascot (static, reliable)
  // instead of the rotating animated Noto emoji.
  const { school } = useSchoolTheme();
  const isSchool = school.id !== BUILD_DEFAULT.id;
  const [g] = useState(nextGreeting);
  const [data, setData] = useState<object | null>(null);
  const [failed, setFailed] = useState(false);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    if (isSchool) return; // mascot is a static glyph — no Lottie to load
    let cancelled = false;
    // fetch the Lottie up front so it's resting and ready to play at the 2s mark
    fetch(notoLottieUrl(g.cp))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("noto"))))
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let armed = false;
    let animTimer: ReturnType<typeof setTimeout>;
    const arm = () => {
      if (armed || reduce) return; // reduced motion: leave the emoji resting
      armed = true;
      animTimer = setTimeout(() => {
        if (!cancelled) setPlay(true);
      }, 1000);
    };
    if (isIntroDone()) arm();
    const cue = () => arm();
    window.addEventListener("build:intro-done", cue);
    const fallback = setTimeout(arm, 2600); // in case the cue was missed
    return () => {
      cancelled = true;
      window.removeEventListener("build:intro-done", cue);
      clearTimeout(animTimer);
      clearTimeout(fallback);
    };
  }, [g, isSchool]);

  const box = { display: "inline-block", width: "1.15em", height: "1.15em", verticalAlign: "-0.22em" } as const;

  if (isSchool) return <span aria-hidden className="animate-pop inline-block">{school.emoji}</span>;
  if (data) {
    // keyed on `play` so flipping to play remounts and runs once from frame 0;
    // before that it sits at frame 0 (the resting emoji), not a native glyph
    return <Lottie key={play ? "play" : "rest"} animationData={data} autoplay={play} loop={false} aria-hidden style={box} />;
  }
  if (failed) {
    return (
      <span className={`build-greet ${play ? g.anim : ""}`} style={g.origin ? { transformOrigin: g.origin } : undefined} aria-hidden>
        {g.emoji}
      </span>
    );
  }
  return <span aria-hidden style={box} />; // hold the slot while the Lottie loads
}

// A tap-to-expand settings section. Header is a plain row (no card chrome) so the
// revealed content — which may be cards (Profile, Install) — doesn't nest.
function Collapsible({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="w-full flex items-center gap-3 py-4 text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
      >
        <span className="text-lg leading-none" aria-hidden>{icon}</span>
        <span className="font-semibold flex-1">{title}</span>
        <span className={`text-slate transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div id={id} role="region" className="pb-4 space-y-3">
          {children}
        </div>
      )}
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
  const [recMsg, setRecMsg] = useState<string | null>(null);

  // Recovery email persists on the client row immediately (athlete may set it so
  // they can recover a phone/username login later).
  const saveRecovery = async (raw: string) => {
    const v = raw.trim().toLowerCase();
    if (v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
      setRecMsg("That doesn't look like an email.");
      return;
    }
    updateClient(client.id, { recoveryEmail: v || undefined });
    const latest = getClient(client.id);
    if (latest) await saveClientNow(latest);
    setRecMsg(v ? "Saved ✓" : "Cleared");
    setTimeout(() => setRecMsg(null), 2500);
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
        // reflect the new login immediately so the card doesn't show the old one
        updateClient(client.id, { athleteEmail: newLoginId });
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
    <div>
      <p className="text-xs text-slate mb-3">
        You sign in with <b className="text-ink">{displayLogin(current)}</b>.
      </p>

      <p className="text-[11px] text-slate font-medium mb-1">Recovery email (so you can reset your own password)</p>
      <input
        type="email"
        autoComplete="email"
        defaultValue={client.recoveryEmail ?? ""}
        onBlur={(e) => saveRecovery(e.target.value)}
        placeholder="backup@example.com"
        className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
      />
      <p className="text-[11px] mt-1 mb-4 min-h-[14px]" aria-live="polite">
        {recMsg && (
          <span className={recMsg.includes("✓") || recMsg === "Cleared" ? "text-accent" : "text-brick"}>{recMsg}</span>
        )}
      </p>

      <p className="text-[11px] text-slate font-medium mb-1">Change how you sign in</p>
      <div className="flex gap-1 mb-2">
        {(["email", "phone", "username"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setKind(m)}
            className={`flex-1 rounded-lg py-2.5 text-xs font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${
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
        autoComplete="current-password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Your current password"
        className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
      />
      {kind === "email" && (
        <p className="text-[11px] text-slate mt-1">We&apos;ll email a confirm link before the change takes effect.</p>
      )}
      {msg && <p className="text-xs text-accent mt-2">{msg}</p>}
      {err && <p className="text-xs text-brick mt-2">{err}</p>}
      <Button className="w-full mt-3" onClick={submit} disabled={busy || !valid}>
        {busy ? "Saving…" : "Change login"}
      </Button>
    </div>
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
      setMsg("error:Couldn't update password. Please try again.");
    } else {
      setMsg("ok:Password updated ✓");
      setPw("");
      setConfirm("");
    }
  };

  return (
    <div>
      <input
        type="password"
        autoComplete="new-password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="New password (6+ chars)"
        className="w-full mb-2 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
      />
      <input
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
      />
      {confirm.length > 0 && pw !== confirm && (
        <p className="text-brick text-[11px] mt-1">Passwords don&apos;t match.</p>
      )}
      {msg && (
        <p className={`text-xs mt-2 ${msg.startsWith("error:") ? "text-brick" : "text-accent"}`} aria-live="polite">
          {msg.replace(/^(error|ok):/, "")}
        </p>
      )}
      <Button className="w-full mt-3" onClick={save} disabled={busy || !canSave}>
        {busy ? "Saving…" : "Update password"}
      </Button>
    </div>
  );
}
