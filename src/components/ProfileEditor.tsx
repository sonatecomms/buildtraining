"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { deleteClient, getClient, setClientArchived, updateClient } from "@/lib/store";
import { flushPush, saveClientNow, setRealtimePaused } from "@/lib/sync";
import type { Client, GoalType } from "@/lib/types";
import { ALL_GOALS, GOALS } from "@/lib/goals";
import {
  displayLogin,
  formatPhone,
  isReservedEmail,
  isValidUsername,
  type LoginKind,
  loginKind,
  phoneDigits,
  toLoginId,
  usernameHandle,
} from "@/lib/login";
import { APP_VERSION } from "@/lib/version";
import { Avatar, Button, Card } from "./ui";
import AvatarCropper from "./AvatarCropper";
import BiometricLockCard from "./BiometricLockCard";

// A readable but non-guessable temp password (no ambiguous chars). ~58 bits —
// far stronger than the old predictable `build####` (9k-guess) pattern.
function genTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const arr = new Uint32Array(10);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

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
  const [loginMode, setLoginMode] = useState<LoginKind>(loginKind(client.athleteEmail));
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState<{ login: string; pw: string } | null>(null);
  const [resetErr, setResetErr] = useState<string | null>(null);
  const [credPw, setCredPw] = useState(genTempPassword);
  const [showCredPw, setShowCredPw] = useState(false);
  const [credCopied, setCredCopied] = useState(false);
  // The login id already on file when the editor opened, so a username change can
  // rename that same auth account instead of orphaning it.
  const originalEmail = useRef(client.athleteEmail);

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
    const who = displayLogin(client.athleteEmail);
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

  // Apply the chosen username (the email/phone field above) AND set a password in
  // one step. Server-side this reconciles the real auth account — creating it,
  // renaming it, or just repasswording it — so phone athletes (no inbox, can't
  // self-reset) and renamed logins always end up able to sign in.
  const saveLoginAndPassword = async () => {
    const sb = getSupabase();
    if (!sb) return;
    // commit whatever's in the focused username field first, then read it back
    (document.activeElement as HTMLElement | null)?.blur();
    setResetErr(null);
    setResetDone(null);
    await new Promise((r) => setTimeout(r, 60));
    const loginId = getClient(client.id)?.athleteEmail;
    if (!loginId) {
      setResetErr("Add an email or phone above first.");
      return;
    }
    const pw = credPw.trim();
    if (pw.length < 6) {
      setResetErr("Password must be at least 6 characters.");
      return;
    }
    setResetting(true);
    try {
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setResetErr("Your session expired — sign in again.");
        return;
      }
      const res = await fetch("/api/athlete/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clientId: client.id,
          loginId,
          previousLoginId: originalEmail.current,
          newPassword: pw,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setResetErr(json.error || "Couldn't save the login.");
      } else {
        const saved = (json.loginId as string) || loginId;
        if (saved !== client.athleteEmail) updateClient(client.id, { athleteEmail: saved });
        originalEmail.current = saved;
        const shown = displayLogin(saved);
        setResetDone({ login: shown, pw });
        setCredPw(genTempPassword()); // fresh one for the next athlete
      }
    } catch {
      setResetErr("Network error — try again.");
    } finally {
      setResetting(false);
    }
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
        <button onClick={() => fileRef.current?.click()} aria-label="Change profile photo" className="relative">
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
          Pick how the athlete signs in — email, phone, or a username — so they see only their own training.
        </p>
        <div className="flex gap-1 mb-2">
          {(["email", "phone", "username"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setLoginMode(m);
                setLoginErr(null);
              }}
              className={`flex-1 rounded-lg py-2.5 text-xs font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${
                loginMode === m ? "bg-forest text-bone" : "bg-field text-slate border border-line"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {loginMode === "email" ? (
          <input
            key="email"
            type="email"
            defaultValue={loginKind(client.athleteEmail) === "email" ? (client.athleteEmail ?? "") : ""}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && isReservedEmail(v)) {
                setLoginErr("That email address can’t be used here.");
                return;
              }
              setLoginErr(null);
              updateClient(client.id, { athleteEmail: v ? toLoginId(v, "email") : undefined });
            }}
            placeholder="athlete@example.com"
            className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
          />
        ) : loginMode === "phone" ? (
          <input
            key="phone"
            type="tel"
            defaultValue={formatPhone(phoneDigits(client.athleteEmail))}
            onBlur={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              updateClient(client.id, { athleteEmail: digits ? toLoginId(digits, "phone") : undefined });
            }}
            placeholder="(555) 123-4567"
            className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
          />
        ) : (
          <input
            key="username"
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            defaultValue={usernameHandle(client.athleteEmail)}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && !isValidUsername(v)) {
                setLoginErr("Username needs 3+ characters and at least one letter.");
                return;
              }
              setLoginErr(null);
              updateClient(client.id, { athleteEmail: v ? toLoginId(v, "username") : undefined });
            }}
            placeholder="e.g. abbyr (3+ chars, a letter)"
            className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
          />
        )}
        {loginErr && <p className="text-brick text-[11px] mt-1.5" role="alert">{loginErr}</p>}
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
            They sign in with <b className="text-ink">{displayLogin(client.athleteEmail)}</b> and a password
            they create when they sign up.
          </p>
        ) : (
          <p className="text-[11px] text-slate mt-2">Add an email, phone, or username above to enable the invite.</p>
        )}

        {client.athleteEmail && client.athleteEmail !== originalEmail.current && (
          <p className="text-[11px] text-brick mt-2" role="alert">
            You changed the login. This only updates your roster — use “Save login &amp; password” below to apply it to
            their actual sign-in account, or they won’t be able to log in.
          </p>
        )}

        {client.athleteEmail && loginKind(client.athleteEmail) !== "email" && (
          <div className="mt-3">
            <label className="text-[11px] text-slate font-medium">Recovery email (for password resets)</label>
            <input
              type="email"
              defaultValue={client.recoveryEmail ?? ""}
              onBlur={(e) =>
                updateClient(client.id, { recoveryEmail: e.target.value.trim().toLowerCase() || undefined })
              }
              placeholder="backup@example.com"
              className="w-full mt-1 rounded-xl bg-field border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
            <p className="text-[11px] text-slate mt-1">
              Lets this phone/username athlete reset their own password without you.
            </p>
          </div>
        )}

        {client.athleteEmail && (
          <div className="mt-3 pt-3 border-t border-line">
            <p className="text-xs text-slate font-medium">Or set their login &amp; password directly</p>
            <p className="text-[11px] text-slate mt-0.5 mb-2">
              Applies the email/phone above and this password to their account — use it for phone logins
              (no inbox to self-reset) or to fix a sign-in.
            </p>
            <label className="text-[11px] text-slate font-medium">Password</label>
            <div className="relative mt-1 mb-2">
              <input
                type={showCredPw ? "text" : "password"}
                value={credPw}
                onChange={(e) => setCredPw(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl bg-field border border-line px-3 py-2 pr-24 text-sm outline-none focus:border-forest"
              />
              <div className="absolute right-1 inset-y-0 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowCredPw((s) => !s)}
                  className="px-2 text-[11px] text-slate font-medium"
                  aria-label={showCredPw ? "Hide password" : "Show password"}
                >
                  {showCredPw ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => setCredPw(genTempPassword())}
                  className="px-2 text-[11px] text-sky-dark font-medium"
                >
                  New
                </button>
              </div>
            </div>
            <Button className="w-full" variant="outline" disabled={resetting} onClick={saveLoginAndPassword}>
              {resetting ? "Saving…" : "Save login & password"}
            </Button>
            {resetDone && (
              <div className="mt-2">
                <p className="text-[11px] text-ink">
                  Done — they sign in with <b>{resetDone.login}</b> and password <b>{resetDone.pw}</b>.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`Login: ${resetDone.login}\nPassword: ${resetDone.pw}`);
                      setCredCopied(true);
                      setTimeout(() => setCredCopied(false), 2000);
                    } catch {
                      /* clipboard unavailable */
                    }
                  }}
                  className="text-[11px] text-sky-dark font-medium mt-1"
                >
                  {credCopied ? "✓ Copied" : "Copy login + password"}
                </button>
              </div>
            )}
            {resetErr && <p className="text-[11px] text-brick mt-2">{resetErr}</p>}
          </div>
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
