"use client";

import { useSyncExternalStore } from "react";
import type {
  Block,
  Client,
  DB,
  Exercise,
  Program,
  Workout,
  WorkoutLog,
} from "./types";
import { buildSeedDB } from "./seed";
import { cancelPendingPush, schedulePush } from "./sync";
import { isoDate, weekStartIso } from "./week";

const KEY = "fitcoach.db.v2";

// Programming is per-week and independent: every workout is stamped with the
// Sunday (weekStart) of the week it belongs to. Legacy data predates this — those
// workouts have no weekStart and used to repeat on every week. Migrate them onto
// the current week so existing programming lands somewhere concrete (past weeks
// were never stored separately, so they start empty and are built going forward).
function migrate(dbIn: DB): DB {
  const ws = weekStartIso(0);
  let changed = false;
  const programs = dbIn.programs.map((p) => {
    if (p.workouts.every((w) => w.weekStart)) return p;
    changed = true;
    return {
      ...p,
      workouts: p.workouts.map((w) => (w.weekStart ? w : { ...w, weekStart: ws })),
    };
  });
  return changed ? { ...dbIn, programs } : dbIn;
}

// ---- persistence -----------------------------------------------------------
// Local-first store. To move to Supabase, swap load()/persist() for client
// queries against the matching tables (see supabase/schema.sql) — the shapes
// already line up one-to-one.

function load(): DB {
  if (typeof window === "undefined") return buildSeedDB();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const seeded = migrate(buildSeedDB());
      window.localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    return migrate(JSON.parse(raw) as DB);
  } catch {
    return migrate(buildSeedDB());
  }
}

let db: DB | null = null;
const listeners = new Set<() => void>();

function getDB(): DB {
  if (db === null) db = load();
  return db;
}

function commit(next: DB) {
  db = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  schedulePush(next); // no-op unless Supabase is configured + signed in
  listeners.forEach((l) => l());
}

