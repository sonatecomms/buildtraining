"use client";

import { useMemo } from "react";
import { useLogsForClient } from "@/lib/store";
import type { Client } from "@/lib/types";
import { relativeDate } from "@/lib/week";
import { loggedSets, topSet, setChips, est1RM } from "@/lib/sets";
import { Button } from "./ui";

// Every past session in which the athlete logged a given movement: the sets they
// did (weight × reps), the heaviest set, and an Epley estimated 1RM, plus a small
// trend line of that estimate over time. Read-only over existing logs.
export default function ExerciseHistory({
  client,
  exerciseId,
  exName,
  onClose,
  onUseMax,
}: {
  client: Client;
  exerciseId: string;
  exName: string;
  onClose: () => void;
  onUseMax?: (weight: number) => void;
}) {
  const logs = useLogsForClient(client.id);

  // One row per session that logged this movement, oldest → newest.
  const sessions = useMemo(() => {
    const rows = logs
      .map((log) => {
        const entry = (log.entries ?? []).find((e) => e.exerciseId === exerciseId);
        if (!entry) return null;
        const sets = loggedSets(entry);
        if (!sets.length) return null;
        const ts = topSet(entry);
        return {
          date: log.date,
          chips: setChips(sets),
          topWeight: ts?.weight ?? 0,
          topReps: ts?.reps,
          est: ts ? est1RM(ts.weight, ts.reps) : 0,
          note: entry.note,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r != null)
      .sort((a, b) => a.date.localeCompare(b.date));
    return rows;
  }, [logs, exerciseId]);

  const ests = sessions.map((s) => s.est).filter((n) => n > 0);
  const bestEst = ests.length ? Math.max(...ests) : 0;
  // newest session with a numeric weight, for "use as max"
  const latestWeight = [...sessions].reverse().find((s) => s.topWeight > 0)?.topWeight ?? 0;

  return (
    <div
      data-noswipe
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-shell w-full sm:max-w-lg max-h-[88dvh] sm:max-h-[85dvh] rounded-t-3xl sm:rounded-3xl border border-line shadow-hero flex flex-col min-h-0 animate-pop overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
          <div className="min-w-0">
            <h2 className="font-bold truncate">{exName}</h2>
            <p className="text-xs text-slate">{sessions.length} logged {sessions.length === 1 ? "session" : "sessions"}</p>
          </div>
          <button onClick={onClose} className="text-slate text-2xl leading-none px-2" aria-label="Close">×</button>
        </div>

        <div
          className="overflow-y-auto px-4 min-h-0 flex-1 overscroll-contain space-y-4 pt-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {bestEst > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate">Best est. 1RM</p>
                  <p className="font-display text-4xl leading-none mt-1">
                    {bestEst}
                    <span className="font-display text-lg text-slate"> lb</span>
                  </p>
                  <p className="text-[11px] text-slate mt-1">Epley estimate from your top set</p>
                </div>
                <Sparkline values={ests} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            {[...sessions].reverse().map((s, i) => (
              <div key={`${s.date}-${i}`} className="rounded-2xl border border-line bg-surface p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{relativeDate(s.date)}</p>
                  {s.est > 0 && (
                    <span className="text-xs text-slate">
                      est 1RM <span className="font-semibold text-accent">{s.est}</span>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {s.chips.map((c, j) => (
                    <span key={j} className="text-xs font-medium rounded-full bg-field border border-line px-2 py-0.5 tabular-nums">
                      {c}
                    </span>
                  ))}
                </div>
                {s.note && <p className="text-xs text-slate mt-2 italic">“{s.note}”</p>}
              </div>
            ))}
          </div>

          {onUseMax && latestWeight > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onUseMax(bestEst || latestWeight);
                onClose();
              }}
            >
              Load {bestEst || latestWeight} lb into the calculator
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Tiny dependency-free SVG trend line of the estimated-1RM values over time.
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 96;
  const h = 44;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="text-forest shrink-0" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={3} fill="currentColor" />
    </svg>
  );
}
