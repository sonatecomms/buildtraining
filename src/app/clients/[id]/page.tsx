"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useClient } from "@/lib/store";
import { ChevronLeft, ClipboardList, Flame, User, type LucideIcon } from "lucide-react";
import { Avatar, EmptyState } from "@/components/ui";
import ProgramBuilder from "@/components/ProgramBuilder";
import ProfileEditor from "@/components/ProfileEditor";
import TrainView from "@/components/TrainView";

type Tab = "program" | "profile" | "train";
const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "program", label: "Program", icon: ClipboardList },
  { id: "train", label: "Train", icon: Flame },
  { id: "profile", label: "Profile", icon: User },
];

export default function ClientPage() {
  const params = useParams<{ id: string }>();
  const client = useClient(params.id);
  const [tab, setTab] = useState<Tab>("program");

  // Allow deep-linking a tab via ?tab=train|profile|program (set after mount to
  // avoid a hydration mismatch with the server-rendered default).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "train" || t === "profile" || t === "program") setTab(t);
  }, []);

  if (!client) {
    return (
      <div>
        <Link href="/" className="inline-flex items-center gap-1 text-slate text-sm"><ChevronLeft size={16} /> Athletes</Link>
        <EmptyState icon="🤔" title="Athlete not found" hint="They may have been deleted." />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/" className="text-slate" aria-label="Back to athletes"><ChevronLeft size={22} /></Link>
        <Avatar src={client.avatarUrl} name={client.name} size={40} gradient />
        <div className="min-w-0">
          <h1 className="font-bold truncate leading-tight">{client.name}</h1>
          <p className="text-xs text-slate">{client.intendedFrequency}×/week target</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-surface border border-line shadow-card mb-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${
                active ? "bg-forest text-bone" : "text-slate"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "program" && <ProgramBuilder clientId={client.id} />}
      {tab === "profile" && <ProfileEditor client={client} />}
      {tab === "train" && <TrainView client={client} coachView />}
    </div>
  );
}
