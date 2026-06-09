"use client";

import { useState } from "react";
import { Card } from "./ui";

// Training % calculator: enter a 1-rep max, see working weights in 5% steps from
// 55–100%, plus a custom-% lookup (e.g. 87% of 225). The 1RM is controlled by the
// parent so a logged PR can be tapped to load it.

const PCTS = [55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
const ROUNDS = [5, 2.5, 1];

const fmt = (n: number) => {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace(/\.0$/, "");
};
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export default function PercentageCalculator({
  max,
  onMaxChange,
}: {
  max: string;
  onMaxChange: (v: string) => void;
}) {
  const [round, setRound] = useState(5);
  const [customPct, setCustomPct] = useState("");

  const m = parseFloat(max) || 0;
  const has = m > 0;
  const weightAt = (pct: number) => roundTo((m * pct) / 100, round);

  const cp = parseFloat(customPct);
  const customRaw = has && isFinite(cp) ? (m * cp) / 100 : null;
  const customRounded = customRaw != null ? roundTo(customRaw, round) : null;

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">% of 1-rep max</h3>

      <label htmlFor="orm" className="text-[11px] text-slate font-medium">1-rep max (lb)</label>
      <input
        id="orm"
        type="number"
        inputMode="decimal"
        value={max}
        onChange={(e) => onMaxChange(e.target.value)}
        placeholder="e.g. 225"
        className="w-full mt-1 mb-3 rounded-xl bg-field border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
      />

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] text-slate">Round to</span>
        <div className="flex gap-1">
          {ROUNDS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRound(r)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${
                round === r ? "bg-forest text-bone" : "bg-field text-slate border border-line"
              }`}
            >
              {r} lb
            </button>
          ))}
        </div>
      </div>

      {/* custom % */}
      <div className="rounded-xl bg-field border border-line p-3 mb-3">
        <label htmlFor="cpct" className="text-[11px] text-slate font-medium">Custom %</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            id="cpct"
            type="number"
            inputMode="decimal"
            value={customPct}
            onChange={(e) => setCustomPct(e.target.value)}
            placeholder="87"
            className="w-16 rounded-lg bg-surface border border-line px-2 py-1.5 text-sm outline-none focus:border-forest"
          />
          <span className="text-slate text-sm">% =</span>
          <span className="text-lg font-bold text-forest tabular-nums">
            {customRounded != null ? fmt(customRounded) : "—"}
          </span>
          <span className="text-xs text-slate">lb</span>
          {customRaw != null && customRounded != null && Math.abs(customRounded - customRaw) > 0.05 && (
            <span className="text-[11px] text-slate">(exact {fmt(customRaw)})</span>
          )}
        </div>
      </div>

      {/* 55–100% in 5% steps */}
      <div className="grid grid-cols-2 gap-x-5 gap-y-0.5">
        {PCTS.map((pct) => (
          <div key={pct} className="flex items-baseline justify-between border-b border-line/60 py-1">
            <span className="text-xs text-slate font-medium">{pct}%</span>
            <span className="text-sm font-semibold tabular-nums">
              {has ? fmt(weightAt(pct)) : "—"}
              <span className="text-[10px] text-slate font-normal"> lb</span>
            </span>
          </div>
        ))}
      </div>

      {!has && <p className="text-[11px] text-slate mt-2">Enter a 1-rep max to see your working weights.</p>}
    </Card>
  );
}
