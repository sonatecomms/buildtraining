"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import {
  coachHasClients,
  pullAthlete,
  pullDB,
  pushNow,
  setAthleteRole,
  setCoachId,
} from "@/lib/sync";
import { hydrate } from "@/lib/store";
import { buildSeedDB } from "@/lib/seed";
import AuthGate from "./AuthGate";
import AthleteApp from "./AthleteApp";

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
  const [athleteClientId, setAthleteClientId] = useState<string | null>(null);
  const resolvedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!sb) return; // local mode

    const handle = async (s: Session | null) => {
      setSession(s);
      if (!s) {
        setCoachId(null);
        resolvedFor.current = null;
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
        // Coach if they own clients; otherwise an athlete if their email is
        // assigned to a client; otherwise a brand-new coach (seed their account).
        if (await coachHasClients(s.user.id)) {
          setCoachId(s.user.id);
          const remote = await pullDB();
          if (remote) hydrate(remote);
          setRole("coach");
        } else {
          const ath = email ? await pullAthlete(email) : null;
          if (ath) {
            setAthleteRole(ath.coachId, ath.clientId);
            hydrate(ath.db);
            setAthleteClientId(ath.clientId);
            setRole("athlete");
          } else {
            setCoachId(s.user.id);
            const seed = buildSeedDB();
            hydrate(seed);
            await pushNow(seed);
            setRole("coach");
          }
        }
      } catch (e) {
        console.warn("sign-in sync failed", e);
      }
      setStatus("ready");
    };

    sb.auth.getSession().then(({ data }) => handle(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => handle(s));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  if (cloud && status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-bone">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="BUILD" className="w-24 h-24 animate-lift" />
      </div>
    );
  }

  if (cloud && status === "signedout") {
    return <AuthGate />;
  }

  return (
    <SessionCtx.Provider value={{ session, cloud, role }}>
      {role === "athlete" && athleteClientId ? <AthleteApp clientId={athleteClientId} /> : children}
    </SessionCtx.Provider>
  );
}
