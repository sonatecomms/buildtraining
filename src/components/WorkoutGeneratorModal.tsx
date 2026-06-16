"use client";

import { useMemo, useState } from "react";
import { addWorkoutObject, uid, useExercises, useProgramForClient } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import { surroundingLoad } from "@/lib/workoutLoad";
import { buildDemoWorkout, toWorkout, type GeneratedWorkout } from "@/lib/generateWorkout";
import type { Client, Workout } from "@/lib/types";
import { DOW_LONG } from "@/lib/week";
import { Button } from "./ui";
import { useIsDemo } from "./demoContext";

const FOCUS_OPTIONS: { value: string; label: string }[] = [
  { value: "metcon", label: "CrossFit metcon" },
  { value: "full", label: "Full body" },
  { value: "upper", label: "Upper body" },
  { value: "lower", label: "Lower body" },
  { value: "cardio", label: "Cardio / engine" },
  { value: "core", label: "Core" },
];

// Emphasis options when the focus is a CrossFit metcon.
const METCON_TYPES: { value: string; label: string }[] = [
  { value: "engine", label: "Engine builder" },
  { value: "strength", label: "Strength builder" },
  { value: "cardio", label: "Cardio builder" },
  { value: "hinge", label: "Hinge patterns" },
  { value: "power", label: "Explosive / power" },
  { value: "gymnastics", label: "Gymnastics / skill" },
  { value: "mixed", label: "Mixed / classic" },
];

const EQUIPMENT_OPTIONS = [
  "Bodyweight",
  "Dumbbells",
  "Barbell",
  "Kettlebell",
  "Machines",
  "Cardio machine",
  "Pull-up bar / rings",
  "Box",
  "Jump rope",
  "Bands",
];

const TIME_PRESETS = [10, 20, 30, 45, 60];

