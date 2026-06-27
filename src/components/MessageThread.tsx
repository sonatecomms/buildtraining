"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { Client } from "@/lib/types";
import {
  type Message,
  type Sender,
  fetchThread,
  sendMessage,
  subscribeThread,
  markThreadRead,
} from "@/lib/messages";
import { EmptyState } from "./ui";

// A direct chat thread between a coach and one athlete. Used on the coach's
// athlete-detail "Messages" tab (me="coach") and the athlete's "Coach" tab
// (me="athlete"). Self-syncing via the messages module's realtime channel.
export default function MessageThread({
  client,
  me,
}: {
  client: Client;
  me: Sender;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const otherName = me === "coach" ? client.name.split(" ")[0] : "Coach";

  const scrollToEnd = () =>
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));

  // initial load + mark the other party's messages read
  useEffect(() => {
    let live = true;
    setLoading(true);
    fetchThread(client.id).then((msgs) => {
      if (!live) return;
      setMessages(msgs);
      setLoading(false);
      scrollToEnd();
      void markThreadRead(client.id, me);
    });
    return () => {
      live = false;
    };
  }, [client.id, me]);

  // live incoming messages (dedupe on id, since our own send also appends)
  useEffect(() => {
    return subscribeThread(client.id, (m) => {
      setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
      scrollToEnd();
      if (m.sender !== me) void markThreadRead(client.id, me);
    });
  }, [client.id, me]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    const msg = await sendMessage(client.id, text, me);
    setSending(false);
    if (msg) {
      setMessages((cur) => (cur.some((x) => x.id === msg.id) ? cur : [...cur, msg]));
      scrollToEnd();
    } else {
      setDraft(text); // restore on failure
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-15rem)] min-h-[20rem] rounded-2xl border border-line bg-surface overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2.5">
        {loading ? (
          <p className="text-center text-sm text-slate py-8">Loading…</p>
        ) : messages.length === 0 ? (
          <div className="py-6">
            <EmptyState
              icon="💬"
              title={`No messages with ${otherName} yet`}
              hint={me === "coach" ? "Send a note, a cue, or a check-in." : "Say hi, ask a question, or flag how you're feeling."}
            />
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender === me;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    mine ? "bg-forest text-bone rounded-br-sm" : "bg-field text-ink rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[10px] mt-0.5 ${mine ? "text-bone/60" : "text-slate"}`}>{timeLabel(m.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex items-end gap-2 border-t border-line p-2"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          placeholder={`Message ${otherName}…`}
          className="flex-1 resize-none max-h-28 rounded-xl bg-field border border-line px-3 py-2 text-sm outline-none focus:border-forest"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="w-10 h-10 shrink-0 rounded-xl bg-forest text-bone grid place-items-center disabled:opacity-40 transition-opacity"
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (sameDay) return time;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${time}`;
}
