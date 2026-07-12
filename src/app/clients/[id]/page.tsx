"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useClient } from "@/lib/store";
import { ChevronLeft, ClipboardList, Flame, MessageCircle, User, type LucideIcon } from "lucide-react";
import { Avatar, EmptyState } from "@/components/ui";
import ProgramBuilder from "@/components/ProgramBuilder";
import ProfileEditor from "@/components/ProfileEditor";
import TrainView from "@/components/TrainView";
import MessageThread from "@/components/MessageThread";
import { useUnread } from "@/lib/messages";

type Tab = "program" | "profile" | "train" | "messages";
const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "program", label: "Program", icon: ClipboardList },
  { id: "train", label: "Train", icon: Flame },
  { id: "messages", label: "Chat", icon: MessageCircle },
  { id: "profile", label: "Profile", icon: User },
];

export default function ClientPage() {
  const params = useParams<{ id: string }>();
  const client = useClient(params.id);
  const [tab, setTab] = useState<Tab>("program");
  // Mirror the active tab into ?tab= (replaceState — no nav, no history spam)
  // so a pull-to-refresh reload comes back to the same tab via the deep-link
  // restore below instead of resetting to Program.
  const selectTab = (t: Tab) => {
    setTab(t);
    const sp = new URLSearchParams(window.location.search);
    sp.set("tab", t);
    history.replaceState(null, "", `${window.location.pathname}?${sp}`);
  };
  // Where the back arrow returns to — defaults to the roster, but ?from=numbers
  // (a scoreboard tap) sends them back to the scoreboard.
  const [back, setBack] = useState({ href: "/", label: "Athletes" });
  const unread = useUnread(client?.id, "coach");

  // Allow deep-linking a tab via ?tab=train|profile|program (set after mount to
  // avoid a hydration mismatch with the server-rendered default).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("tab");
    if (t === "train" || t === "profile" || t === "program" || t === "messages") setTab(t);
    if (sp.get("from") === "numbers") setBack({ href: "/numbers", label: "Scoreboard" });
  }, []);

  if (!client) {
    return (
      <div>
        <Link href={back.href} className="inline-flex items-center gap-1 text-slate text-sm"><ChevronLeft size={16} /> {back.label}</Link>
        <EmptyState icon="🤔" title="Athlete not found" hint="They may have been deleted." />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href={back.href} className="text-slate" aria-label={`Back to ${back.label.toLowerCase()}`}><ChevronLeft size={22} /></Link>
        <Avatar src={client.avatarUrl} name={client.name} size={40} gradient />
        <div className="min-w-0">
          <h1 className="font-bold truncate leading-tight">{client.name}</h1>
          <p className="text-xs text-slate">{client.intendedFrequency}×/week target</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-surface border border-line shadow-card mb-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          const showDot = t.id === "messages" && unread > 0 && tab !== "messages";
          return (
            <button
              key={t.id}
              onClick={() => selectTab(t.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${
                active ? "bg-forest text-bone" : "text-slate"
              }`}
            >
              <span className="relative">
                <Icon size={18} />
                {showDot && (
                  <span
                    aria-hidden
                    className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-brick ring-2 ring-surface"
                  />
                )}
              </span>
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "program" && <ProgramBuilder clientId={client.id} />}
      {tab === "profile" && <ProfileEditor client={client} />}
      {tab === "train" && <TrainView client={client} coachView />}
      {tab === "messages" && <MessageThread client={client} me="coach" />}
    </div>
  );
}
