"use client";

import { getSupabase } from "./supabase";
import { SEED_EXERCISES } from "./seed";
import type { Client, DB, Exercise, Program, WorkoutLog } from "./types";

// Whole-DB sync between the local store and Supabase. The dataset for a single
// coach is small, so on every change we upsert the current rows and delete any
// that no longer exist. No-ops entirely when Supabase isn't configured or no
// coach is signed in, so the app keeps working locally.

// In coach mode, coachId is the signed-in coach. In athlete mode, coachId is set
// to the athlete's coach (so log rows stamp the right coach_id) and mode limits
// what gets pushed up to just the athlete's own logs.
let coachId: string | null = null;
let mode: "coach" | "athlete" | null = null;
let athleteClientId: string | null = null;

export function setCoachId(id: string | null) {
  coachId = id;
  mode = id ? "coach" : null;
  athleteClientId = null;
}

export function setAthleteRole(coach: string, clientId: string) {
  coachId = coach;
  mode = "athlete";
  athleteClientId = clientId;
}

export function syncActive(): boolean {
  return Boolean(getSupabase() && coachId);
}

// Live updates: fire `onChange` whenever the coach's / athlete's rows change in
// the cloud (so the other side updates without a refresh). Returns an unsubscribe.
export function startRealtime(onChange: () => void): () => void {
  const sb = getSupabase();
  if (!sb || !coachId) return () => {};
  // Scope the subscription to this coach's rows so we don't wake on unrelated
  // coaches' changes (RLS already blocks reading them; this avoids the noise).
  const filter = `coach_id=eq.${coachId}`;
  const ch = sb
    .channel("build-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "clients", filter }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "programs", filter }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "workout_logs", filter }, onChange)
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

// ---- row <-> type mappers --------------------------------------------------

const clientRow = (c: Client) => ({
  id: c.id,
  coach_id: coachId,
  name: c.name,
  avatar_url: c.avatarUrl ?? null,
  stats: c.stats,
  goals: c.goals,
  intended_frequency: c.intendedFrequency,
  notes: c.notes ?? null,
  athlete_email: c.athleteEmail ?? null,
  recovery_email: c.recoveryEmail ?? null,
  archived: c.archived ?? false,
  created_at: c.createdAt,
});

const rowClient = (r: Record<string, unknown>): Client => ({
  id: r.id as string,
  name: r.name as string,
  avatarUrl: (r.avatar_url as string) ?? undefined,
  stats: (r.stats as Client["stats"]) ?? {},
  goals: (r.goals as Client["goals"]) ?? [],
  intendedFrequency: (r.intended_frequency as number) ?? 3,
  notes: (r.notes as string) ?? undefined,
  athleteEmail: (r.athlete_email as string) ?? undefined,
  recoveryEmail: (r.recovery_email as string) ?? undefined,
  archived: (r.archived as boolean) ?? false,
  createdAt: r.created_at as string,
});

const programRow = (p: Program) => ({
  id: p.id,
  coach_id: coachId,
  client_id: p.clientId,
  name: p.name,
  workouts: p.workouts,
  updated_at: p.updatedAt,
});

const rowProgram = (r: Record<string, unknown>): Program => ({
  id: r.id as string,
  clientId: r.client_id as string,
  name: r.name as string,
  workouts: (r.workouts as Program["workouts"]) ?? [],
  updatedAt: r.updated_at as string,
});

const logRow = (l: WorkoutLog) => ({
  id: l.id,
  coach_id: coachId,
  client_id: l.clientId,
  workout_id: l.workoutId,
  workout_name: l.workoutName,
  date: l.date,
  duration_min: l.durationMin ?? null,
  completed_item_ids: l.completedItemIds,
  rpe: l.rpe ?? null,
  entries: l.entries ?? [],
  // Only sent when present, so log writes still work on a DB that hasn't run the
  // workout_snapshot migration yet (the column is rejected only if included).
  ...(l.workoutSnapshot ? { workout_snapshot: l.workoutSnapshot } : {}),
});

const rowLog = (r: Record<string, unknown>): WorkoutLog => ({
  id: r.id as string,
  clientId: r.client_id as string,
  workoutId: r.workout_id as string,
  workoutName: r.workout_name as string,
  date: r.date as string,
  durationMin: (r.duration_min as number) ?? undefined,
  completedItemIds: (r.completed_item_ids as string[]) ?? [],
  rpe: (r.rpe as number) ?? undefined,
  entries: (r.entries as WorkoutLog["entries"]) ?? [],
  workoutSnapshot: (r.workout_snapshot as WorkoutLog["workoutSnapshot"]) ?? undefined,
});

const exerciseRow = (e: Exercise) => ({
  id: e.id,
  coach_id: coachId,
  name: e.name,
  category: e.category,
  equipment: e.equipment,
  primary_muscle: e.primaryMuscle,
  youtube_url: e.youtubeUrl ?? null,
  custom: true,
});

const rowExercise = (r: Record<string, unknown>): Exercise => ({
  id: r.id as string,
  name: r.name as string,
  category: r.category as Exercise["category"],
  equipment: r.equipment as Exercise["equipment"],
  primaryMuscle: r.primary_muscle as string,
  youtubeUrl: (r.youtube_url as string) ?? undefined,
  custom: true,
});

// Save one client's profile directly and report the result. Bypasses the
// debounced whole-DB push so a "Save" tap reliably persists (coach upserts their
// own row; athlete updates theirs). Returns the error message if it fails.
export async function saveClientNow(c: Client): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: true }; // local mode — already in localStorage
  if (!coachId) return { ok: false, error: "not synced yet — reload and try again" };
  lastWriteAt = Date.now();
  const row = clientRow(c);
  // .select() returns the affected rows — 0 rows means a permission/identity
  // mismatch silently dropped the write (the "Saved but resets" bug).
  const res =
    mode === "athlete"
      ? await sb.from("clients").update(row).eq("id", c.id).select()
      : await sb.from("clients").upsert(row).select();
  if (res.error) {
    console.warn("saveClientNow failed", res.error);
    return { ok: false, error: res.error.message };
  }
  if (!res.data || res.data.length === 0) {
    return {
      ok: false,
      error:
        mode === "athlete"
          ? "saved 0 rows — your login doesn't match this profile's athlete login"
          : "saved 0 rows — this profile isn't under your coach account",
    };
  }
  return { ok: true };
}