export default function WorkoutGeneratorModal({
  client,
  dow,
  weekStart,
  onClose,
  onAdded,
  bulkClients,
}: {
  client: Client;
  dow: number;
  weekStart: string;
  onClose: () => void;
  onAdded?: () => void;
  // When set, the built workout is assigned to every athlete in this list (the
  // `client` prop is the representative used for context/preview).
  bulkClients?: Client[];
}) {
  const bulk = bulkClients && bulkClients.length > 1 ? bulkClients : null;
  const demo = useIsDemo();
  const program = useProgramForClient(client.id);
  const exercises = useExercises();
  const byId = useMemo(() => Object.fromEntries(exercises.map((e) => [e.id, e])), [exercises]);

  const [focus, setFocus] = useState("metcon");
  const [metconType, setMetconType] = useState("engine");
  const [equipment, setEquipment] = useState<string[]>(["Bodyweight"]);
  const [timeMin, setTimeMin] = useState(20);
  const [targetDow, setTargetDow] = useState(dow);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ gen: GeneratedWorkout; workout: Workout } | null>(null);

  const toggleEquip = (e: string) =>
    setEquipment((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));

  const generate = async () => {
    setBusy(true);
    setError(null);
    setPreview(null);
    try {
      // Demo mode: build locally (the AI endpoint is auth-gated and there's no
      // session in the demo). Keeps bulk programming instant + reliable on stage.
      if (demo) {
        const gen = buildDemoWorkout({ focus, metconType: focus === "metcon" ? METCON_TYPES.find((t) => t.value === metconType)?.label : undefined, timeMin, exercises });
        setPreview({ gen, workout: toWorkout(gen, exercises, targetDow, weekStart) });
        return;
      }
      const sb = getSupabase();
      const token = sb ? (await sb.auth.getSession()).data.session?.access_token : undefined;
      const surroundingDays = surroundingLoad(program, weekStart, targetDow, byId);
      const res = await fetch("/api/coach/generate-workout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          focus,
          metconType: focus === "metcon" ? METCON_TYPES.find((t) => t.value === metconType)?.label : undefined,
          equipment,
          timeMin,
          goals: client.goals?.join(", "),
          exercises: exercises.map((e) => ({
            id: e.id,
            name: e.name,
            category: e.category,
            equipment: e.equipment,
          })),
          surroundingDays,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Couldn't generate a workout.");
        return;
      }
      const gen = json.workout as GeneratedWorkout;
      const workout = toWorkout(gen, exercises, targetDow, weekStart);
      setPreview({ gen, workout });
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

  const add = () => {
    if (!preview) return;
    const targets = bulk ?? [client];
    for (const t of targets) {
      // clone so each athlete's program holds its own workout (fresh ids)
      const w: Workout = { ...JSON.parse(JSON.stringify(preview.workout)), id: uid("w") };
      addWorkoutObject(t.id, w);
    }
    onAdded?.();
    onClose();
  };

  return (
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
          <h2 className="font-bold">{bulk ? `Generate for ${bulk.length} athletes` : "Generate a workout"}</h2>
          <button onClick={onClose} className="text-slate text-2xl leading-none px-2" aria-label="Close">
            ×
          </button>
        </div>

        <div
          className="overflow-y-auto px-4 py-4 min-h-0 flex-1 overscroll-contain space-y-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {!preview ? (
            <>
              <Field label="Focus">
                <div className="flex flex-wrap gap-1.5">
                  {FOCUS_OPTIONS.map((f) => (
                    <Chip key={f.value} active={focus === f.value} onClick={() => setFocus(f.value)}>
                      {f.label}
                    </Chip>
                  ))}
                </div>
              </Field>

              {focus === "metcon" && (
                <Field label="Type of work">
                  <div className="flex flex-wrap gap-1.5">
                    {METCON_TYPES.map((t) => (
                      <Chip key={t.value} active={metconType === t.value} onClick={() => setMetconType(t.value)}>
                        {t.label}
                      </Chip>
                    ))}
                  </div>
                </Field>
              )}

              <Field label="Equipment available">
                <div className="flex flex-wrap gap-1.5">
                  {EQUIPMENT_OPTIONS.map((e) => (
                    <Chip key={e} active={equipment.includes(e)} onClick={() => toggleEquip(e)}>
                      {e}
                    </Chip>
                  ))}
                </div>
              </Field>

              <Field label="Time available">
                <div className="flex items-center gap-2 flex-wrap">
                  {TIME_PRESETS.map((t) => (
                    <Chip key={t} active={timeMin === t} onClick={() => setTimeMin(t)}>
                      {t} min
                    </Chip>
                  ))}
                  <input
                    type="number"
                    value={timeMin}
                    min={5}
                    max={120}
                    onChange={(e) => setTimeMin(Math.max(5, Math.min(120, Number(e.target.value) || 0)))}
                    className="w-20 rounded-lg bg-surface border border-line px-2 py-1.5 text-sm outline-none focus:border-forest"
                    aria-label="Minutes"
                  />
                </div>
              </Field>

              <Field label="Day">
                <div className="flex flex-wrap gap-1.5">
                  {DOW_LONG.map((d, i) => (
                    <Chip key={d} active={targetDow === i} onClick={() => setTargetDow(i)}>
                      {d.slice(0, 3)}
                    </Chip>
                  ))}
                </div>
              </Field>

              {error && <p className="text-sm text-brick">{error}</p>}

              <Button className="w-full" onClick={generate} disabled={busy || equipment.length === 0}>
                {busy ? "Generating…" : "Generate workout"}
              </Button>
            </>
          ) : (
            <>
              <div>
                <p className="font-bold text-lg">{preview.workout.name}</p>
                <p className="text-xs text-slate">{DOW_LONG[targetDow]} · {timeMin} min</p>
              </div>
              <div className="space-y-2">
                {preview.workout.blocks.map((b) => (
                  <PreviewBlock key={b.id} block={b} byId={byId} />
                ))}
              </div>
              {error && <p className="text-sm text-brick">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPreview(null)}>
                  ← Back
                </Button>
                <Button className="flex-1" onClick={add}>
                  {bulk ? `Assign to ${bulk.length}` : "Add to program"}
                </Button>
              </div>
              <Button variant="outline" className="w-full" onClick={generate} disabled={busy}>
                {busy ? "Regenerating…" : "↻ Regenerate"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm font-semibold rounded-full px-3 py-1.5 ${
        active ? "bg-forest text-bone" : "bg-surface text-slate border border-line"
      }`}
    >
      {children}
    </button>
  );
}

function PreviewBlock({
  block,
  byId,
}: {
  block: Workout["blocks"][number];
  byId: Record<string, { name: string }>;
}) {
  if (block.type === "note") {
    return (
      <div className="rounded-xl border border-sky/40 bg-sky/5 p-2.5">
        {block.title && <p className="font-semibold text-sm mb-1">{block.title}</p>}
        {block.text && <p className="text-sm whitespace-pre-wrap text-ink/90">{block.text}</p>}
        {block.logResult && (
          <p className="text-[11px] text-accent font-medium mt-1">Scored — athletes log a result</p>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-line bg-field/40 p-2.5 space-y-1">
      {block.items.map((it) => (
        <p key={it.id} className="text-sm">
          <span className="font-medium">{byId[it.exerciseId]?.name ?? "Movement"}</span>
          <span className="text-slate"> — {it.sets} × {it.reps}{it.rest ? ` · ${it.rest} rest` : ""}</span>
        </p>
      ))}
    </div>
  );
}
