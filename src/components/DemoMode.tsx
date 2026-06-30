"use client";

// ── Demo master mode ─────────────────────────────────────────────────────────
// A presenter-only mode for showing BUILD to coaches. Reached at /demo and gated
// by a master login (sonate / devops123). When active it bypasses real Supabase
// auth entirely, runs on seeded local data, and adds two demo controls: a
// Coach⇄Athlete master switch and the school skinner. Normal users (real login)
// never see any of this.

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, UserRound, LogOut } from "lucide-react";
import { buildDemoDB } from "@/lib/seed";
import { hydrate } from "@/lib/store";
import CoachShell from "./CoachShell";
import AthleteApp from "./AthleteApp";
import SessionProvider from "./SessionProvider";
import { SchoolThemePicker } from "./SchoolThemePicker";
import { BrandMark } from "./BrandMark";
import { DemoContext, useDemo, type DemoRole } from "./demoContext";

const DEMO_USER = "sonate";
const DEMO_PASS = "Sonate-Skins-44281";
const STORAGE_KEY = "build.demoMode";
const DEMO_CLIENT_ID = "client-jordan"; // the seeded athlete (Jordan Rivera)

// Demo data persists so a presenter's edits (e.g. programming they add live)
// survive a reload or a Coach⇄Athlete switch. We only lay down the seed when
// it isn't already present — tracked by a versioned flag. Bump SEED_VERSION
// whenever buildDemoDB() changes so resuming presenters pick up the new seed.
const SEED_KEY = "build.demoSeed";
const SEED_VERSION = "1";

