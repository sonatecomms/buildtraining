"use client";

import { useClient } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import { Avatar } from "./ui";
import TrainView from "./TrainView";

// The athlete's whole experience: just their training. No builder, no client
// list. Data was loaded scoped to this client by SessionProvider.
export default function AthleteApp({ clientId }: { clientId: string }) {
  const client = useClient(clientId);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-bone/90 backdrop-blur border-b border-line">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="font-display text-xl tracking-tight">BUILD</span>
          <div className="flex-1" />
          {client && <Avatar src={client.avatarUrl} name={client.name} size={32} />}
          <button
            onClick={() => getSupabase()?.auth.signOut()}
            className="text-slate text-xs font-medium"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pb-12 pt-4">
        {client ? (
          <>
            <div className="mb-4">
              <h1 className="text-2xl font-bold leading-tight">Hi, {client.name.split(" ")[0]} 👋</h1>
              <p className="text-slate text-sm">Let&apos;s get after it.</p>
            </div>
            <TrainView client={client} />
          </>
        ) : (
          <div className="min-h-[50vh] grid place-items-center text-slate text-sm text-center px-6">
            <div>
              <div className="text-3xl mb-2">🤷</div>
              No program is linked to this login yet.
              <br />
              Ask your coach to add your email to your athlete profile.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
