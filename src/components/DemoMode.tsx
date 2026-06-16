"use client";

// ── Demo master mode ─────────────────────────────────────────────────────────
// A presenter-only mode for showing BUILD to coaches. Reached at /demo and gated
// by a master login (sonate / devops123). When active it bypasses real Supabase
// auth entirely, runs on seeded local data, and adds two demo controls: a
// Coach⇄Athlete master switch and the school skinner. Normal users (real login)
// never see any of this.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, UserRound, LogOut } from "lucide-react";
import { buildSeedDB } from "@/lib/seed";
import { hydrate } from "@/lib/store";
import CoachShell from "./CoachShell";
import AthleteApp from "./AthleteApp";
import SessionProvider from "./SessionProvider";
import { SchoolThemePicker } from "./SchoolThemePicker";
import { BrandMark } from "./BrandMark";

const DEMO_USER = "sonate";
const DEMO_PASS = "devops123";
const STORAGE_KEY = "build.demoMode";
const DEMO_CLIENT_ID = "client-jordan"; // the seeded athlete (Jordan Rivera)

type DemoRole = "coach" | "athlete";

type DemoCtx = {
  active: boolean;
  role: DemoRole;
  enter: (user: string, pass: string) => boolean;
  exit: () => void;
  setRole: (r: DemoRole) => void;
};

const Ctx = createContext<DemoCtx | null>(null);

function useDemo(): DemoCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDemo must be used within DemoModeProvider");
  return ctx;
}

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [role, setRoleState] = useState<DemoRole>("coach");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        setActive(true);
        setRoleState(saved === "athlete" ? "athlete" : "coach");
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  const persist = useCallback((r: DemoRole) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, r);
    } catch {
      /* ignore */
    }
  }, []);

  const enter = useCallback(
    (user: string, pass: string) => {
      if (user.trim().toLowerCase() !== DEMO_USER || pass !== DEMO_PASS) return false;
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
      sessionStorage.removeItem(STORAGE_KEY);
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
    <Ctx.Provider value={{ active, role, enter, exit, setRole }}>{children}</Ctx.Provider>
  );
}

// Chooses what to render: the demo app (seeded, with demo controls) when active,
// the master login at /demo, otherwise the real authenticated app.
export function DemoRoot({ children }: { children: React.ReactNode }) {
  const { active } = useDemo();
  const pathname = usePathname();

  if (active) {
    return (
      <>
        <DemoApp>{children}</DemoApp>
        <DemoSwitch />
        <SchoolThemePicker />
      </>
    );
  }
  if (pathname === "/demo") return <DemoLogin />;
  return (
    <SessionProvider>
      <CoachShell>{children}</CoachShell>
    </SessionProvider>
  );
}

// Seeds the local store once, then renders coach or athlete view per the switch.
function DemoApp({ children }: { children: React.ReactNode }) {
  const { role } = useDemo();
  const seeded = useRef(false);
  if (!seeded.current) {
    // hydrate synchronously on first render so no empty-state flashes through
    hydrate(buildSeedDB());
    seeded.current = true;
  }
  if (role === "athlete") return <AthleteApp clientId={DEMO_CLIENT_ID} />;
  return <CoachShell>{children}</CoachShell>;
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-bone px-6">
      <form onSubmit={submit} className="w-full max-w-xs flex flex-col items-center gap-5">
        <BrandMark size={48} />
        <div className="text-center">
          <h1 className="font-display text-2xl text-forest">Demo mode</h1>
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

// Floating master switch: flip the whole app between coach and athlete views,
// plus exit the demo. Top-left, mirrors the school skinner on the right.
function DemoSwitch() {
  const { role, setRole, exit } = useDemo();
  const router = useRouter();
  return (
    <div
      className="fixed left-3 z-40 flex items-center gap-1 rounded-full bg-surface/90 backdrop-blur border border-line shadow-card p-1"
      style={{ top: "calc(env(safe-area-inset-top) + 10px)" }}
    >
      <Seg active={role === "coach"} onClick={() => setRole("coach")} label="Coach">
        <GraduationCap size={14} />
        Coach
      </Seg>
      <Seg active={role === "athlete"} onClick={() => setRole("athlete")} label="Athlete">
        <UserRound size={14} />
        Athlete
      </Seg>
      <button
        onClick={() => {
          exit();
          router.replace("/demo");
        }}
        aria-label="Exit demo"
        className="ml-0.5 grid place-items-center w-7 h-7 rounded-full text-slate hover:text-ink active:scale-95 transition-transform"
      >
        <LogOut size={14} />
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
      className={`flex items-center gap-1 rounded-full px-2.5 h-7 text-[12px] font-semibold transition-colors ${
        active ? "bg-forest text-bone" : "text-slate"
      }`}
    >
      {children}
    </button>
  );
}