// Seed the demo store, but only when needed. `force` always reseeds (a fresh
// login or an explicit reset); otherwise we keep whatever is persisted so a
// reload resumes the demo where the presenter left off. hydrate() notifies the
// store, so a forced reseed updates the UI without a reload.
function seedDemoIfNeeded(force = false) {
  let needs = force;
  if (!needs) {
    try {
      needs = localStorage.getItem(SEED_KEY) !== SEED_VERSION;
    } catch {
      needs = true; // storage unavailable — safest to lay down a clean seed
    }
  }
  if (!needs) return; // persisted demo data stands; the store lazy-loads it
  hydrate(buildDemoDB());
  try {
    localStorage.setItem(SEED_KEY, SEED_VERSION);
  } catch {
    /* ignore */
  }
}

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [role, setRoleState] = useState<DemoRole>("coach");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setActive(true);
        setRoleState(saved === "athlete" ? "athlete" : "coach");
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  // The floating nav hovers (fixed); reserve its footprint via --demo-bar so the
  // app content + its own sticky headers (library search, athlete/profile) start
  // below it. We own the top safe-area while active (the nav handles it), so the
  // doubled body padding is removed to avoid an extra gap.
  useEffect(() => {
    const root = document.documentElement;
    if (active) {
      root.style.setProperty("--demo-bar", "calc(env(safe-area-inset-top) + 64px)");
      document.body.style.paddingTop = "0px";
    } else {
      root.style.removeProperty("--demo-bar");
      document.body.style.removeProperty("padding-top");
    }
    return () => {
      root.style.removeProperty("--demo-bar");
      document.body.style.removeProperty("padding-top");
    };
  }, [active]);

  const persist = useCallback((r: DemoRole) => {
    try {
      localStorage.setItem(STORAGE_KEY, r);
    } catch {
      /* ignore */
    }
  }, []);

  const enter = useCallback(
    (user: string, pass: string) => {
      if (user.trim().toLowerCase() !== DEMO_USER || pass !== DEMO_PASS) return false;
      // Logging in starts a fresh demo (clean seed). Reloads, by contrast,
      // resume — so edits made during a demo survive, but each new sign-in (or
      // exit + sign back in) hands the next audience a clean slate.
      seedDemoIfNeeded(true);
      setActive(true);
      setRoleState("coach");
      persist("coach");
      return true;
    },
    [persist],
  );

  const exit = useCallback(() => {
    setActive(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const setRole = useCallback(
    (r: DemoRole) => {
      setRoleState(r);
      persist(r);
    },
    [persist],
  );

  return (
    <DemoContext.Provider value={{ active, role, enter, exit, setRole }}>
      {children}
    </DemoContext.Provider>
  );
}

// Chooses what to render: the demo app (seeded, with demo controls) when active,
// the master login at /demo, otherwise the real authenticated app.
export function DemoRoot({ children }: { children: React.ReactNode }) {
  const { active } = useDemo();
  const pathname = usePathname();

  if (active) return <DemoApp>{children}</DemoApp>;
  if (pathname === "/demo") return <DemoLogin />;
  return (
    <SessionProvider>
      <CoachShell>{children}</CoachShell>
    </SessionProvider>
  );
}

// Seeds the local store once, then renders a sticky demo bar (housing the
// controls so they never cover page content) above the coach or athlete view.
function DemoApp({ children }: { children: React.ReactNode }) {
  const { role } = useDemo();
  const pathname = usePathname();
  const router = useRouter();
  // A returning presenter reloads /demo and is restored as active — but the
  // /demo route renders no app content (its page is null), so the coach home
  // would sit empty until a tab nav landed on "/". Send them to "/" so the
  // first screen (the roster) loads immediately.
  useEffect(() => {
    if (pathname === "/demo") router.replace("/");
  }, [pathname, router]);
  // Seed in a layout effect (before paint) rather than during render: a
  // render-phase store mutation notifies subscribers illegally, so the first
  // screen's data hooks miss the seed until a later event (e.g. a tab switch)
  // forces a re-read. Gating on `seeded` lets the app subtree mount only after
  // the store is populated, so every hook reads real data on first paint.
  const [seeded, setSeeded] = useState(false);
  useLayoutEffect(() => {
    // Resume: keep persisted demo data (incl. live edits) across reloads and
    // role switches; only lay down the seed if none is present yet.
    seedDemoIfNeeded(false);
    setSeeded(true);
  }, []);
  if (!seeded) return null;
  return (
    <>
      <DemoBar />
      {/* content clears the floating nav */}
      <div style={{ paddingTop: "var(--demo-bar)" }}>
        {role === "athlete" ? <AthleteApp clientId={DEMO_CLIENT_ID} /> : <CoachShell>{children}</CoachShell>}
      </div>
    </>
  );
}

// Floating sticky nav that houses the demo controls in their own space (so they
// don't overlap the app's top row) and stays put while the page scrolls. The
// wrapper is in flow (reserving height); the inner pill floats (rounded, lifted).
// Inner app headers offset below it via the --demo-bar CSS var (set by provider).
function DemoBar() {
  return (
    <div
      className="fixed left-3 right-3 z-50"
      style={{ top: "calc(env(safe-area-inset-top) + 8px)" }}
    >
      <div className="flex items-center justify-between gap-2 pl-3.5 pr-1.5 h-12 rounded-full bg-shell/80 backdrop-blur-md border border-line shadow-hero">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate/80">Demo</span>
        <div className="flex items-center gap-1.5">
          <DemoSwitch />
          <SchoolThemePicker />
        </div>
      </div>
    </div>
  );
}

// The master login. Self-contained so it renders even behind the real auth gate.
function DemoLogin() {
  const { enter } = useDemo();
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enter(user, pass)) router.replace("/");
    else setError("That login isn't right. Check the username and password.");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-shell px-6">
      <form onSubmit={submit} className="w-full max-w-xs flex flex-col items-center gap-5">
        <BrandMark size={48} />
        <div className="text-center">
          <h1 className="font-display text-2xl text-accent">Demo mode</h1>
          <p className="text-[13px] text-slate mt-1">Presenter access for live walkthroughs.</p>
        </div>
        <div className="w-full flex flex-col gap-2.5">
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Username"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full rounded-xl bg-surface border border-line px-3.5 py-3 text-[15px] outline-none focus:border-forest"
          />
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full rounded-xl bg-surface border border-line px-3.5 py-3 text-[15px] outline-none focus:border-forest"
          />
        </div>
        {error && <p className="text-[13px] text-brick">{error}</p>}
        <button
          type="submit"
          className="w-full min-h-[46px] rounded-xl bg-forest text-bone font-semibold active:scale-[0.98] transition-transform"
        >
          Enter demo
        </button>
      </form>
    </div>
  );
}

// Master role switch (coach = clipboard, athlete = person). Compact so it sits
// in the top-right cluster beside the school skinner. The exit lives in the
// school sheet to keep this narrow.
function DemoSwitch() {
  const { role, setRole, exit } = useDemo();
  const router = useRouter();
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-surface/90 backdrop-blur border border-line shadow-card p-1">
      <Seg active={role === "coach"} onClick={() => setRole("coach")} label="Coach view">
        <ClipboardList size={13} />
        Coach
      </Seg>
      <Seg active={role === "athlete"} onClick={() => setRole("athlete")} label="Athlete view">
        <UserRound size={13} />
        Athlete
      </Seg>
      <button
        onClick={() => {
          exit();
          router.replace("/demo");
        }}
        aria-label="Exit demo"
        className="grid place-items-center w-6 h-6 rounded-full text-slate hover:text-ink active:scale-95 transition-transform"
      >
        <LogOut size={13} />
      </button>
    </div>
  );
}

function Seg({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex items-center gap-1 rounded-full px-2 h-7 text-[11px] font-semibold transition-colors ${
        active ? "bg-forest text-bone" : "text-slate"
      }`}
    >
      {children}
    </button>
  );
}
