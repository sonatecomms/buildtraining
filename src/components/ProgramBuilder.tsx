"use client";

import { useState } from "react";
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
  deleteWorkout,
  duplicateWorkout,
  moveItemToBlock,
  removeBlock,
  removeItem,
  renameProgram,
  renameWorkout,
  reorderBlocks,
  setBlockRounds,
  setBlockText,
  setBlockType,
  setItemVideo,
  setWorkoutDow,
  updateItem,
  useExercises,
  useProgramForClient,
} from "@/lib/store";
import type { Block, BlockType, Exercise, ProgramItem, Workout } from "@/lib/types";
import { youtubeId, youtubeThumb } from "@/lib/youtube";
import { DOW_LONG, todayDow } from "@/lib/week";
import { Button, Card, EmptyState, Pill } from "./ui";
import ExercisePickerModal from "./ExercisePickerModal";
import VideoPicker from "./VideoPicker";
import WeekStrip from "./WeekStrip";

const BLOCK_LABEL: Record<BlockType, string> = {
  single: "Single",
  superset: "Superset",
  circuit: "Circuit",
  note: "Note",
};

const BLOCK_DESC: Record<"superset" | "circuit", string> = {
  superset: "Alternate these movements back-to-back, rest only after the pair.",
  circuit: "Move through every station in order, then repeat for the rounds set.",
};

function exMap(list: Exercise[]) {
  return Object.fromEntries(list.map((e) => [e.id, e]));
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
  const exercises = useExercises();
  const byId = exMap(exercises);

  const [day, setDay] = useState<number>(todayDow());
  const [picker, setPicker] = useState<PickerState>(null);
  const [video, setVideo] = useState<VideoState>(null);
  const [editingName, setEditingName] = useState(false);

  const workouts = program?.workouts ?? [];
  const marked = new Set(workouts.map((w) => w.dow));
  const dayWorkouts = workouts.filter((w) => w.dow === day);

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

      <WeekStrip selected={day} onSelect={setDay} marked={marked} />

      <p className="text-sm font-semibold text-slate -mb-1">{DOW_LONG[day]}</p>

      {dayWorkouts.length === 0 ? (
        <Card className="p-5 text-center">
          <p className="text-slate text-sm mb-3">Rest day — nothing scheduled.</p>
          <Button onClick={() => addWorkout(clientId, DOW_LONG[day], day)}>
            + Add {DOW_LONG[day]} workout
          </Button>
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

      {picker && (
        <ExercisePickerModal
          title={picker.kind === "addToBlock" ? "Add to group" : "Add movement"}
          onClose={() => setPicker(null)}
          onPick={(ex) => {
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
        <button
          onClick={() => {
            if (confirm(`Delete "${workout.name}"?`)) deleteWorkout(clientId, workout.id);
          }}
          className="text-slate hover:text-brick text-sm shrink-0"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3 -mt-1">
        <span className="text-[11px] text-slate">Copy this day to:</span>
        <select
          value=""
          onChange={(e) => e.target.value !== "" && duplicateWorkout(clientId, workout.id, +e.target.value)}
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
  byId,
  onAddToBlock,
  onEditVideo,
}: {
  clientId: string;
  workoutId: string;
  block: Block;
  byId: Record<string, Exercise>;
  onAddToBlock: () => void;
  onEditVideo: (itemId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { type: "block" },
  });
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
          <button
            onClick={() => removeBlock(clientId, workoutId, block.id)}
            className="text-slate hover:text-brick text-sm shrink-0"
          >
            ✕
          </button>
        </div>
        <textarea
          defaultValue={block.text ?? ""}
          onChange={(e) => setBlockText(clientId, workoutId, block.id, { text: e.target.value })}
          rows={3}
          placeholder="Type instructions — e.g. 3 rounds: 10 air squats, 10 push-ups, 200m run…"
          className="w-full rounded-lg bg-surface border border-line px-2.5 py-2 text-sm outline-none focus:border-forest resize-y"
        />
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
          {block.type === "circuit" && (
            <span className="flex items-center gap-1 text-[11px] text-slate ml-1">
              ×
              <input
                type="number"
                min={1}
                value={block.rounds ?? 3}
                onChange={(e) => setBlockRounds(clientId, workoutId, block.id, Math.max(1, +e.target.value))}
                className="w-10 rounded bg-surface border border-line px-1 py-0.5 text-center outline-none"
              />
              rounds
            </span>
          )}
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
        <button
          onClick={() => removeItem(clientId, workoutId, blockId, item.id)}
          className="text-slate hover:text-brick text-sm shrink-0"
        >
          ✕
        </button>
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
      <textarea
        defaultValue={item.notes ?? ""}
        onBlur={(e) => updateItem(clientId, workoutId, blockId, item.id, { notes: e.target.value })}
        placeholder="Cue / note (optional)"
        rows={2}
        className="w-full mt-2 rounded-lg bg-field border border-line px-2.5 py-1.5 text-xs outline-none focus:border-forest resize-y"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[10px] uppercase tracking-wide text-slate">{label}</span>
      <input
        type={type}
        defaultValue={value}
        onBlur={(e) => onChange(e.target.value)}
        className="w-full min-w-0 rounded-lg bg-field border border-line px-2 py-1.5 text-sm outline-none focus:border-forest"
      />
    </label>
  );
}
