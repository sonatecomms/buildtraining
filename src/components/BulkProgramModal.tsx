"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { addWorkoutObject, addWorkouts, uid, useExercises } from "@/lib/store";
import { weekStartIso, weekStartIsoFrom } from "@/lib/week";
import { PROGRAM_TEMPLATES, buildPlanWorkouts, planSessionCount, type ProgramTemplate } from "@/lib/programTemplates";
import type { Client, ProgramItem, Workout } from "@/lib/types";
import ExercisePickerModal from "./ExercisePickerModal";
import CustomPlanBuilder from "./CustomPlanBuilder";
import { Button } from "./ui";

const DOWS = ["S", "M", "T", "W", "T", "F", "S"];

// Manual bulk programming: the coach hand-builds one workout (movements + sets/
// reps/rest) and assigns it to every filtered athlete. The AI generator is the
// alternate path (onUseAI).
export default function BulkProgramModal({
  clients,
  onClose,
  onUseAI,
}: {
  clients: Client[];
  onClose: () => void;
  onUseAI: () => void;
}) {
  const exercises = useExercises();
  const byId = useMemo(() => Object.fromEntries(exercises.map((e) => [e.id, e])), [exercises]);
  const [tab, setTab] = useState<"plan" | "session">("plan");
  const [plan, setPlan] = useState<ProgramTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [name, setName] = useState("");
  const [items, setItems] = useState<ProgramItem[]>([]);
  const [dow, setDow] = useState(new Date().getDay());
  const [pickerOpen, setPickerOpen] = useState(false);
  const who = `${clients.length} ${clients.length === 1 ? "athlete" : "athletes"}`;

  const applyPlan = () => {
    if (!plan) return;
    const tag = { planKey: uid("plan"), planName: plan.name };
    for (const c of clients) {
      addWorkouts(c.id, buildPlanWorkouts(plan, exercises, (w) => weekStartIsoFrom(startDate, w), tag));
    }
    onClose();
  };

  const addItem = (exId: string) =>
    setItems((cur) => [...cur, { id: uid("i"), exerciseId: exId, sets: 3, reps: "8", rest: "90s" }]);
  const update = (id: string, patch: Partial<ProgramItem>) =>
    setItems((cur) => cur.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id: string) => setItems((cur) => cur.filter((it) => it.id !== id));

  const assign = () => {
    if (!items.length) return;
    const weekStart = weekStartIso(0);
    const blocks = items.map((it) => ({ id: uid("b"), type: "single" as const, items: [it] }));
    for (const c of clients) {
      const w: Workout = {
        id: uid("w"),
        name: name.trim() || "Team workout",
        dow,
        weekStart,
        blocks: JSON.parse(JSON.stringify(blocks)),
      };
      addWorkoutObject(c.id, w);
    }
    onClose();
  };

  if (creating) {
    return (
      <CustomPlanBuilder
        clients={clients}
        startDate={startDate}
        setStartDate={setStartDate}
        onClose={onClose}
        onBack={() => setCreating(false)}
      />
    );
  }

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
            <h2 className="font-bold">Program {clients.length} athletes</h2>
            <button onClick={onClose} className="text-slate text-2xl leading-none px-2" aria-label="Close">
              ×
            </button>
          </div>

          <div className="overflow-y-auto px-4 py-3 min-h-0 flex-1 space-y-3 overscroll-contain">
            {/* mode: a multi-week plan, or a single session */}
            <div className="grid grid-cols-2 gap-1 bg-field rounded-xl p-1">
              {(["plan", "session"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setTab(m)}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                    tab === m ? "bg-forest text-bone" : "text-slate"
                  }`}
                >
                  {m === "plan" ? "Multi-week plan" : "Single session"}
                </button>
              ))}
            </div>

            {tab === "plan" ? (
              <div className="space-y-2">
                <label className="flex items-center justify-between gap-2 rounded-xl bg-field border border-line px-3 py-2">
                  <span className="text-[12px] font-semibold text-slate">Start date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-sm outline-none text-ink"
                  />
                </label>
                {PROGRAM_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPlan(t)}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${
                      plan?.id === t.id ? "border-forest bg-surface" : "border-line bg-surface/60 hover:bg-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{t.name}</span>
                      <span className="text-[11px] text-slate shrink-0">
                        {t.weeks} wk · {t.daysPerWeek}×
                      </span>
                    </div>
                    <p className="text-[12px] text-slate mt-0.5">{t.blurb}</p>
                    <p className="text-[11px] text-slate/70 mt-1">
                      {planSessionCount(t)} sessions · starts this week
                    </p>
                  </button>
                ))}
                <button
                  onClick={() => setCreating(true)}
                  className="w-full rounded-xl border border-dashed border-line text-accent font-semibold py-2.5 text-sm active:scale-[0.99] transition-transform"
                >
                  + Build a custom plan
                </button>
              </div>
            ) : (
            <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workout name (e.g. Lower power)"
              className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            />

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate/60 mb-1.5">Day</p>
              <div className="grid grid-cols-7 gap-1">
                {DOWS.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setDow(i)}
                    className={`h-9 rounded-lg text-xs font-bold transition-colors ${
                      dow === i ? "bg-forest text-bone" : "bg-field text-slate"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {items.length === 0 && (
                <p className="text-[13px] text-slate text-center py-4">
                  Add movements to build the workout.
                </p>
              )}
              {items.map((it) => (
                <div key={it.id} className="rounded-xl border border-line bg-surface p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">
                      {byId[it.exerciseId]?.name ?? "Movement"}
                    </p>
                    <button onClick={() => remove(it.id)} aria-label="Remove" className="text-slate p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Field label="Sets">
                      <input
                        type="number"
                        value={it.sets}
                        onChange={(e) => update(it.id, { sets: +e.target.value || 0 })}
                        className="w-full rounded-lg bg-field border border-line px-2 py-1.5 text-sm outline-none focus:border-forest"
                      />
                    </Field>
                    <Field label="Reps">
                      <input
                        value={it.reps}
                        onChange={(e) => update(it.id, { reps: e.target.value })}
                        placeholder="8-10"
                        className="w-full rounded-lg bg-field border border-line px-2 py-1.5 text-sm outline-none focus:border-forest"
                      />
                    </Field>
                    <Field label="Rest">
                      <input
                        value={it.rest}
                        onChange={(e) => update(it.id, { rest: e.target.value })}
                        placeholder="90s"
                        className="w-full rounded-lg bg-field border border-line px-2 py-1.5 text-sm outline-none focus:border-forest"
                      />
                    </Field>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setPickerOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-line text-accent font-semibold py-2.5 text-sm active:scale-[0.99] transition-transform"
              >
                <Plus size={16} /> Add movement
              </button>
            </div>

            <button
              onClick={onUseAI}
              className="w-full flex items-center justify-center gap-1.5 text-[13px] font-semibold text-slate hover:text-ink py-1"
            >
              <Sparkles size={14} /> Use AI generator instead
            </button>
            </>
            )}
          </div>

          <div className="px-4 py-3 border-t border-line shrink-0">
            {tab === "plan" ? (
              <Button className="w-full" onClick={applyPlan} disabled={!plan}>
                {plan ? `Apply to ${who}` : "Select a plan"}
              </Button>
            ) : (
              <Button className="w-full" onClick={assign} disabled={items.length === 0}>
                Assign to {clients.length}
              </Button>
            )}
          </div>
        </div>
      </div>

      {pickerOpen && (
        <ExercisePickerModal onClose={() => setPickerOpen(false)} onPick={(ex) => addItem(ex.id)} />
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] text-slate font-medium">{label}</span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}
