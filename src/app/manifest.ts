import type { MetadataRoute } from "next";

// PWA manifest — makes the app installable to the iOS/Android home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BUILD — Coaching",
    short_name: "BUILD",
    description:
      "Coach-built training programs, workout logging, and streaks — in your pocket.",
    start_url: "/",
    display: "standalone",
    background_color: "#E2E6DA",
    theme_color: "#19350C",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png?v=11", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png?v=11", sizes: "512x512", type: "image/png", purpose: "any" },
      // padded so OS masking (circle/squircle) never clips the mark
      { src: "/icon-maskable-512.png?v=11", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
