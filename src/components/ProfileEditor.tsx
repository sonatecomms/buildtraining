"use client";

import { useEffect, useRef, useState } from "react";
import { deleteClient, getClient, setClientArchived, updateClient } from "@/lib/store";
import { flushPush, saveClientNow, setRealtimePaused } from "@/lib/sync";
import type { Client, GoalType } from "@/lib/types";
import { ALL_GOALS, GOALS } from "@/lib/goals";
import { formatPhone, isPhoneLogin, phoneDigits, toLoginId } from "@/lib/login";
import { APP_VERSION } from "@/lib/version";
import { Avatar, Button, Card } from "./ui";
import AvatarCropper from "./AvatarCropper";
import BiometricLockCard from "./BiometricLockCard";

export default function ProfileEditor({
  client,
  coachView = true,
}: {
  client: Client;
  coachView?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [loginMode, setLoginMode] = useState<"email" | "phone">(
    isPhoneLogin(client.athleteEmail) ? "phone" : "email",
  );

  // While editing the profile, pause live re-pulls so a background update can't
  // revert an in-progress change; flush + resume on leave.
  useEffect(() => {
    setRealtimePaused(true);
    return () => {
      setRealtimePaused(false);
      void flushPush();
    };
  }, []);

  // Explicit save: commit the focused field, then write this profile directly
  // and report the real result (success or the actual error).
  const saveProfile = async () => {
    (document.activeElement as HTMLElement | null)?.blur();
    setSaving(true);
    setSaveMsg("");
    await new Promise((r) => setTimeout(r, 60)); // let onBlur land in the store
    const latest = getClient(client.id);
    const res = latest ? await saveClientNow(latest) : { ok: false, error: "not found" };
    setSaving(false);
    setSaveMsg(res.ok ? "Saved ✓" : `Couldn't save — ${res.error}`);
    setTimeout(() => setSaveMsg(""), 4000);
  };

  const copyInvite = async () => {
    if (!client.athleteEmail) return;
    const origin = window.location.origin;
    const who = isPhoneLogin(client.athleteEmail)
      ? formatPhone(phoneDigits(client.athleteEmail))
      : client.athleteEmail;
    const msg =
      `You're invited to train on BUILD 💪\n\n` +
      `1. Open ${origin}/?role=athlete\n` +
      `2. Tap "Create one" and sign up with: ${who}\n` +
      `3. Pick your own password — your program is ready.\n\n` +
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

  // read the picked file and open the cropper
  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const stat = (key: keyof Client["stats"], v: string) =>
    updateClient(client.id, { stats: { ...client.stats, [key]: v === "" ? undefined : +v } });

  const inputCls = "w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest";

  return (
    <div className="space-y-4">
      {/* explicit save */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-bone/95 backdrop-blur flex items-center justify-end gap-3">
        <span className="text-[10px] text-slate mr-auto">build {APP_VERSION}</span>
        {saveMsg && (
          <span className={`text-xs ${saveMsg.startsWith("Saved") ? "text-forest" : "text-brick"}`}>{saveMsg}</span>
        )}
        <Button size="sm" onClick={saveProfile} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>

      {/* avatar + name */}
      <Card className="p-4 flex items-center gap-4">
        <button onClick={() => fileRef.current?.click()} className="relative">
          <Avatar src={client.avatarUrl} name={client.name} size={72} />
          <span className="absolute -bottom-1 -right-1 bg-forest text-bone rounded-full w-6 h-6 flex items-center justify-center text-xs border-2 border-surface">
            📷
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = ""; // allow re-picking the same file
          }}
        />
        {cropSrc && (
          <AvatarCropper
            src={cropSrc}
            onCancel={() => setCropSrc(null)}
            onSave={(url) => {
              updateClient(client.id, { avatarUrl: url });
              setCropSrc(null);
              void flushPush(); // photo is a deliberate action — save it now
            }}
          />
        )}
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
          <div className="col-span-2">
            <Labeled label="Height">
              <div className="flex items-center gap-2">
                <input type="number" className={inputCls} placeholder="5" defaultValue={client.stats.heightFt ?? ""} onBlur={(e) => stat("heightFt", e.target.value)} />
                <span className="text-slate text-sm">ft</span>
                <input type="number" className={inputCls} placeholder="10" defaultValue={client.stats.heightIn ?? ""} onBlur={(e) => stat("heightIn", e.target.value)} />
                <span className="text-slate text-sm">in</span>
              </div>
            </Labeled>
          </div>
          <Labeled label="Weight (lbs)">
            <input type="number" className={inputCls} defaultValue={client.stats.weightLb ?? ""} onBlur={(e) => stat("weightLb", e.target.value)} />
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
          className="w-full accent-forest"
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

      {/* athlete's own device security (their settings, not the coach's) */}
      {!coachView && <BiometricLockCard />}

      {coachView && (
      <>
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
          Set an email or phone so the athlete can sign in and see only their own training.
        </p>
        <div className="flex gap-1 mb-2">
          {(["email", "phone"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setLoginMode(m)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                loginMode === m ? "bg-forest text-bone" : "bg-field text-slate border border-line"
              }`}
            >
              {m === "email" ? "Email" : "Phone"}
            </button>
          ))}
        </div>
        {loginMode === "email" ? (
          <input
            key="email"
            type="email"
            defaultValue={isPhoneLogin(client.athleteEmail) ? "" : (client.athleteEmail ?? "")}
            onBlur={(e) => updateClient(client.id, { athleteEmail: e.target.value.trim().toLowerCase() || undefined })}
            placeholder="athlete@example.com"
            className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
          />
        ) : (
          <input
            key="phone"
            type="tel"
            defaultValue={formatPhone(phoneDigits(client.athleteEmail))}
            onBlur={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              updateClient(client.id, { athleteEmail: digits ? toLoginId(digits) : undefined });
            }}
            placeholder="(555) 123-4567"
            className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
          />
        )}
        <Button
          className="w-full mt-2"
          variant={copied ? "outline" : "primary"}
          disabled={!client.athleteEmail}
          onClick={copyInvite}
        >
          {copied ? "✓ Invite copied — paste it to them" : "📋 Copy athlete invite"}
        </Button>
        {client.athleteEmail ? (
          <p className="text-[11px] text-slate mt-2">
            They sign in with{" "}
            <b className="text-ink">
              {isPhoneLogin(client.athleteEmail)
                ? formatPhone(phoneDigits(client.athleteEmail))
                : client.athleteEmail}
            </b>{" "}
            and a password they create when they sign up.
          </p>
        ) : (
          <p className="text-[11px] text-slate mt-2">Add an email or phone above to enable the invite.</p>
        )}
      </Card>

      <Button
        variant="outline"
        className="w-full"
        onClick={async () => {
          setClientArchived(client.id, true);
          await flushPush();
          window.location.href = "/";
        }}
      >
        📦 Archive athlete
      </Button>
      <p className="text-[11px] text-slate text-center -mt-1">
        Archiving hides them from your roster — you can recover them anytime.
      </p>

      <button
        onClick={async () => {
          if (!confirm(`Permanently delete ${client.name} and all their data? This can't be undone.`)) return;
          deleteClient(client.id);
          await flushPush(); // sync the deletion to the cloud before leaving
          window.location.href = "/";
        }}
        className="w-full text-center text-brick text-sm py-2"
      >
        Delete permanently
      </button>
      </>
      )}
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