// Replace the whole store (used after pulling a coach's data from Supabase on
// login). Persists locally and notifies, but does not push back.
export function hydrate(next: DB) {
  db = migrate(next);
  next = db;
  cancelPendingPush(); // cloud is now authoritative — drop any stale debounced push
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// useSyncExternalStore needs a stable server snapshot to avoid hydration churn.
const serverSnapshot = migrate(buildSeedDB());

function useDB(): DB {
  return useSyncExternalStore(subscribe, getDB, () => serverSnapshot);
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function today(): string {
  return isoDate(); // local calendar date, not UTC
}

// ---- read hooks ------------------------------------------------------------

export function useClients(): Client[] {
  return useDB().clients;
}

export function useClient(id: string | undefined): Client | undefined {
  return useDB().clients.find((c) => c.id === id);
}

export function useExercises(): Exercise[] {
  return useDB().exercises;
}

export function useProgramForClient(clientId: string | undefined): Program | undefined {
  return useDB().programs.find((p) => p.clientId === clientId);
}

export function useLogsForClient(clientId: string | undefined): WorkoutLog[] {
  return useDB()
    .logs.filter((l) => l.clientId === clientId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ---- client CRUD -----------------------------------------------------------

export function addClient(partial: Partial<Client>): Client {
  const c: Client = {
    id: uid("client"),
    name: partial.name || "New Client",
    avatarUrl: partial.avatarUrl,
    stats: partial.stats || {},
    goals: partial.goals || [],
    intendedFrequency: partial.intendedFrequency ?? 3,
    notes: partial.notes,
    createdAt: today(),
  };
  const cur = getDB();
  commit({ ...cur, clients: [...cur.clients, c] });
  return c;
}

// Non-hook read of the latest client (for an explicit save that must use current data).
export function getClient(id: string): Client | undefined {
  return getDB().clients.find((c) => c.id === id);
}

export function updateClient(id: string, patch: Partial<Client>) {
  const cur = getDB();
  commit({
    ...cur,
    clients: cur.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  });
}

export function setClientArchived(id: string, archived: boolean) {
  updateClient(id, { archived });
}

export function deleteClient(id: string) {
  const cur = getDB();
  commit({
    ...cur,
    clients: cur.clients.filter((c) => c.id !== id),
    programs: cur.programs.filter((p) => p.clientId !== id),
    logs: cur.logs.filter((l) => l.clientId !== id),
  });
}

// ---- exercise repository ----------------------------------------------------

export function addExercise(ex: Omit<Exercise, "id">): Exercise {
  const created: Exercise = { ...ex, id: uid("ex"), custom: true };
  const cur = getDB();
  commit({ ...cur, exercises: [created, ...cur.exercises] });
  return created;
}

// ---- program editing -------------------------------------------------------

function ensureProgram(clientId: string): Program {
  const cur = getDB();
  let prog = cur.programs.find((p) => p.clientId === clientId);
  if (!prog) {
    prog = {
      id: uid("prog"),
      clientId,
      name: "New Program",
      workouts: [],
      updatedAt: today(),
    };
    commit({ ...cur, programs: [...cur.programs, prog] });
  }
  return prog;
}

function saveProgram(next: Program) {
  const cur = getDB();
  const stamped = { ...next, updatedAt: today() };
  commit({
    ...cur,
    programs: cur.programs.some((p) => p.id === next.id)
      ? cur.programs.map((p) => (p.id === next.id ? stamped : p))
      : [...cur.programs, stamped],
  });
}

export function renameProgram(clientId: string, name: string) {
  const prog = ensureProgram(clientId);
  saveProgram({ ...prog, name });
}

// ---- per-week programming ---------------------------------------------------
// Programming is per-week and independent: each workout is stamped with the
// weekStart (the week's Sunday) it belongs to. There is no recurring default —
// editing one week never affects another. To repeat a week, copy it forward.

// The workouts programmed for a given week.
export function workoutsForWeek(program: Program | undefined, weekStart: string): Workout[] {
  if (!program) return [];
  return program.workouts.filter((w) => w.weekStart === weekStart);
}

function cloneWorkout(w: Workout, patch: Partial<Workout>): Workout {
  return {
    ...w,
    id: uid("w"),
    blocks: w.blocks.map((b) => ({
      ...b,
      id: uid("b"),
      items: b.items.map((it) => ({ ...it, id: uid("i") })),
    })),
    ...patch,
  };
}

// Copy everything programmed for `fromWeekStart` into `toWeekStart`, replacing
// whatever was there. Used to repeat a week forward.
export function copyWeekProgramming(
  clientId: string,
  fromWeekStart: string,
  toWeekStart: string,
) {
  if (fromWeekStart === toWeekStart) return;
  const prog = ensureProgram(clientId);
  const src = workoutsForWeek(prog, fromWeekStart);
  const others = prog.workouts.filter((w) => w.weekStart !== toWeekStart);
  const clones = src.map((w) => cloneWorkout(w, { weekStart: toWeekStart }));
  saveProgram({ ...prog, workouts: [...others, ...clones] });
}

// Add a workout to a specific week.
export function addWorkout(
  clientId: string,
  name: string,
  dow: number,
  weekStart: string,
): Workout {
  const prog = ensureProgram(clientId);
  const w: Workout = { id: uid("w"), name, dow, blocks: [], weekStart };
  saveProgram({ ...prog, workouts: [...prog.workouts, w] });
  return w;
}

export function renameWorkout(clientId: string, workoutId: string, name: string) {
  const prog = ensureProgram(clientId);
  saveProgram({
    ...prog,
    workouts: prog.workouts.map((w) => (w.id === workoutId ? { ...w, name } : w)),
  });
}

// Copy a whole workout (all blocks/movements) to another weekday.
export function duplicateWorkout(clientId: string, workoutId: string, toDow: number) {
  const prog = ensureProgram(clientId);
  const w = prog.workouts.find((x) => x.id === workoutId);
  if (!w) return;
  const clone = {
    ...w,
    id: uid("w"),
    dow: toDow,
    blocks: w.blocks.map((b) => ({
      ...b,
      id: uid("b"),
      items: b.items.map((it) => ({ ...it, id: uid("i") })),
    })),
  };
  saveProgram({ ...prog, workouts: [...prog.workouts, clone] });
}

export function setWorkoutDow(clientId: string, workoutId: string, dow: number) {
  const prog = ensureProgram(clientId);
  saveProgram({
    ...prog,
    workouts: prog.workouts.map((w) => (w.id === workoutId ? { ...w, dow } : w)),
  });
}

export function deleteWorkout(clientId: string, workoutId: string) {
  const prog = ensureProgram(clientId);
  saveProgram({ ...prog, workouts: prog.workouts.filter((w) => w.id !== workoutId) });
}

function mutateWorkout(
  clientId: string,
  workoutId: string,
  fn: (w: Workout) => Workout,
) {
  const prog = ensureProgram(clientId);
  saveProgram({
    ...prog,
    workouts: prog.workouts.map((w) => (w.id === workoutId ? fn(w) : w)),
  });
}

// Add a free-text note section (warm-up, metcon, cues) — no movement required.
export function addNoteBlock(clientId: string, workoutId: string) {
  mutateWorkout(clientId, workoutId, (w) => ({
    ...w,
    blocks: [...w.blocks, { id: uid("b"), type: "note", items: [], title: "", text: "" }],
  }));
}

export function setBlockText(
  clientId: string,
  workoutId: string,
  blockId: string,
  patch: { title?: string; text?: string },
) {
  mutateWorkout(clientId, workoutId, (w) => ({
    ...w,
    blocks: w.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)),
  }));
}

function defaultVariant(exerciseId: string): string | undefined {
  return getDB().exercises.find((e) => e.id === exerciseId)?.variants?.[0];
}

// Add an exercise to a workout as its own single block.
export function addExerciseBlock(clientId: string, workoutId: string, exerciseId: string) {
  const variant = defaultVariant(exerciseId);
  mutateWorkout(clientId, workoutId, (w) => ({
    ...w,
    blocks: [
      ...w.blocks,
      {
        id: uid("b"),
        type: "single",
        items: [{ id: uid("i"), exerciseId, sets: 3, reps: "10", rest: "60s", variant }],
      },
    ],
  }));
}

export function addItemToBlock(
  clientId: string,
  workoutId: string,
  blockId: string,
  exerciseId: string,
) {
  const variant = defaultVariant(exerciseId);
  mutateWorkout(clientId, workoutId, (w) => ({
    ...w,
    blocks: w.blocks.map((b) =>
      b.id === blockId
        ? {
            ...b,
            items: [...b.items, { id: uid("i"), exerciseId, sets: 3, reps: "10", rest: "60s", variant }],
          }
        : b,
    ),
  }));
}

export function setBlockType(
  clientId: string,
  workoutId: string,
  blockId: string,
  type: Block["type"],
) {
  mutateWorkout(clientId, workoutId, (w) => ({
    ...w,
    blocks: w.blocks.map((b) =>
      b.id === blockId
        ? {
            ...b,
            type,
            // keep circuit timing fields only while it stays a circuit
            rounds: type === "circuit" ? b.rounds ?? 3 : undefined,
            mode: type === "circuit" ? b.mode : undefined,
            capSec: type === "circuit" ? b.capSec : undefined,
            intervalSec: type === "circuit" ? b.intervalSec : undefined,
          }
        : b,
    ),
  }));
}

// Set a circuit's mode (rounds / AMRAP / EMOM) and its timing fields, seeding
// sensible defaults the first time each mode is chosen.
export function setBlockConfig(
  clientId: string,
  workoutId: string,
  blockId: string,
  patch: Partial<Pick<Block, "mode" | "capSec" | "intervalSec" | "rounds">>,
) {
  mutateWorkout(clientId, workoutId, (w) => ({
    ...w,
    blocks: w.blocks.map((b) => {
      if (b.id !== blockId) return b;
      const next = { ...b, ...patch };
      if (patch.mode === "amrap" && next.capSec == null) next.capSec = 1200; // 20:00
      if (patch.mode === "emom") {
        if (next.intervalSec == null) next.intervalSec = 60;
        if (next.rounds == null) next.rounds = 10;
      }
      return next;
    }),
  }));
}

export function setBlockRounds(
  clientId: string,
  workoutId: string,
  blockId: string,
  rounds: number,
) {
  mutateWorkout(clientId, workoutId, (w) => ({
    ...w,
    blocks: w.blocks.map((b) => (b.id === blockId ? { ...b, rounds } : b)),
  }));
}

export function updateItem(
  clientId: string,
  workoutId: string,
  blockId: string,
  itemId: string,
  patch: Partial<{ sets: number; reps: string; rest: string; notes: string; tempo: string; youtubeUrl: string | undefined; variant: string }>,
) {
  mutateWorkout(clientId, workoutId, (w) => ({
    ...w,
    blocks: w.blocks.map((b) =>
      b.id === blockId
        ? { ...b, items: b.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
        : b,
    ),
  }));
}

export function removeItem(clientId: string, workoutId: string, blockId: string, itemId: string) {
  mutateWorkout(clientId, workoutId, (w) => ({
    ...w,
    // drop the item; if a movement block is now empty, drop it too (keep notes)
    blocks: w.blocks
      .map((b) => (b.id === blockId ? { ...b, items: b.items.filter((it) => it.id !== itemId) } : b))
      .filter((b) => b.type === "note" || b.items.length > 0),
  }));
}

export function moveBlock(clientId: string, workoutId: string, blockId: string, dir: -1 | 1) {
  mutateWorkout(clientId, workoutId, (w) => {
    const idx = w.blocks.findIndex((b) => b.id === blockId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= w.blocks.length) return w;
    const blocks = [...w.blocks];
    [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
    return { ...w, blocks };
  });
}

export function removeBlock(clientId: string, workoutId: string, blockId: string) {
  mutateWorkout(clientId, workoutId, (w) => ({
    ...w,
    blocks: w.blocks.filter((b) => b.id !== blockId),
  }));
}

// Reorder blocks by id (used by drag-and-drop).
export function reorderBlocks(clientId: string, workoutId: string, orderedIds: string[]) {
  mutateWorkout(clientId, workoutId, (w) => {
    const byId = new Map(w.blocks.map((b) => [b.id, b]));
    const blocks = orderedIds.map((id) => byId.get(id)).filter(Boolean) as typeof w.blocks;
    // keep any blocks not present in the ordered list (safety)
    for (const b of w.blocks) if (!orderedIds.includes(b.id)) blocks.push(b);
    return { ...w, blocks };
  });
}

// Move a movement into another block (drag a movement into an existing superset/
// circuit, or out to its own block). Dropping a second movement into a "single"
// block promotes it to a superset; emptied blocks are removed.
export function moveItemToBlock(
  clientId: string,
  workoutId: string,
  itemId: string,
  toBlockId: string,
  toIndex?: number,
) {
  mutateWorkout(clientId, workoutId, (w) => {
    let moved: (typeof w.blocks)[number]["items"][number] | undefined;
    // pull the item out of whichever block holds it; if a superset/circuit drops
    // to a single movement, demote it back to a plain "single" block
    const stripped = w.blocks.map((b) => {
      const found = b.items.find((it) => it.id === itemId);
      if (!found) return b;
      moved = found;
      const items = b.items.filter((it) => it.id !== itemId);
      const type = b.type !== "note" && items.length <= 1 ? "single" : b.type;
      return { ...b, items, type };
    });
    if (!moved) return w;

    let blocks = stripped.map((b) => {
      if (b.id !== toBlockId) return b;
      const items = [...b.items];
      const at = toIndex == null ? items.length : Math.max(0, Math.min(toIndex, items.length));
      items.splice(at, 0, moved!);
      // a single block that now holds two+ movements becomes a superset
      const type = b.type === "single" && items.length > 1 ? "superset" : b.type;
      return { ...b, items, type };
    });

    // drop any movement block left empty by the move (keep note blocks)
    blocks = blocks.filter((b) => b.type === "note" || b.items.length > 0);
    return { ...w, blocks };
  });
}

// Set or clear a per-use video override for a single movement.
export function setItemVideo(
  clientId: string,
  workoutId: string,
  blockId: string,
  itemId: string,
  url: string | undefined,
) {
  updateItem(clientId, workoutId, blockId, itemId, { youtubeUrl: url });
}

// ---- logging ---------------------------------------------------------------

export function logWorkout(log: Omit<WorkoutLog, "id">): WorkoutLog {
  const cur = getDB();
  // one log per workout per day. Reuse the existing row's id when re-logging so
  // the cloud upsert updates in place (the DB has a unique (client,workout,date)
  // constraint — a fresh id would collide instead of replacing).
  const existing = cur.logs.find(
    (l) => l.clientId === log.clientId && l.workoutId === log.workoutId && l.date === log.date,
  );
  const created: WorkoutLog = { ...log, id: existing?.id ?? uid("log") };
  const others = cur.logs.filter((l) => l.id !== created.id);
  commit({ ...cur, logs: [...others, created] });
  return created;
}

export function resetAll() {
  const seeded = buildSeedDB();
  commit(seeded);
}

// ---- gamification ----------------------------------------------------------

export interface StreakInfo {
  current: number; // consecutive active days up to today/yesterday
  longest: number;
  totalSessions: number;
  thisWeek: number;
  weeklyTarget: number;
  weekProgressPct: number;
  points: number;
  level: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  earned: boolean;
  hint: string;
}

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function computeStreak(logs: WorkoutLog[], weeklyTarget: number): StreakInfo {
  const days = Array.from(new Set(logs.map((l) => l.date))).sort(); // asc
  const totalSessions = logs.length;

  // longest run of consecutive calendar days
  let longest = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    if (i > 0 && dayDiff(days[i], days[i - 1]) === 1) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
  }

  // current streak counts back from today (allowing today to be a rest day)
  let current = 0;
  if (days.length) {
    const todayStr = isoDate();
    const last = days[days.length - 1];
    const gap = dayDiff(todayStr, last);
    if (gap <= 1) {
      current = 1;
      for (let i = days.length - 1; i > 0; i--) {
        if (dayDiff(days[i], days[i - 1]) === 1) current += 1;
        else break;
      }
    }
  }

  const weekStart = startOfWeek(new Date());
  const thisWeek = logs.filter((l) => new Date(l.date) >= weekStart).length;
  const weekProgressPct = weeklyTarget > 0 ? Math.min(100, Math.round((thisWeek / weeklyTarget) * 100)) : 0;

  const points = totalSessions * 50 + longest * 25;
  const level = Math.floor(points / 500) + 1;

  const badges: Badge[] = [
    { id: "first", label: "First Rep", icon: "🎯", hint: "Log your first workout", earned: totalSessions >= 1 },
    { id: "week", label: "Hot Streak", icon: "🔥", hint: "3-day streak", earned: longest >= 3 },
    { id: "ten", label: "Double Digits", icon: "💯", hint: "10 total sessions", earned: totalSessions >= 10 },
    { id: "consistent", label: "Locked In", icon: "🔒", hint: "Hit weekly target", earned: thisWeek >= weeklyTarget && weeklyTarget > 0 },
    { id: "month", label: "Iron Month", icon: "🏆", hint: "7-day streak", earned: longest >= 7 },
    { id: "fifty", label: "Half Century", icon: "⭐", hint: "50 total sessions", earned: totalSessions >= 50 },
  ];

  return { current, longest, totalSessions, thisWeek, weeklyTarget, weekProgressPct, points, level, badges };
}
