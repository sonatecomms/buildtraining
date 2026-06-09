"use client";

import { useState } from "react";
import { youtubeEmbed, youtubeId, youtubeThumb } from "@/lib/youtube";
import { Button } from "./ui";

// Lets the coach choose exactly which YouTube clip a movement links to:
// paste a URL (or tap a YouTube search result you found), preview it live, save.
export default function VideoPicker({
  movementName,
  current,
  fallback,
  onClose,
  onSave,
}: {
  movementName: string;
  current?: string; // the per-use override, if any
  fallback?: string; // the exercise's default demo
  onClose: () => void;
  onSave: (url: string | undefined) => void;
}) {
  const [url, setUrl] = useState(current ?? fallback ?? "");
  const valid = youtubeId(url);
  const embed = youtubeEmbed(url);
  const thumb = youtubeThumb(url);
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(movementName + " exercise form")}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/40 backdrop-blur-sm">
      <div className="flex-1" onClick={onClose} />
      <div className="bg-bone border-t border-line rounded-t-3xl max-w-2xl w-full mx-auto max-h-[88vh] flex flex-col animate-pop">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="min-w-0">
            <h2 className="font-bold truncate">Demo video</h2>
            <p className="text-xs text-slate truncate">{movementName}</p>
          </div>
          <button onClick={onClose} className="text-slate text-2xl leading-none px-2">×</button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <label className="text-xs text-slate font-medium">YouTube link</label>
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a YouTube URL…"
            className="w-full rounded-xl bg-surface border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
          />

          <a
            href={searchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-sky-dark font-medium"
          >
            🔎 Find “{movementName}” on YouTube
          </a>
          <p className="text-[11px] text-slate -mt-1">
            Open the search, tap the video you want, then copy its link back here.
          </p>

          {/* live preview */}
          <div className="rounded-xl overflow-hidden bg-surface border border-line aspect-video grid place-items-center">
            {embed ? (
              <iframe
                src={embed}
                title="preview"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate text-sm">{url ? "Not a valid YouTube link" : "Preview appears here"}</span>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            {(current || fallback) && (
              <Button
                variant="ghost"
                onClick={() => {
                  onSave(undefined);
                  onClose();
                }}
              >
                Clear override
              </Button>
            )}
            <Button
              className="flex-1"
              disabled={!valid}
              onClick={() => {
                onSave(url.trim());
                onClose();
              }}
            >
              Use this video
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
