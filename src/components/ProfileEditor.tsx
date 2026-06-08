"use client";

import { useRef, useState } from "react";
import { deleteClient, updateClient } from "@/lib/store";
import { flushPush } from "@/lib/sync";
import type { Client, GoalType } from "@/lib/types";
import { ALL_GOALS, GOALS } from "@/lib/goals";
import { Avatar, Button, Card } from "./ui";

// Downscale an uploaded image to a square data URL so localStorage stays small.
// With Supabase this would upload to Storage and save the public URL instead.
function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const SIZE = 256;
        const canvas = document.createElement("canvas");
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d")!;
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, SIZE, SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfileEditor({ client }: { client: Client }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyInvite = async () => {
    if (!client.athleteEmail) return;
    const origin = window.location.origin;
    const msg =
      `You're invited to train on BUILD 💪\n\n` +
      `1. Open ${origin}/?role=athlete\n` +
      `2. Sign in with this email: ${client.athleteEmail}\n` +
      `3. Use the password I'll share with you — your program is ready.\n\n` +
      `Tip: add BUILD to your home screen to use it like an app.`;
    try {
      await navigator.clipboard.writeText(msg);
    } catch {
      // older browsers: fall back to a prompt so the coach can copy manually
      window.prompt("Copy the invite:", msg);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleGoal = (g: GoalType) => {
    const has = client.goals.includes(g);
    updateClient(client.id, {
      goals: has ? client.goals.filter((x) => x !== g) : [...client.goals, g],
    });
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await fileToAvatar(file);
      updateClient(client.id, { avatarUrl: url });
    } finally {
      setBusy(false);
    }
  };

  const stat = (key: keyof Client["stats"], v: string) =>
    updateClient(client.id, { stats: { ...client.stats, [key]: v === "" ? undefined : +v } });

  const inputCls = "w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest";

  return (
    <div className="space-y-4">
      {/* avatar + name */}
      <Card className="p-4 flex items-center gap-4">
        <button onClick={() => fileRef.current?.click()} className="relative">
          <Avatar src={client.avatarUrl} name={client.name} size={72} />
          <span className="absolute -bottom-1 -right-1 bg-forest text-bone rounded-full w-6 h-6 flex items-center justify-center text-xs border-2 border-surface">
            {busy ? "…" : "📷"}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <div className="flex-1">
          <input
            defaultValue={client.name}
            onBlur={(e) => updateClient(client.id, { name: e.target.value.trim() || client.name })}
            className="text-lg font-bold bg-transparent outline-none w-full focus:text-forest"
          />
          <p className="text-xs text-slate">Tap photo to upload</p>
        </div>
      </Card>

      {/* stats */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Height (cm)">
            <input type="number" className={inputCls} defaultValue={client.stats.heightCm ?? ""} onBlur={(e) => stat("heightCm", e.target.value)} />
          </Labeled>
          <Labeled label="Weight (kg)">
            <input type="number" className={inputCls} defaultValue={client.stats.weightKg ?? ""} onBlur={(e) => stat("weightKg", e.target.value)} />
          </Labeled>
          <Labeled label="Age">
            <input type="number" className={inputCls} defaultValue={client.stats.age ?? ""} onBlur={(e) => stat("age", e.target.value)} />
          </Labeled>
          <Labeled label="Body fat (%)">
            <input type="number" className={inputCls} defaultValue={client.stats.bodyfatPct ?? ""} onBlur={(e) => stat("bodyfatPct", e.target.value)} />
          </Labeled>
        </div>
      </Card>

      {/* frequency */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Intended frequency</h3>
          <span className="text-forest font-bold">{client.intendedFrequency}× / week</span>
        </div>
        <input
          type="range"
          min={1}
          max={7}
          value={client.intendedFrequency}
          onChange={(e) => updateClient(client.id, { intendedFrequency: +e.target.value })}
          className="w-full accent-[#19350C]"
        />
        <div className="flex justify-between text-[10px] text-slate mt-1">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => <span key={n}>{n}</span>)}
        </div>
      </Card>

      {/* goals */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Goals</h3>
        <div className="grid grid-cols-2 gap-2">
          {ALL_GOALS.map((g) => {
            const active = client.goals.includes(g);
            return (
              <button
                key={g}
                onClick={() => toggleGoal(g)}
                className={`text-left rounded-xl border p-3 transition-colors ${
                  active ? "border-forest bg-green/10" : "border-line bg-field"
                }`}
              >
                <div className="text-xl">{GOALS[g].icon}</div>
                <div className={`font-semibold text-sm mt-1 ${active ? "text-forest" : ""}`}>{GOALS[g].label}</div>
                <div className="text-[11px] text-slate">{GOALS[g].blurb}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* notes */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Coach notes</h3>
        <textarea
          defaultValue={client.notes ?? ""}
          onBlur={(e) => updateClient(client.id, { notes: e.target.value })}
          rows={3}
          placeholder="Injuries, preferences, context…"
          className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest resize-none"
        />
      </Card>

      {/* athlete login */}
      <Card className="p-4">
        <h3 className="font-semibold mb-1">Athlete login</h3>
        <p className="text-xs text-slate mb-2">
          Add the athlete&apos;s email so they can sign in and see only their own training.
        </p>
        <input
          type="email"
          defaultValue={client.athleteEmail ?? ""}
          onBlur={(e) => updateClient(client.id, { athleteEmail: e.target.value.trim() || undefined })}
          placeholder="athlete@example.com"
          className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
        />
        <Button
          className="w-full mt-2"
          variant={copied ? "outline" : "primary"}
          disabled={!client.athleteEmail}
          onClick={copyInvite}
        >
          {copied ? "✓ Invite copied — paste it to them" : "📋 Copy athlete invite"}
        </Button>
        {!client.athleteEmail && (
          <p className="text-[11px] text-slate mt-2">Add an email above to enable the invite.</p>
        )}
      </Card>

      <button
        onClick={async () => {
          if (!confirm(`Delete ${client.name} and all their data?`)) return;
          deleteClient(client.id);
          await flushPush(); // sync the deletion to the cloud before leaving
          window.location.href = "/";
        }}
        className="w-full text-center text-brick text-sm py-2"
      >
        Delete athlete
      </button>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-slate font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
