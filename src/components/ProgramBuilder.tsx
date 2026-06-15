"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  addExerciseBlock,
  addItemToBlock,
  addNoteBlock,
  addWorkout,
  copyWeekProgramming,
  deleteWorkout,
  duplicateWorkout,
  moveItemToBlock,
  removeBlock,
  removeItem,
  renameProgram,
  renameWorkout,
  reorderBlocks,
  setBlockRounds,
  setBlockConfig,
  setBlockResultConfig,
  setBlockText,
  setBlockType,
  setItemVideo,
  setWorkoutDow,
  updateItem,
  useClient,
  useExercises,
  useProgramForClient,
  workoutsForWeek,
} from "@/lib/store";
import type { Block, BlockMode, BlockType, Exercise, ProgramItem, ScoreType, Workout } from "@/lib/types";
import { pushRecent } from "@/lib/recents";
import { youtubeId, youtubeThumb } from "@/lib/youtube";
import { DOW_LONG, todayDow, weekLabel, weekStartIso } from "@/lib/week";
import { Button, Card, EmptyState, Pill } from "./ui";
import ExercisePickerModal from "./ExercisePickerModal";
import VideoPicker from "./VideoPicker";
import WeekStrip from "./WeekStrip";
import WorkoutGeneratorModal from "./WorkoutGeneratorModal";

const BLOCK_LABEL: Record<BlockType, string> = {
  single: "Single",
  superset: "Superset",
  circuit: "Circuit",
  note: "Note",
};

const SCORE_TYPE_LABEL: Record<ScoreType, string> = {
  time: "For time",
  rounds: "Rounds + reps",
  reps: "Reps",
  load: "Load",
  done: "Just done",
};
const SCORE_TYPES = Object.keys(SCORE_TYPE_LABEL) as ScoreType[];

const BLOCK_DESC: Record<"superset" | "circuit", string> = {
  superset: "Alternate these movements back-to-back, rest only after the pair.",
  circuit: "Move through every station in order, then repeat for the rounds set.",
};

const MODE_LABEL: Record<BlockMode, string> = {
  rounds: "Rounds",
  amrap: "AMRAP",
  emom: "EMOM",
};

function exMap(list: Exercise[]) {
  return Object.fromEntries(list.map((e) => [e.id, e]));
}