// ---- pull ------------------------------------------------------------------

// Returns the coach's cloud DB, or null when empty / unavailable.
export async function pullDB(): Promise<DB | null> {
  const sb = getSupabase();
  if (!sb || !coachId) return null;

  const [clients, programs, logs, exercises] = await Promise.all([
    sb.from("clients").select("*").eq("coach_id", coachId),
    sb.from("programs").select("*").eq("coach_id", coachId),
    sb.from("workout_logs").select("*").eq("coach_id", coachId),
    sb.from("exercises").select("*").eq("coach_id", coachId),
  ]);

  if (clients.error || programs.error || logs.error || exercises.error) {
    console.warn("Supabase pull failed", clients.error || programs.error || logs.error || exercises.error);
    return null;
  }

  if ((clients.data?.length ?? 0) === 0) return null; // brand-new account

  const custom = (exercises.data ?? []).map(rowExercise);
  return {
    clients: (clients.data ?? []).map(rowClient),
    programs: (programs.data ?? []).map(rowProgram),
    logs: (logs.data ?? []).map(rowLog),
    // seed movements live in code; merge any coach-added ones on top
    exercises: [...custom, ...SEED_EXERCISES],
  };
}

// Does this signed-in user own any clients (i.e. is a coach)?
export async function coachHasClients(uid: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data } = await sb.from("clients").select("id").eq("coach_id", uid).limit(1);
  return (data?.length ?? 0) > 0;
}

