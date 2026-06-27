"use client";

import { useEffect, useState } from "react";

// Coach ↔ athlete direct messaging. Self-contained: it talks to Supabase
// directly (its own realtime channel) rather than riding the whole-DB
// upsert/prune sync, which would risk deleting the other party's messages.
// Falls back to a localStorage-backed thread when Supabase isn't configured
// (demo / local mode), so the feature still works in the white-label demo.

import { getSupabase } from "./supabase";
import { syncActive, currentCoachId } from "./sync";

export type Sender = "coach" | "athlete";

export interface Message {
  id: string;
  clientId: string;
  sender: Sender;
  body: string;
  createdAt: string; // ISO timestamp
  readAt?: string | null;
}

interface Row {
  id: string;
  client_id: string;
  sender: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

const fromRow = (r: Row): Message => ({
  id: r.id,
  clientId: r.client_id,
  sender: r.sender === "athlete" ? "athlete" : "coach",
  body: r.body,
  createdAt: r.created_at,
  readAt: r.read_at,
});

const newId = () =>
  `msg-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

// ---- local (demo / no-Supabase) fallback -----------------------------------
const lsKey = (clientId: string) => `build.msgs.${clientId}`;

function localThread(clientId: string): Message[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(lsKey(clientId)) || "[]") as Message[];
  } catch {
    return [];
  }
}
function localSave(clientId: string, msgs: Message[]) {
  try {
    window.localStorage.setItem(lsKey(clientId), JSON.stringify(msgs));
    // let other tabs / the role switch pick it up
    window.dispatchEvent(new CustomEvent("build-msgs", { detail: clientId }));
  } catch {}
}

// ---- public API ------------------------------------------------------------

export async function fetchThread(clientId: string): Promise<Message[]> {
  const sb = getSupabase();
  if (!sb || !syncActive()) return localThread(clientId);
  const { data, error } = await sb
    .from("messages")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("fetch messages failed", error.message);
    return [];
  }
  return (data ?? []).map((r) => fromRow(r as Row));
}

export async function sendMessage(
  clientId: string,
  body: string,
  sender: Sender,
): Promise<Message | null> {
  const text = body.trim();
  if (!text) return null;
  const msg: Message = {
    id: newId(),
    clientId,
    sender,
    body: text,
    createdAt: new Date().toISOString(),
    readAt: null,
  };

  const sb = getSupabase();
  if (!sb || !syncActive()) {
    const t = localThread(clientId);
    t.push(msg);
    localSave(clientId, t);
    return msg;
  }

  const { error } = await sb.from("messages").insert({
    id: msg.id,
    coach_id: currentCoachId(),
    client_id: clientId,
    sender,
    body: text,
  });
  if (error) {
    console.warn("send message failed", error.message);
    return null;
  }
  return msg;
}

// Realtime INSERTs for one thread. No-op (returns a noop unsubscribe) in local
// mode — there the sender updates its own state and a storage event covers a
// second tab.
export function subscribeThread(clientId: string, onMessage: (m: Message) => void): () => void {
  const sb = getSupabase();
  if (!sb || !syncActive()) {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === clientId) {
        const t = localThread(clientId);
        const last = t[t.length - 1];
        if (last) onMessage(last);
      }
    };
    if (typeof window !== "undefined") window.addEventListener("build-msgs", handler);
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("build-msgs", handler);
    };
  }
  const ch = sb
    .channel(`msgs-${clientId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `client_id=eq.${clientId}` },
      (payload) => onMessage(fromRow(payload.new as Row)),
    )
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

// Mark the OTHER party's unread messages in this thread as read.
export async function markThreadRead(clientId: string, me: Sender): Promise<void> {
  const other: Sender = me === "athlete" ? "coach" : "athlete";
  const fireRead = () => {
    if (typeof window !== "undefined")
      window.dispatchEvent(new CustomEvent("build-msgs-read", { detail: clientId }));
  };
  const sb = getSupabase();
  if (!sb || !syncActive()) {
    const t = localThread(clientId);
    let changed = false;
    for (const m of t) {
      if (m.sender === other && !m.readAt) {
        m.readAt = new Date().toISOString();
        changed = true;
      }
    }
    if (changed) localSave(clientId, t);
    fireRead();
    return;
  }
  await sb
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("client_id", clientId)
    .eq("sender", other)
    .is("read_at", null);
  fireRead();
}

// How many unread messages from the other party are waiting in this thread.
export function unreadFor(messages: Message[], me: Sender): number {
  const other: Sender = me === "athlete" ? "coach" : "athlete";
  return messages.filter((m) => m.sender === other && !m.readAt).length;
}

export async function unreadCount(clientId: string, me: Sender): Promise<number> {
  return unreadFor(await fetchThread(clientId), me);
}

// Live unread count for a thread, for the nav/tab badge. Refreshes on a new
// incoming message and when the thread is marked read elsewhere in the app.
export function useUnread(clientId: string | undefined, me: Sender): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!clientId) return;
    let live = true;
    const refresh = () => unreadCount(clientId, me).then((c) => live && setN(c));
    refresh();
    const unsub = subscribeThread(clientId, (m) => {
      if (m.sender !== me) refresh();
    });
    const onRead = (e: Event) => {
      if ((e as CustomEvent).detail === clientId) refresh();
    };
    window.addEventListener("build-msgs-read", onRead);
    return () => {
      live = false;
      unsub();
      window.removeEventListener("build-msgs-read", onRead);
    };
  }, [clientId, me]);
  return n;
}