// On-brand two-tap delete: first tap arms ("Delete?"), second within 3s confirms.
// Replaces jarring native confirm() and protects the silent ✕ deletes.
function ConfirmX({ onConfirm, title = "Delete" }: { onConfirm: () => void; title?: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return armed ? (
    <button onClick={onConfirm} className="text-brick text-xs font-semibold shrink-0 px-1.5 py-1 -my-1 rounded-md bg-brick/10">
      {title}?
    </button>
  ) : (
    <button
      onClick={() => setArmed(true)}
      aria-label={title}
      className="text-slate hover:text-brick text-sm shrink-0 p-2 -m-1 leading-none"
    >
      ✕
    </button>
  );
}

type PickerState =
  | { kind: "newBlock"; workoutId: string }
  | { kind: "addToBlock"; workoutId: string; blockId: string }
  | null;

type VideoState = {
  workoutId: string;
  blockId: string;
  itemId: string;
  name: string;
  current?: string;
  fallback?: string;
} | null;

export default function ProgramBuilder({ clientId }: { clientId: string }) {
  const program = useProgramForClient(clientId);
  const client = useClient(clientId);
  const exercises = useExercises();
  const byId = exMap(exercises);

  const [day, setDay] = useState<number>(todayDow());
  const [weekOffset, setWeekOffset] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [picker, setPicker] = useState<PickerState>(null);
  const [video, setVideo] = useState<VideoState>(null);
  const [editingName, setEditingName] = useState(false);
  // a week the coach has "copied", ready to paste into another week
  const [copied, setCopied] = useState<{ ws: string; label: string } | null>(null);
  const [pasted, setPasted] = useState(false);
  // past weeks the coach has explicitly unlocked to edit (e.g. to fix history)
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  const weekStart = weekStartIso(weekOffset);
  const workouts = workoutsForWeek(program, weekStart);
  const marked = new Set(workouts.map((w) => w.dow));
  const dayWorkouts = workouts.filter((w) => w.dow === day);
  // past weeks are read-only history unless the coach unlocks the week to edit it
  const isPast = weekOffset < 0;
  const readOnly = isPast && !unlocked.has(weekStart);
  const setWeekUnlocked = (ws: string, on: boolean) =>
    setUnlocked((prev) => {
      const next = new Set(prev);
      if (on) next.add(ws);
      else next.delete(ws);
      return next;
    });

  useEffect(() => {
    if (!pasted) return;
    const t = setTimeout(() => setPasted(false), 2000);
    return () => clearTimeout(t);
  }, [pasted]);

  return (
    <div className="space-y-4">
      {/* program title */}
      {editingName ? (
        <input
          autoFocus
          defaultValue={program?.name ?? "New Program"}
          onBlur={(e) => {
            renameProgram(clientId, e.target.value.trim() || "Program");
            setEditingName(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="w-full rounded-xl bg-surface border border-line px-3 py-2 text-lg font-bold outline-none focus:border-forest"
        />
      ) : (
        <button onClick={() => setEditingName(true)} className="text-lg font-bold flex items-center gap-2">
          {program?.name ?? "New Program"}
          <span className="text-slate text-xs">✎</span>
        </button>
      )}

      <WeekStrip
        selected={day}
        onSelect={setDay}
        marked={marked}
        weekOffset={weekOffset}
        onWeekOffset={setWeekOffset}
        maxOffset={12}
      />

      {/* read-only notice for past weeks + copy-forward between weeks */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 -mt-1">
        {readOnly && (
          <span className="text-xs text-slate">
            {weekLabel(weekOffset)} is in the past — read-only.{" "}
            <button onClick={() => setWeekUnlocked(weekStart, true)} className="font-semibold text-forest">
              Unlock to edit
            </button>
          </span>
        )}
        {isPast && !readOnly && (
          <span className="flex items-center gap-2">
            <Pill tone="brick">Editing past · {weekLabel(weekOffset)}</Pill>
            <button onClick={() => setWeekUnlocked(weekStart, false)} className="text-xs font-semibold text-slate">
              Lock
            </button>
          </span>
        )}
        <span className="flex-1" />
        {copied && copied.ws !== weekStart && !readOnly ? (
          <button
            onClick={() => {
              copyWeekProgramming(clientId, copied.ws, weekStart);
              setCopied(null);
              setPasted(true);
            }}
            className="text-xs font-semibold text-sky-dark rounded-full border border-sky/40 px-2.5 py-1"
          >
            Paste {copied.label} here
          </button>
        ) : (
          workouts.length > 0 && (
            <button
              onClick={() => setCopied({ ws: weekStart, label: weekLabel(weekOffset) })}
              className={`text-xs font-semibold rounded-full border px-2.5 py-1 ${
                copied?.ws === weekStart ? "border-forest text-forest" : "border-line text-slate"
              }`}
            >
              {copied?.ws === weekStart ? "Copied ✓" : "Copy week"}
            </button>
          )
        )}
        {pasted && <span className="text-xs text-forest font-medium w-full">✓ Pasted into this week</span>}
      </div>

      <p className="text-sm font-semibold text-slate -mb-1">{DOW_LONG[day]}</p>

      {readOnly ? (
        dayWorkouts.length === 0 ? (
          <Card className="p-5 text-center">
            <p className="text-slate text-sm">Rest day — nothing was programmed.</p>
          </Card>
        ) : (
          dayWorkouts.map((w) => <ReadOnlyWorkoutCard key={w.id} workout={w} byId={byId} />)
        )
      ) : dayWorkouts.length === 0 ? (
        <Card className="p-5 text-center">
          <p className="text-slate text-sm mb-3">Rest day — nothing scheduled.</p>
          <div className="flex flex-col gap-2 items-stretch max-w-xs mx-auto">
            <Button onClick={() => addWorkout(clientId, DOW_LONG[day], day, weekStart)}>
              + Add {DOW_LONG[day]} workout
            </Button>
            <Button variant="outline" onClick={() => setGenerating(true)}>
              ✨ Generate workout
            </Button>
          </div>
        </Card>
      ) : (
        dayWorkouts.map((w) => (
          <WorkoutCard
            key={w.id}
            clientId={clientId}
            workout={w}
            byId={byId}
            onPickNew={() => setPicker({ kind: "newBlock", workoutId: w.id })}
            onPickAdd={(blockId) => setPicker({ kind: "addToBlock", workoutId: w.id, blockId })}
            onEditVideo={(blockId, itemId) => {
              const block = w.blocks.find((b) => b.id === blockId);
              const item = block?.items.find((it) => it.id === itemId);
              if (!item) return;
              setVideo({
                workoutId: w.id,
                blockId,
                itemId,
                name: byId[item.exerciseId]?.name ?? "Movement",
                current: item.youtubeUrl,
                fallback: byId[item.exerciseId]?.youtubeUrl,
              });
            }}
          />
        ))
      )}

      {!readOnly && dayWorkouts.length > 0 && (
        <Button variant="outline" className="w-full" onClick={() => setGenerating(true)}>
          ✨ Generate another workout
        </Button>
      )}

      {generating && client && (
        <WorkoutGeneratorModal
          client={client}
          dow={day}
          weekStart={weekStart}
          onClose={() => setGenerating(false)}
        />
      )}

      {picker && (
        <ExercisePickerModal
          title={picker.kind === "addToBlock" ? "Add to group" : "Add movement"}
          onClose={() => setPicker(null)}
          onPick={(ex) => {
            pushRecent(ex.id);
            if (picker.kind === "newBlock") addExerciseBlock(clientId, picker.workoutId, ex.id);
            else addItemToBlock(clientId, picker.workoutId, picker.blockId, ex.id);
          }}
        />
      )}

      {video && (
        <VideoPicker
          movementName={video.name}
          current={video.current}
          fallback={video.fallback}
          onClose={() => setVideo(null)}
          onSave={(url) => setItemVideo(clientId, video.workoutId, video.blockId, video.itemId, url)}
        />
      )}
    </div>
  );
}

// Read-only render of a past week's workout — what was programmed, no editing.
function ReadOnlyWorkoutCard({ workout, byId }: { workout: Workout; byId: Record<string, Exercise> }) {
  return (
    <Card className="p-4 space-y-3">
      <p className="font-semibold">{workout.name}</p>
      {workout.blocks.map((block) => {
        if (block.type === "note") {
          return (
            <div key={block.id} className="rounded-xl border border-sky/40 bg-sky/5 p-2.5">
              {block.title && <p className="font-semibold text-sm mb-1">{block.title}</p>}
              {block.text && <p className="text-sm whitespace-pre-wrap text-ink/90">{block.text}</p>}
            </div>
          );
        }
        const mode = block.type === "circuit" ? block.mode ?? "rounds" : undefined;
        return (
          <div key={block.id} className="rounded-xl border border-line bg-field/40 p-2.5 space-y-1.5">
            {block.type !== "single" && (
              <Pill tone={block.type === "circuit" ? "brick" : "sky"}>
                {block.type === "circuit"
                  ? mode === "amrap"
                    ? "AMRAP"
                    : mode === "emom"
                      ? `EMOM ×${block.rounds ?? 10}`
                      : `Circuit${block.rounds ? ` ×${block.rounds}` : ""}`
                  : "Superset"}
              </Pill>
            )}
            {block.items.map((it) => {
              const ex = byId[it.exerciseId];
              return (
                <div key={it.id} className="text-sm">
                  <span className="font-medium">{ex?.name ?? "Movement"}</span>
                  {it.variant && <span className="text-forest"> · {it.variant}</span>}
                  {!ex?.activity && (
                    <span className="text-slate">
                      {" "}
                      — {it.sets} × {it.reps}
                      {it.rest ? ` · ${it.rest} rest` : ""}
                    </span>
                  )}
                  {it.notes && <p className="text-[11px] text-slate mt-0.5">{it.notes}</p>}
                </div>
              );
            })}
          </div>
        );
      })}
    </Card>
  );
}

function WorkoutCard({
  clientId,
  workout,
  byId,
  onPickNew,
  onPickAdd,
  onEditVideo,
}: {
  clientId: string;
  workout: Workout;
  byId: Record<string, Exercise>;
  onPickNew: () => void;
  onPickAdd: (blockId: string) => void;
  onEditVideo: (blockId: string, itemId: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  const [dragLabel, setDragLabel] = useState<string | null>(null);
  const [copiedTo, setCopiedTo] = useState<number | null>(null);

  useEffect(() => {
    if (copiedTo == null) return;
    const t = setTimeout(() => setCopiedTo(null), 2000);
    return () => clearTimeout(t);
  }, [copiedTo]);

  const onDragStart = (e: DragStartEvent) => {
    const d = e.active.data.current;
    if (d?.type === "item") setDragLabel(d.name as string);
    else setDragLabel("Move block");
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDragLabel(null);
    const { active, over } = e;
    if (!over) return;
    const aType = active.data.current?.type;

    if (aType === "item") {
      if (active.id === over.id) return;
      const fromBlockId = active.data.current?.blockId as string;
      const overType = over.data.current?.type;
      let toBlockId: string | undefined;
      let toIndex: number | undefined;
      if (overType === "item") {
        toBlockId = over.data.current?.blockId as string;
        const tb = workout.blocks.find((b) => b.id === toBlockId);
        toIndex = tb ? tb.items.findIndex((it) => it.id === over.id) : undefined;
      } else {
        // dropped onto a block container
        toBlockId = workout.blocks.find((b) => b.id === over.id)?.id;
      }
      if (!toBlockId) return;
      // can't drop a movement into a text-only note block
      if (workout.blocks.find((b) => b.id === toBlockId)?.type === "note") return;
      moveItemToBlock(clientId, workout.id, active.id as string, toBlockId, toIndex);
      return;
    }

    // block reorder
    if (active.id === over.id) return;
    const ids = workout.blocks.map((b) => b.id);
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    if (from < 0 || to < 0) return;
    const next = [...ids];
    next.splice(to, 0, next.splice(from, 1)[0]);
    reorderBlocks(clientId, workout.id, next);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <input
          defaultValue={workout.name}
          onBlur={(e) => renameWorkout(clientId, workout.id, e.target.value.trim() || "Workout")}
          aria-label="Workout name"
          className="font-semibold bg-transparent outline-none flex-1 min-w-0 border-b border-transparent hover:border-line focus:border-forest focus:text-forest transition-colors"
        />
        <select
          value={workout.dow}
          onChange={(e) => setWorkoutDow(clientId, workout.id, +e.target.value)}
          className="text-xs bg-surface border border-line rounded-lg px-2 py-1 outline-none text-slate"
          title="Move to another day"
        >
          {DOW_LONG.map((d, i) => (
            <option key={i} value={i}>{d}</option>
          ))}
        </select>
        <ConfirmX title="Delete workout" onConfirm={() => deleteWorkout(clientId, workout.id)} />
      </div>

      <div className="flex items-center gap-2 mb-3 -mt-1">
        <span className="text-[11px] text-slate">Copy this day to:</span>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value === "") return;
            const d = +e.target.value;
            duplicateWorkout(clientId, workout.id, d);
            setCopiedTo(d);
          }}
          className="text-xs bg-surface border border-line rounded-lg px-2 py-1 outline-none text-forest font-medium"
        >
          <option value="">choose a day…</option>
          {DOW_LONG.map((d, i) =>
            i === workout.dow ? null : (
              <option key={i} value={i}>
                {d}
              </option>
            ),
          )}
        </select>
        {copiedTo != null && (
          <span className="text-[11px] text-forest font-medium">✓ Copied to {DOW_LONG[copiedTo]}</span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={workout.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {workout.blocks.map((block) => (
              <SortableBlock
                key={block.id}
                clientId={clientId}
                workoutId={workout.id}
                block={block}
                allBlocks={workout.blocks}
                byId={byId}
                onAddToBlock={() => onPickAdd(block.id)}
                onEditVideo={(itemId) => onEditVideo(block.id, itemId)}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {dragLabel ? (
            <div className="rounded-lg bg-forest text-bone text-sm font-semibold px-3 py-2 shadow-lg">
              {dragLabel}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={onPickNew}>
          + Movement
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => addNoteBlock(clientId, workout.id)}>
          + Note
        </Button>
      </div>
    </Card>
  );
}

function SortableBlock({
  clientId,
  workoutId,
  block,
  allBlocks,
  byId,
  onAddToBlock,
  onEditVideo,
}: {
  clientId: string;
  workoutId: string;
  block: Block;
  allBlocks: Block[];
  byId: Record<string, Exercise>;
  onAddToBlock: () => void;
  onEditVideo: (itemId: string) => void;
}) {
  const [grouping, setGrouping] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { type: "block" },
  });
  // movements in other blocks this single can be paired with (tap = make a superset)
  const groupTargets =
    block.type === "single"
      ? allBlocks
          .filter((b) => b.id !== block.id && b.type !== "note")
          .flatMap((b) => b.items.map((it) => ({ id: it.id, name: byId[it.exerciseId]?.name ?? "Movement" })))
      : [];
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  // free-text note section (warm-up, metcon, cues) — no movements
  if (block.type === "note") {
    return (
      <div ref={setNodeRef} style={style} className="rounded-xl border border-sky/40 bg-sky/5 p-2.5">
        <div className="flex items-center gap-2 mb-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-slate touch-none px-1 -ml-1"
            aria-label="Drag to reorder"
          >
            ⠿
          </button>
          <input
            defaultValue={block.title ?? ""}
            onChange={(e) => setBlockText(clientId, workoutId, block.id, { title: e.target.value })}
            placeholder="Section title (e.g. Warm-up, Metcon)"
            className="flex-1 min-w-0 bg-transparent font-semibold text-sm outline-none focus:text-forest placeholder:text-slate"
          />
          <span className="text-[10px] uppercase tracking-wide text-sky font-semibold">Note</span>
          <ConfirmX title="Delete note" onConfirm={() => removeBlock(clientId, workoutId, block.id)} />
        </div>
        <textarea
          defaultValue={block.text ?? ""}
          onChange={(e) => setBlockText(clientId, workoutId, block.id, { text: e.target.value })}
          rows={3}
          placeholder="Type instructions — e.g. 3 rounds: 10 air squats, 10 push-ups, 200m run…"
          className="w-full rounded-lg bg-surface border border-line px-2.5 py-2 text-sm outline-none focus:border-forest resize-y"
        />
        {/* Reportable workout toggle: turn this note into a metcon the athlete can score */}
        <label className="flex items-center gap-2 mt-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={block.logResult ?? false}
            onChange={(e) =>
              setBlockResultConfig(clientId, workoutId, block.id, {
                logResult: e.target.checked,
                // default to a sensible score type the first time it's enabled
                scoreType: e.target.checked ? block.scoreType ?? "time" : block.scoreType,
              })
            }
            className="w-4 h-4 accent-forest"
          />
          <span className="font-medium">Athletes log a result</span>
        </label>
        {block.logResult && (
          <>
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[11px] text-slate mr-0.5">Score</span>
              {SCORE_TYPES.map((s) => (
                <button
                  key={s}
                  onClick={() => setBlockResultConfig(clientId, workoutId, block.id, { scoreType: s })}
                  className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                    (block.scoreType ?? "time") === s
                      ? "bg-forest text-bone"
                      : "bg-surface text-slate border border-line"
                  }`}
                >
                  {SCORE_TYPE_LABEL[s]}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 mt-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={block.levels ?? false}
                onChange={(e) => setBlockResultConfig(clientId, workoutId, block.id, { levels: e.target.checked })}
                className="w-4 h-4 accent-forest"
              />
              <span className="font-medium">Offer scaling levels (Rx+ / Rx / Scale)</span>
            </label>
          </>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-slate">Saved automatically</span>
          <Button
            size="sm"
            onClick={() => (document.activeElement as HTMLElement | null)?.blur()}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  const grouped = block.type !== "single";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl ${grouped ? "border border-line bg-field/40 p-2.5" : "bg-surface border border-line p-2.5"}`}
    >
      <div className="flex items-center gap-2 mb-2">
        {/* drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate touch-none px-1 -ml-1"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["single", "superset", "circuit"] as BlockType[]).map((t) => (
            <button
              key={t}
              onClick={() => setBlockType(clientId, workoutId, block.id, t)}
              className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                block.type === t ? "bg-forest text-bone" : "bg-surface text-slate border border-line"
              }`}
            >
              {BLOCK_LABEL[t]}
            </button>
          ))}
          {block.type === "circuit" && (() => {
            const mode = block.mode ?? "rounds";
            return (
              <div className="flex items-center gap-1.5 ml-1 flex-wrap text-[11px]">
                {(["rounds", "amrap", "emom"] as BlockMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setBlockConfig(clientId, workoutId, block.id, { mode: m })}
                    className={`font-semibold rounded-full px-2 py-0.5 ${
                      mode === m ? "bg-sky text-bone" : "bg-surface text-slate border border-line"
                    }`}
                  >
                    {MODE_LABEL[m]}
                  </button>
                ))}
                {mode === "rounds" && (
                  <span className="flex items-center gap-1 text-slate">
                    ×
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={block.rounds ?? 3}
                      onChange={(e) => setBlockRounds(clientId, workoutId, block.id, Math.max(1, +e.target.value))}
                      className="w-10 rounded bg-surface border border-line px-1 py-0.5 text-center outline-none"
                    />
                    rounds
                  </span>
                )}
                {mode === "amrap" && (
                  <span className="flex items-center gap-1 text-slate">
                    cap
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={Math.round((block.capSec ?? 1200) / 60)}
                      onChange={(e) => setBlockConfig(clientId, workoutId, block.id, { capSec: Math.max(1, +e.target.value) * 60 })}
                      className="w-10 rounded bg-surface border border-line px-1 py-0.5 text-center outline-none"
                    />
                    min
                  </span>
                )}
                {mode === "emom" && (
                  <span className="flex items-center gap-1 text-slate">
                    every
                    <select
                      value={block.intervalSec ?? 60}
                      onChange={(e) => setBlockConfig(clientId, workoutId, block.id, { intervalSec: +e.target.value })}
                      className="rounded bg-surface border border-line px-1 py-0.5 outline-none"
                    >
                      <option value={30}>30s</option>
                      <option value={60}>60s</option>
                      <option value={90}>90s</option>
                      <option value={120}>2 min</option>
                    </select>
                    ×
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={block.rounds ?? 10}
                      onChange={(e) => setBlockConfig(clientId, workoutId, block.id, { rounds: Math.max(1, +e.target.value) })}
                      className="w-10 rounded bg-surface border border-line px-1 py-0.5 text-center outline-none"
                    />
                    rounds
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {grouped && (
        <p className="text-[11px] text-slate mb-2 pl-1">{BLOCK_DESC[block.type as "superset" | "circuit"]}</p>
      )}

      <SortableContext items={block.items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {block.items.map((item) => (
            <ItemRow
              key={item.id}
              clientId={clientId}
              workoutId={workoutId}
              blockId={block.id}
              item={item}
              ex={byId[item.exerciseId]}
              onEditVideo={() => onEditVideo(item.id)}
            />
          ))}
        </div>
      </SortableContext>

      {grouped && (
        <button onClick={onAddToBlock} className="text-xs text-forest font-semibold mt-2 pl-1">
          + add movement to {BLOCK_LABEL[block.type].toLowerCase()}
        </button>
      )}

      {block.type === "single" && groupTargets.length > 0 && (
        <div className="mt-2">
          {grouping ? (
            <div className="rounded-lg border border-line bg-field/60 p-2">
              <p className="text-[11px] text-slate mb-1.5 px-0.5">Pair with… (creates a superset)</p>
              <div className="flex flex-wrap gap-1.5">
                {groupTargets.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      moveItemToBlock(clientId, workoutId, m.id, block.id);
                      setGrouping(false);
                    }}
                    className="text-xs bg-surface border border-line rounded-full px-2.5 py-1 hover:border-forest"
                  >
                    {m.name}
                  </button>
                ))}
                <button onClick={() => setGrouping(false)} className="text-xs text-slate px-2 py-1">
                  cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setGrouping(true)} className="text-xs text-sky-dark font-semibold pl-1">
              ⊕ group into superset
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ItemRow({
  clientId,
  workoutId,
  blockId,
  item,
  ex,
  onEditVideo,
}: {
  clientId: string;
  workoutId: string;
  blockId: string;
  item: ProgramItem;
  ex?: Exercise;
  onEditVideo: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: "item", blockId, name: ex?.name ?? "Movement" },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const effectiveUrl = item.youtubeUrl ?? ex?.youtubeUrl;
  const thumb = youtubeThumb(effectiveUrl);
  const [showNote, setShowNote] = useState<boolean>(!!item.notes);

  // persist the displayed default variant so the athlete view matches what the
  // coach sees (the select shows variants[0] but never saved it otherwise)
  useEffect(() => {
    if (ex?.variants && ex.variants.length > 0 && !item.variant) {
      updateItem(clientId, workoutId, blockId, item.id, { variant: ex.variants[0] });
    }
  }, [ex, item.variant, clientId, workoutId, blockId, item.id]);

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg bg-surface border border-line p-2.5">
      <div className="flex items-start gap-2">
        {/* drag-to-move handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate touch-none px-0.5 -ml-0.5 pt-1"
          aria-label="Drag movement into a group or reorder"
        >
          ⠿
        </button>

        {/* video chooser */}
        <button
          onClick={onEditVideo}
          className="relative w-16 h-12 rounded-md overflow-hidden bg-field shrink-0 grid place-items-center border border-line"
          title="Choose demo video"
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-base">🎬</span>
          )}
          <span className="absolute bottom-0 inset-x-0 bg-ink/70 text-[8px] text-center text-bone py-0.5">
            {item.youtubeUrl ? "custom" : thumb ? "edit" : "add"}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{ex?.name ?? "Unknown"}</p>
          <p className="text-[11px] text-slate">{ex?.primaryMuscle}</p>
        </div>
        <ConfirmX title="Remove" onConfirm={() => removeItem(clientId, workoutId, blockId, item.id)} />
      </div>

      {ex?.variants && ex.variants.length > 0 && (
        <select
          value={item.variant ?? ex.variants[0]}
          onChange={(e) => updateItem(clientId, workoutId, blockId, item.id, { variant: e.target.value })}
          className="w-full mt-2 rounded-lg bg-field border border-line px-2 py-1.5 text-xs outline-none focus:border-forest text-forest font-medium"
          title="Implement / side"
        >
          {ex.variants.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      )}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <Field label="Sets" value={item.sets} onChange={(v) => updateItem(clientId, workoutId, blockId, item.id, { sets: Math.max(1, +v || 1) })} type="number" />
        <Field label="Reps" value={item.reps} onChange={(v) => updateItem(clientId, workoutId, blockId, item.id, { reps: v })} />
        <Field label="Rest" value={item.rest} onChange={(v) => updateItem(clientId, workoutId, blockId, item.id, { rest: v })} />
      </div>
      {showNote ? (
        <textarea
          defaultValue={item.notes ?? ""}
          autoFocus={!item.notes}
          onBlur={(e) => updateItem(clientId, workoutId, blockId, item.id, { notes: e.target.value })}
          placeholder="Cue / note (optional)"
          rows={2}
          className="w-full mt-2 rounded-lg bg-field border border-line px-2.5 py-1.5 text-xs outline-none focus:border-forest resize-y"
        />
      ) : (
        <button
          onClick={() => setShowNote(true)}
          className="text-xs text-slate hover:text-forest font-medium mt-2 pl-0.5"
        >
          ＋ cue / note
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "numeric" | "decimal";
}) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 800);
    return () => clearTimeout(t);
  }, [saved]);
  return (
    <label className="block min-w-0">
      <span className="text-[10px] uppercase tracking-wide text-slate">{label}</span>
      <input
        type={type}
        inputMode={inputMode ?? (type === "number" ? "numeric" : undefined)}
        defaultValue={value}
        onBlur={(e) => {
          onChange(e.target.value);
          setSaved(true);
        }}
        className={`w-full min-w-0 rounded-lg bg-field border px-2 py-1.5 text-sm outline-none focus:border-forest transition-colors ${
          saved ? "border-green-soft" : "border-line"
        }`}
      />
    </label>
  );
}
