"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Palette } from "lucide-react";
import { useSchoolTheme } from "./SchoolThemeProvider";
import { BrandMark } from "./BrandMark";
import {
  ALL_THEMES,
  BUILD_DEFAULT,
  surfaceVars,
  type School,
  type SurfaceMode,
} from "@/lib/schoolThemes";

const MODES: { id: SurfaceMode; label: string }[] = [
  { id: "cream", label: "Default" },
  { id: "light", label: "Off-white" },
  { id: "dark", label: "Off-black" },
];

// Demo affordance: a floating chip that opens a sheet of schools. Selecting one
// re-skins the whole app live, proving BUILD is white-labelable per program.
export function SchoolThemePicker() {
  const { school, setSchool, mode, setMode } = useSchoolTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* trigger — sits in the demo control cluster (DemoRoot positions it) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Switch school theme (demo)"
        className="flex items-center gap-1.5 rounded-full bg-surface/90 backdrop-blur border border-line text-ink shadow-card px-2.5 h-9 text-sm font-semibold active:scale-95 transition-transform"
      >
        {school.id === BUILD_DEFAULT.id ? (
          <BrandMark size={16} />
        ) : (
          <span className="text-base leading-none">{school.emoji}</span>
        )}
        <Palette size={15} className="text-accent" />
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Choose a school theme"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-shell w-full sm:max-w-md max-h-[88dvh] sm:max-h-[85dvh] rounded-t-3xl sm:rounded-3xl border border-line shadow-hero flex flex-col min-h-0 animate-pop overflow-hidden"
          >
            {/* header */}
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-line/70">
              <div>
                <h2 className="font-display text-xl text-accent leading-tight">Brand this app</h2>
                <p className="text-[13px] text-slate mt-0.5">
                  One tap re-skins BUILD for your program. Schools near 44281.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="shrink-0 grid place-items-center w-9 h-9 rounded-full bg-surface border border-line text-slate active:scale-95 transition-transform"
              >
                <X size={18} />
              </button>
            </div>

            {/* backdrop tint — cream / off-white / off-black, in the school's hue */}
            <div className="px-5 pt-3 pb-1">
              <div className="flex items-center gap-1 rounded-full bg-surface border border-line p-1">
                {MODES.map((m) => {
                  const active = mode === m.id;
                  const preview =
                    m.id === "cream"
                      ? "#e2e6da"
                      : (surfaceVars(school, m.id) as Record<string, string>)["--background"];
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      aria-pressed={active}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-full h-8 text-[12px] font-semibold transition-colors ${
                        active ? "bg-forest text-bone" : "text-slate"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/15"
                        style={{ background: preview }}
                        aria-hidden
                      />
                      {m.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate/70 mt-1.5 px-1">
                Backdrop tint for this program.
              </p>
            </div>

            {/* list */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 no-scrollbar">
              {ALL_THEMES.map((s) => (
                <ThemeRow
                  key={s.id}
                  school={s}
                  active={s.id === school.id}
                  onPick={() => setSchool(s.id)}
                />
              ))}
            </div>

            <div className="px-5 py-3 border-t border-line/70">
              <button
                onClick={() => setOpen(false)}
                className="w-full min-h-[44px] rounded-xl bg-forest text-bone font-semibold active:scale-[0.98] transition-transform"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function ThemeRow({
  school,
  active,
  onPick,
}: {
  school: School;
  active: boolean;
  onPick: () => void;
}) {
  const isDefault = school.id === BUILD_DEFAULT.id;
  return (
    <button
      onClick={onPick}
      className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left border transition-colors ${
        active ? "border-forest bg-surface" : "border-line/60 bg-surface/60 hover:bg-surface"
      }`}
    >
      {/* dual-color school swatch with the mascot emoji centered */}
      <span
        className="relative shrink-0 grid place-items-center w-11 h-11 rounded-full ring-1 ring-line"
        style={{
          background: `linear-gradient(135deg, ${school.swatch[0]} 0 50%, ${school.swatch[1]} 50% 100%)`,
        }}
      >
        {isDefault ? (
          <BrandMark size={22} color="var(--color-bone)" />
        ) : (
          <span className="text-lg drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]">{school.emoji}</span>
        )}
      </span>

      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-ink text-[15px] truncate">{school.name}</span>
        <span className="block text-[12px] text-slate truncate">
          {isDefault ? "Native theme" : `${school.mascot} · ${school.city}`}
        </span>
      </span>

      {!isDefault && (
        <span
          className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
            school.kind === "private"
              ? "bg-sky/15 text-sky-dark"
              : "bg-green/10 text-green"
          }`}
        >
          {school.kind}
        </span>
      )}

      <span
        className={`shrink-0 grid place-items-center w-6 h-6 rounded-full border ${
          active ? "bg-forest border-forest text-bone" : "border-line text-transparent"
        }`}
      >
        <Check size={14} />
      </span>
    </button>
  );
}
