"use client";

import { useState } from "react";
import Link from "next/link";
import { useClients, useLogsForClient, addClient } from "@/lib/store";
import { Avatar, Button, Card, EmptyState, PageHeader, Pill } from "@/components/ui";
import { GOALS } from "@/lib/goals";
import type { Client } from "@/lib/types";

function ClientRow({ client }: { client: Client }) {
  const logs = useLogsForClient(client.id);
  const last = logs[0];
  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="p-4 flex items-center gap-3">
        <Avatar src={client.avatarUrl} name={client.name} size={48} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{client.name}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {client.goals.slice(0, 3).map((g) => (
              <Pill key={g} tone="green">
                {GOALS[g].icon} {GOALS[g].label}
              </Pill>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate">{client.intendedFrequency}×/wk</p>
          <p className="text-xs text-slate mt-1">
            {last ? `Last: ${last.date.slice(5)}` : "No sessions"}
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
        subtitle={`${clients.length} active`}
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

      {clients.length === 0 ? (
        <EmptyState icon="🏋️" title="No athletes yet" hint="Add your first client to start programming." />
      ) : (
        <div className="space-y-3">
          {clients.map((c) => (
            <ClientRow key={c.id} client={c} />
          ))}
        </div>
      )}
    </div>
  );
}
