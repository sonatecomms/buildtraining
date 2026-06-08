"use client";

import { useState } from "react";
import { useClient } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import { Avatar, Button, Card } from "./ui";
import TrainView from "./TrainView";
import ProfileEditor from "./ProfileEditor";
import AthleteOnboard from "./AthleteOnboard";
import { useSession } from "./SessionProvider";

// The athlete's whole experience: their training plus a profile/settings screen.
// No builder, no client list. Data is loaded scoped to this client.
export default function AthleteApp({ clientId }: { clientId: string }) {
  const client = useClient(clientId);
  const { session } = useSession();
  const [justSet, setJustSet] = useState(false);
  const [view, setView] = useState<"train" | "profile">("train");

  // First sign-in (coach set a temp password) → make them set their own.
  const needsPassword = Boolean(session && !session.user.user_metadata?.password_set);
  if (needsPassword && !justSet) {
    return <AthleteOnboard firstName={client?.name?.split(" ")[0]} onDone={() => setJustSet(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-bone/90 backdrop-blur border-b border-line">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setView("train")} className="font-display text-xl tracking-tight">
            BUILD
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setView((v) => (v === "train" ? "profile" : "train"))}
            className="flex items-center gap-2"
            aria-label="Profile & settings"
          >
            {client && <Avatar src={client.avatarUrl} name={client.name} size={32} />}
            <span className="text-slate text-xs font-medium">{view === "train" ? "Profile" : "Training"}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pb-12 pt-4">
        {!client ? (
          <div className="min-h-[50vh] grid place-items-center text-slate text-sm text-center px-6">
            <div>
              <div className="text-3xl mb-2">🤷</div>
              No program is linked to this login yet.
              <br />
              Ask your coach to add your email to your athlete profile.
            </div>
          </div>
        ) : view === "train" ? (
          <>
            <div className="mb-4">
              <h1 className="text-2xl font-bold leading-tight">Hi, {client.name.split(" ")[0]} 👋</h1>
              <p className="text-slate text-sm">Let&apos;s get after it.</p>
            </div>
            <TrainView client={client} />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">Profile & settings</h1>
            <ProfileEditor client={client} coachView={false} />
            <div className="mt-4 space-y-4">
              <ChangePasswordCard />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => getSupabase()?.auth.signOut()}
              >
                Sign out
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ChangePasswordCard() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canSave = pw.length >= 6 && pw === confirm;

  const save = async () => {
    const sb = getSupabase();
    if (!sb || !canSave) return;
    setBusy(true);
    setMsg(null);
    const { error } = await sb.auth.updateUser({ password: pw, data: { password_set: true } });
    setBusy(false);
    if (error) setMsg(error.message);
    else {
      setMsg("Password updated ✓");
      setPw("");
      setConfirm("");
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">Change password</h3>
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="New password (6+ chars)"
        className="w-full mb-2 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        className="w-full rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
      />
      {msg && <p className="text-xs text-slate mt-2">{msg}</p>}
      <Button className="w-full mt-3" onClick={save} disabled={busy || !canSave}>
        {busy ? "Saving…" : "Update password"}
      </Button>
    </Card>
  );
}
