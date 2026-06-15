"use client";

import { youtubeEmbed } from "@/lib/youtube";

// Plays a YouTube demo in-app (overlay with an X), instead of opening a new tab.
export default function VideoModal({
  url,
  title,
  onClose,
}: {
  url?: string;
  title?: string;
  onClose: () => void;
}) {
  const embed = youtubeEmbed(url);
  if (!embed) return null;
  return (
    <div data-noswipe className="fixed inset-0 z-[60] bg-ink/85 backdrop-blur-sm flex flex-col" onClick={onClose}>
      <div
        className="flex items-center justify-between px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-bone font-semibold truncate pr-3">{title ?? "Demo"}</span>
        <button onClick={onClose} aria-label="Close" className="text-bone text-3xl leading-none px-2">
          ×
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-3 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden bg-black">
          <iframe
            src={`${embed}?autoplay=1&rel=0`}
            title={title ?? "Demo video"}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
