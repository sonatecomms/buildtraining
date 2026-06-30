"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, ChevronLeft, Minus } from "lucide-react";
import { addWorkouts, uid, useExercises } from "@/lib/store";
import { weekStartIsoFrom } from "@/lib/week";
import type { Client, ProgramItem, Workout } from "@/lib/types";
import ExercisePickerModal from "./ExercisePickerModal";
import { Button } from "./ui";

const DOWS = ["S", "M", "T", "W", "T", "F", "S"];
type Session = { id: string; dow: number; name: string; items: ProgramItem[] };

// Coach-built multi-week plan: name it, set the length, lay out a week of
// training days, and it repeats across the weeks for every selected athlete.
export default function CustomPlanBuilder({
  clients,
  startDate,
  setStartDate,
  onClose,
  onBack,
}: {
  clients: Client[];
  startDate: string;
  setStartDate: (v: string) => void;
  onClose: () => void;
  onBack: () => void;
}) {
  const exercises = useExercises();
  const byId = useMemo(() => Object.fromEntries(exercises.map((e) => [e.id, e])), [exercises]);
  const [planName, setPlanName] = useState("");
  const [weeks, setWeeks] = useState(6);
  const [sessions, setSessions] = useState<Session[]>([{ id: uid("ps"), dow: 1, name: "", items: [] }]);
  const [pickFor, setPickFor] = useState<string | null>(null);

  const setSession = (id: string, patch: Partial<Session>) =>
    setSessions((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const addItemTo = (sid: string, exId: string) =>
    setSession(sid, {
      items: [...(sessions.find((x) => x.id === sid)?.items ?? []), { id: uid("i"), exerciseId: exId, sets: 3, reps: "8", rest: "90s" }],
    });
  const setItem = (sid: string, iid: string, patch: Partial<ProgramItem>) =>
    setSessions((s) =>
      s.map((x) => (x.id === sid ? { ...x, items: x.items.map((it) => (it.id === iid ? { ...it, ...patch } : it)) } : x)),
    );
  const rmItem = (sid: string, iid: string) =>
    setSessions((s) => s.map((x) => (x.id === sid ? { ...x, items: x.items.filter((it) => it.id !== iid) } : x)));

  const valid = sessions.filter((s) => s.items.length);
  const total = valid.length * weeks;
  const who = `${clients.length} ${clients.length === 1 ? "athlete" : "athletes"}`;

  const apply = () => {
    if (!valid.length) return;
    const tag = { planKey: uid("plan"), planName: planName.trim() || "Custom plan" };
    for (const c of clients) {
      const out: Workout[] = [];
      for (let w = 0; w < weeks; w++) {
        const ws = weekStartIsoFrom(startDate, w);
        for (const s of valid) {
          out.push({
            id: uid("w"),
            name: s.name.trim() || planName.trim() || "Session",
            dow: s.dow,
            weekStart: ws,
            blocks: s.items.map((it) => ({ id: uid("b"), type: "single" as const, items: [JSON.parse(JSON.stringify(it))] })),
            ...tag,
          });
        }
      }
      addWorkouts(c.id, out);
    }
    onClose();
  };

  return (
    <>
      <div
        data-noswipe
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-shell w-full sm:max-w-md max-h-[88dvh] sm:max-h-[85dvh] rounded-t-3xl sm:rounded-3xl border border-line shadow-hero flex flex-col min-h-0 animate-pop overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
            <button onClick={onBack} className="flex items-center gap-1 text-slate text-sm font-semibold" aria-label="Back to plans">
              <ChevronLeft size={16} /> Plans
            </button>
            <h2 className="font-bold">Create a plan</h2>
            <button onClick={onClose} className="text-slate text-2xl leading-none px-2" aria-label="Close">
              ×
            </button>
          </div>

          <div className="overflow-y-auto px-4 py-3 min-h-0 flex-1 space-y-3 overscroll-contain">
            <input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Plan name (e.g. Off-season strength)"
              className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            />

            <label className="flex items-center justify-between gap-2 rounded-xl bg-field border border-line px-3 py-2">
              <span className="text-[12px] font-semibold text-slate">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm outline-none text-ink"
              />
            </label>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate/60">Length</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setWeeks((w) => Math.max(1, w - 1))} className="grid place-items-center w-8 h-8 rounded-full bg-field text-ink active:scale-95" aria-label="Fewer weeks">
                  <Minus size={15} />
                </button>
                <span className="font-display text-base w-16 text-center">{weeks} wk</span>
                <button onClick={() => setWeeks((w) => Math.min(20, w + 1))} className="grid place-items-center w-8 h-8 rounded-full bg-field text-ink active:scale-95" aria-label="More weeks">
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {sessions.map((s, i) => (
              <div key={s.id} className="rounded-xl border border-line bg-surface p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    value={s.name}
                    onChange={(e) => setSession(s.id, { name: e.target.value })}
                    placeholder={`Day ${i + 1} name (e.g. Lower)`}
                    className="flex-1 min-w-0 rounded-lg bg-field border border-line px-2.5 py-1.5 text-sm outline-none focus:border-forest"
                  />
                  {sessions.length > 1 && (
                    <button onClick={() => setSessions((x) => x.filter((y) => y.id !== s.id))} aria-label="Remove day" className="text-slate p-1">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {DOWS.map((d, di) => (
                    <button
                      key={di}
                      onClick={() => setSession(s.id, { dow: di })}
                      className={`h-8 rounded-lg text-xs font-bold transition-colors ${s.dow === di ? "bg-forest text-bone" : "bg-field text-slate"}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                {s.items.map((it) => (
                  <div key={it.id} className="rounded-lg border border-line/70 bg-field/40 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[13px] truncate">{byId[it.exerciseId]?.name ?? "Movement"}</span>
                      <button onClick={() => rmItem(s.id, it.id)} aria-label="Remove movement" className="text-slate p-0.5">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      <input type="number" inputMode="numeric" value={it.sets || ""} onChange={(e) => setItem(s.id, it.id, { sets: e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0) })} aria-label="Sets" placeholder="sets" className="w-full rounded-md bg-surface border border-line px-2 py-1 text-sm outline-none focus:border-forest" />
                      <input value={it.reps} onChange={(e) => setItem(s.id, it.id, { reps: e.target.value })} placeholder="reps" className="w-full rounded-md bg-surface border border-line px-2 py-1 text-sm outline-none focus:border-forest" />
                      <input value={it.rest} onChange={(e) => setItem(s.id, it.id, { rest: e.target.value })} placeholder="rest" className="w-full rounded-md bg-surface border border-line px-2 py-1 text-sm outline-none focus:border-forest" />
                    </div>
                  </div>
                ))}
                <button onClick={() => setPickFor(s.id)} className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-line text-accent font-semibold py-2 text-[13px] active:scale-[0.99]">
                  <Plus size={15} /> Add movement
                </button>
              </div>
            ))}

            <button
              onClick={() => setSessions((s) => [...s, { id: uid("ps"), dow: 1, name: "", items: [] }])}
              className="w-full rounded-xl border border-dashed border-line text-slate hover:text-ink font-semibold py-2.5 text-sm active:scale-[0.99]"
            >
              + Add training day
            </button>
          </div>

          <div className="px-4 py-3 border-t border-line shrink-0">
            <Button className="w-full" onClick={apply} disabled={!valid.length}>
              {valid.length ? `Apply to ${who} · ${total} sessions` : "Add a movement to a day"}
            </Button>
          </div>
        </div>
      </div>

      {pickFor && (
        <ExercisePickerModal
          onClose={() => setPickFor(null)}
          onPick={(ex) => addItemTo(pickFor, ex.id)}
        />
      )}
    </>
  );
}
