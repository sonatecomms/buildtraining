"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "./ui";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// Render the chosen crop region to a square JPEG data URL.
async function cropToDataUrl(src: string, area: Area, size = 256): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.85);
}

// Interactive avatar crop: pan + pinch/scroll to zoom inside a round frame.
export default function AvatarCropper({
  src,
  onCancel,
  onSave,
}: {
  src: string;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  const save = async () => {
    if (!area) return;
    setBusy(true);
    try {
      onSave(await cropToDataUrl(src, area));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-noswipe className="fixed inset-0 z-[60] bg-ink/90 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onCancel} className="text-bone text-sm">Cancel</button>
        <span className="text-bone font-semibold">Crop photo</span>
        <button onClick={save} disabled={busy} className="text-bone font-bold text-sm">
          {busy ? "…" : "Save"}
        </button>
      </div>

      <div className="relative flex-1">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onComplete}
        />
      </div>

      <div className="px-6 pt-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        <div className="flex items-center gap-3">
          <span className="text-bone text-lg">−</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(+e.target.value)}
            className="w-full accent-[#357836]"
          />
          <span className="text-bone text-lg">+</span>
        </div>
        <Button className="w-full mt-3" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Use photo"}
        </Button>
      </div>
    </div>
  );
}
