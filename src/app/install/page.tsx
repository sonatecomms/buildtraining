"use client";

import { resetAll } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import { useSession } from "@/components/SessionProvider";
import { Button, Card, Pill } from "@/components/ui";
import InstallGuide from "@/components/InstallGuide";

export default function InstallPage() {
  const { session, cloud } = useSession();

  return (
    <div>
      <InstallGuide />

      <div className="mt-8 border-t border-line pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate">Cloud sync</p>
          {cloud ? <Pill tone="green">● Supabase connected</Pill> : <Pill tone="slate">○ Local only</Pill>}
        </div>

        {cloud && session && (
          <Card className="p-3 flex items-center justify-between gap-2">
            <span className="text-sm text-slate truncate">{session.user.email}</span>
            <Button variant="outline" size="sm" onClick={() => getSupabase()?.auth.signOut()}>
              Sign out
            </Button>
          </Card>
        )}

        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm("Reset all data back to the seeded demo?")) resetAll();
          }}
        >
          Reset demo data
        </Button>
      </div>
    </div>
  );
}
