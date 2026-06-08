"use client";

import { useState } from "react";
import { addExercise, useExercises } from "@/lib/store";
import ExerciseList from "@/components/ExerciseList";
import { Button, Card, PageHeader } from "@/components/ui";
import type { Equipment, ExerciseCategory } from "@/lib/types";

const CATS: ExerciseCategory[] = ["Lower Body", "Upper Body", "Push", "Pull", "Core", "Cardio", "Mobility", "Full Body", "Olympic", "Gymnastics", "Conditioning", "Activity"];
const EQUIP: Equipment[] = ["Barbell", "Dumbbell", "Kettlebell", "Machine", "Cable", "Bodyweight", "Bands", "Cardio Machine", "Medicine Ball", "Rings", "Box", "Sandbag", "Sled", "Jump Rope", "Other"];

export default function LibraryPage() {
  const exercises = useExercises();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Push" as ExerciseCategory,
    equipment: "Barbell" as Equipment,
    primaryMuscle: "",
    youtubeUrl: "",
  });

  const save = () => {
    if (!form.name.trim()) return;
    addExercise({
      name: form.name.trim(),
      category: form.category,
      equipment: form.equipment,
      primaryMuscle: form.primaryMuscle.trim() || "—",
      youtubeUrl: form.youtubeUrl.trim() || undefined,
    });
    setForm({ name: "", category: "Push", equipment: "Barbell", primaryMuscle: "", youtubeUrl: "" });
    setOpen(false);
  };

  const inputCls = "w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest";

  return (
    <div>
      <PageHeader
        title="Exercise Library"
        subtitle={`${exercises.length} movements`}
        action={
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            + New
          </Button>
        }
      />

      {open && (
        <Card className="p-4 mb-4 space-y-3">
          <div>
            <label className="text-xs text-slate font-medium">Name</label>
            <input className={inputCls} value={form.name} autoFocus onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Zercher Squat" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate font-medium">Category</label>
              <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExerciseCategory })}>
                {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate font-medium">Equipment</label>
              <select className={inputCls} value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value as Equipment })}>
                {EQUIP.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate font-medium">Primary muscle</label>
            <input className={inputCls} value={form.primaryMuscle} onChange={(e) => setForm({ ...form, primaryMuscle: e.target.value })} placeholder="e.g. Quads" />
          </div>
          <div>
            <label className="text-xs text-slate font-medium">YouTube demo URL</label>
            <input className={inputCls} value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} placeholder="https://youtube.com/watch?v=…" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save movement</Button>
          </div>
        </Card>
      )}

      <ExerciseList exercises={exercises} />
    </div>
  );
}
