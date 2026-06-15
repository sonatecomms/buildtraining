"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import {
  coachHasClients,
  pullAthlete,
  pullDB,
  pushNow,
  setAthleteRole,
  setCoachId,
  shouldDeferRepull,
  startRealtime,
} from "@/lib/sync";
import { hydrate } from "@/lib/store";
import { isPhoneLogin, isUsernameLogin } from "@/lib/login";
import { buildSeedDB } from "@/lib/seed";
import AuthGate from "./AuthGate";
import AthleteApp from "./AthleteApp";
import BiometricLock from "./BiometricLock";
import PasswordRecovery from "./PasswordRecovery";

type Status = "loading" | "signedout" | "ready";
type Role = "coach" | "athlete";

const SessionCtx = createContext<{ session: Session | null; cloud: boolean; role: Role }>({
  session: null,
  cloud: false,
  role: "coach",
});

export const useSession = () => useContext(SessionCtx);

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const sb = getSupabase();
  const cloud = Boolean(sb);
  const [status, setStatus] = useState<Status>(cloud ? "loading" : "ready");
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>("coach");
  const [recovering, setRecovering] = useState(false);
  const [athleteClientId, setAthleteClientId] = useState<string | null>(null);
  const resolvedFor = useRef<string | null>(null);
  const roleRef = useRef<Role>("coach");
  const emailRef = useRef<string>("");
  const realtimeOff = useRef<(() => void) | null>(null);
  const repullTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!sb) return; // local mode

    // re-pull the current role's data from the cloud (live updates), debounced.
    // Defer while the user is actively editing so a live update never reverts an
    // in-progress or just-saved change (local is authoritative for ~6s).
    const repull = async () => {
      if (shouldDeferRepull()) {
        scheduleRepull();
        return;
      }
      if (roleRef.current === "athlete") {
        const ath = emailRef.current ? await pullAthlete(emailRef.current) : null;
        if (ath) hydrate(ath.db);
      } else {
        const remote = await pullDB();
        if (remote) hydrate(remote);
      }
    };
    const scheduleRepull = () => {
      if (repullTimer.current) clearTimeout(repullTimer.current);
      repullTimer.current = setTimeout(() => void repull(), 800);
    };

    // After a confirmed native email change, ask the server to point the athlete's
    // client row at their new email. Idempotent; returns true if it changed anything.
    const syncLogin = async (accessToken?: string): Promise<boolean> => {
      if (!accessToken) return false;
      try {
        const res = await fetch("/api/athlete/sync-login", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return Boolean((await res.json())?.synced);
      } catch {
        return false;
      }
    };

    const handle = async (s: Session | null) => {
      setSession(s);
      if (!s) {
        setCoachId(null);
        resolvedFor.current = null;
        realtimeOff.current?.();
        realtimeOff.current = null;
        setStatus("signedout");
        return;
      }
      if (resolvedFor.current === s.user.id) {
        setStatus("ready");
        return;
      }
      resolvedFor.current = s.user.id;

      try {
        const email = s.user.email ?? "";
        emailRef.current = email;
        // A synthetic phone/username login (`@phone.build` / `@username.build`) is
        // ALWAYS an athlete by construction — coaches sign in with a real email.
        // Never treat such a login as a coach or seed it a coach account, even if
        // stale rows are linked to it: doing so once seeded an athlete the demo
        // client and trapped them in the coach view (the "Jordan Rivera" bug).
        const syntheticLogin = isPhoneLogin(email) || isUsernameLogin(email);
        // Did this user sign up as an athlete? (metadata is durable; the URL
        // param covers the very first sign-up before metadata is readable.)
        const athleteIntent =
          syntheticLogin ||
          s.user.user_metadata?.intent === "athlete" ||
          new URLSearchParams(window.location.search).get("role") === "athlete";

        // Coach if they own clients; otherwise an athlete if their email is
        // assigned to a client; otherwise a brand-new coach (seed their account).
        if (!syntheticLogin && (await coachHasClients(s.user.id))) {
          setCoachId(s.user.id);
          const remote = await pullDB();
          if (remote) hydrate(remote);
          roleRef.current = "coach";
          setRole("coach");
        } else {
          let ath = email ? await pullAthlete(email) : null;
          // Just confirmed a native email change? Reconcile their client row to
          // the new email, then re-pull so role detection lands on athlete.
          if (!ath && email && (await syncLogin(s.access_token))) {
            ath = await pullAthlete(email);
          }
          if (ath) {
            setAthleteRole(ath.coachId, ath.clientId);
            hydrate(ath.db);
            setAthleteClientId(ath.clientId);
            roleRef.current = "athlete";
            setRole("athlete");
          } else if (athleteIntent) {
            // Athlete signed up but the coach hasn't linked their email/phone yet.
            // Do NOT seed them a coach account — show the "ask your coach" state.
            setAthleteClientId(null);
            roleRef.current = "athlete";
            setRole("athlete");
          } else {
            setCoachId(s.user.id);
            const seed = buildSeedDB();
            hydrate(seed);
            await pushNow(seed);
            roleRef.current = "coach";
            setRole("coach");
          }
        }
        // start live sync once
        if (!realtimeOff.current) realtimeOff.current = startRealtime(scheduleRepull);
      } catch {
        console.warn("sign-in sync failed");
        resolvedFor.current = null; // allow a retry on the next auth event
      }
      setStatus("ready");
    };

    sb.auth.getSession().then(({ data }) => handle(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      // A confirmed email change fires USER_UPDATED with the SAME user id, which the
      // resolvedFor guard would otherwise skip — force a re-resolve so sync-login
      // reconciles the client row to the new email.
      if (event === "USER_UPDATED") resolvedFor.current = null;
      handle(s);
    });
    return () => {
      sub.subscription.unsubscribe();
      realtimeOff.current?.();
      realtimeOff.current = null;
      if (repullTimer.current) clearTimeout(repullTimer.current);
    };
  }, [sb]);

  // Local-only design-direction preview (/preview): render it without the auth
  // gate or athlete redirect so it's viewable regardless of sign-in state.
  if (pathname?.startsWith("/preview")) {
    return (
      <SessionCtx.Provider value={{ session, cloud, role }}>{children}</SessionCtx.Provider>
    );
  }

  if (cloud && status === "loading") {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-bone overflow-hidden overscroll-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png?v=10" alt="BUILD" className="w-24 h-24 animate-lift" />
      </div>
    );
  }

  if (cloud && recovering && session) {
    return <PasswordRecovery onDone={() => setRecovering(false)} />;
  }

  if (cloud && status === "signedout") {
    return <AuthGate />;
  }

  return (
    <SessionCtx.Provider value={{ session, cloud, role }}>
      <BiometricLock>
        {role === "athlete" ? <AthleteApp clientId={athleteClientId ?? ""} /> : children}
      </BiometricLock>
    </SessionCtx.Provider>
  );
}
