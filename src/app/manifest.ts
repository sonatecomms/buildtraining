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
      { src: "/logo-icon.png?v=5", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/logo-icon.png?v=5", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