// Load an athlete's scoped data by their login email (the coach set this on the
// client). Returns the data plus the coach id so log writes stamp correctly.
export async function pullAthlete(
  email: string,
): Promise<{ db: DB; coachId: string; clientId: string } | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: rows } = await sb.from("clients").select("*").ilike("athlete_email", email).limit(1);
  const client = rows?.[0];
  if (!client) return null;
  const coach = client.coach_id as string;

  const [programs, logs, exercises] = await Promise.all([
    sb.from("programs").select("*").eq("client_id", client.id),
    sb.from("workout_logs").select("*").eq("client_id", client.id),
    sb.from("exercises").select("*").eq("coach_id", coach),
  ]);

  const custom = (exercises.data ?? []).map(rowExercise);
  return {
    coachId: coach,
    clientId: client.id as string,
    db: {
      clients: [rowClient(client)],
      programs: (programs.data ?? []).map(rowProgram),
      logs: (logs.data ?? []).map(rowLog),
      exercises: [...custom, ...SEED_EXERCISES],
    },
  };
}

// ---- push (debounced) ------------------------------------------------------

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: DB | null = null;
let lastWriteAt = 0;

// Keep realtime re-pulls from clobbering an in-progress / just-saved edit:
// pause entirely while editing a profile, and defer for a few seconds after any
// local write.
// Refcounted so overlapping editors (or StrictMode double-invoke) can't leave
// realtime stuck paused/resumed.
let pauseCount = 0;
export function setRealtimePaused(p: boolean) {
  pauseCount = Math.max(0, pauseCount + (p ? 1 : -1));
}
export function shouldDeferRepull(): boolean {
  return pauseCount > 0 || Date.now() - lastWriteAt < 6000;
}

// Cancel any debounced push (called after a hydrate from the cloud, which is now
// authoritative — pushing the pre-hydrate snapshot would prune newer cloud rows).
export function cancelPendingPush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  pending = null;
}

export function schedulePush(db: DB) {
  if (!syncActive()) return;
  lastWriteAt = Date.now();
  pending = db;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    const snapshot = pending;
    pending = null;
    timer = null;
    if (snapshot) void pushNow(snapshot);
  }, 700);
}

// Push any pending change to Supabase immediately and wait for it. Call this
// before navigating away on destructive actions (e.g. deleting an athlete) so a
// full-page reload doesn't re-pull stale cloud data. No-op in local mode.
export async function flushPush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const snapshot = pending;
  pending = null;
  if (snapshot) await pushNow(snapshot);
}

async function syncTable(
  table: string,
  rows: Record<string, unknown>[],
  ids: string[],
) {
  const sb = getSupabase();
  if (!sb || !coachId) return;
  if (rows.length) {
    const { error } = await sb.from(table).upsert(rows);
    if (error) console.warn(`upsert ${table} failed`, error);
  }
  // Remove rows that no longer exist locally. CRITICAL: never prune when the
  // local id list is empty — that would delete every row the coach owns in this
  // table (data loss on an empty/partial snapshot). Only prune against a
  // non-empty, known set.
  if (ids.length === 0) return;
  const { error } = await sb
    .from(table)
    .delete()
    .eq("coach_id", coachId)
    .not("id", "in", `(${ids.map((i) => `"${i}"`).join(",")})`);
  if (error) console.warn(`prune ${table} failed`, error);
}

export async function pushNow(db: DB) {
  if (!syncActive()) return;

  // Athletes only ever write their own client profile + workout logs.
  if (mode === "athlete") {
    const sb = getSupabase();
    if (!sb || !athleteClientId) return;
    const me = db.clients.find((c) => c.id === athleteClientId);
    if (me) {
      // update only — athletes have no INSERT right on clients, so upsert would fail
      const { error } = await sb.from("clients").update(clientRow(me)).eq("id", athleteClientId);
      if (error) console.warn("athlete profile push failed", error);
    }
    const rows = db.logs.filter((l) => l.clientId === athleteClientId).map(logRow);
    if (rows.length) {
      const { error } = await sb.from("workout_logs").upsert(rows);
      if (error) console.warn("athlete log push failed", error);
    }
    return;
  }

  const custom = db.exercises.filter((e) => e.custom);
  await Promise.all([
    syncTable("clients", db.clients.map(clientRow), db.clients.map((c) => c.id)),
    syncTable("programs", db.programs.map(programRow), db.programs.map((p) => p.id)),
    syncTable("workout_logs", db.logs.map(logRow), db.logs.map((l) => l.id)),
    syncTable("exercises", custom.map(exerciseRow), custom.map((e) => e.id)),
  ]);
}
