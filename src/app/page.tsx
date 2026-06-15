"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useClients, useLogsForClient, addClient, setClientArchived } from "@/lib/store";
import { Avatar, Button, Card, EmptyState, Fab, PageHeader, Pill, Skeleton } from "@/components/ui";
import { GOALS } from "@/lib/goals";
import { relativeDate, daysAgo, weekDates, isoDate } from "@/lib/week";
import type { Client } from "@/lib/types";

function ClientRow({ client }: { client: Client }) {
  const logs = useLogsForClient(client.id);
  const last = logs[0];
  const stale = last ? daysAgo(last.date) > 7 : true;
  // how many sessions logged so far this calendar week vs. the target
  const weekStart = isoDate(weekDates()[0]);
  const thisWeek = logs.filter((l) => l.date >= weekStart).length;
  const behind = thisWeek < client.intendedFrequency;
  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="p-4 flex items-center gap-3">
        <Avatar src={client.avatarUrl} name={client.name} size={48} gradient />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {behind && <span className="w-2 h-2 rounded-full bg-brick shrink-0" title="Behind this week" />}
            <p className="font-semibold truncate">{client.name}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {client.goals.slice(0, 3).map((g) => (
              <Pill key={g} tone="green">
                {GOALS[g].icon} {GOALS[g].label}
              </Pill>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate">{thisWeek}/{client.intendedFrequency} this wk</p>
          <p className={`text-xs mt-1 ${stale ? "text-brick" : "text-slate"}`}>
            {last ? relativeDate(last.date) : "No sessions"}
          </p>
        </div>
      </Card>
    </Link>
  );
}

export default function CoachHome() {
  const clients = useClients();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  // gate the roster on mount so we never flash the SSR seed data before the
  // real (localStorage / cloud-pulled) roster is in hand
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const active = clients.filter((c) => !c.archived);
  const archived = clients.filter((c) => c.archived);

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addClient({ name: trimmed });
    setName("");
    setAdding(false);
  };

  return (
    <div>
      <PageHeader
        title="Your Athletes"
        subtitle={`${active.length} active`}
        action={
          <Button size="sm" onClick={() => setAdding((v) => !v)}>
            + Add
          </Button>
        }
      />

      {adding && (
        <Card className="p-4 mb-4">
          <label className="text-xs text-slate font-medium">Athlete name</label>
          <div className="flex gap-2 mt-1.5">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder="e.g. Sam Carter"
              className="flex-1 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            />
            <Button onClick={create}>Create</Button>
          </div>
        </Card>
      )}

      {!ready ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-line bg-surface">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : active.length === 0 ? (
        <EmptyState icon="🏋️" title="No active athletes" hint="Add an athlete, or recover one from the archive below." />
      ) : (
        <div className="space-y-3">
          {active.map((c) => (
            <ClientRow key={c.id} client={c} />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div className="mt-8 border-t border-line pt-4">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-slate"
          >
            <span>{showArchived ? "▼" : "▶"}</span>
            Archived ({archived.length})
          </button>
          {showArchived && (
            <div className="space-y-2 mt-3">
              {archived.map((c) => (
                <Card key={c.id} className="p-3 flex items-center gap-3">
                  <Avatar src={c.avatarUrl} name={c.name} size={40} gradient />
                  <Link href={`/clients/${c.id}`} className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{c.name}</p>
                    <p className="text-xs text-slate">Archived</p>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => setClientArchived(c.id, false)}>
                    Recover
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-24 right-4 z-30" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        <Fab
          label="Add athlete"
          onClick={() => {
            setAdding(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Plus size={26} />
        </Fab>
      </div>
    </div>
  );
}
