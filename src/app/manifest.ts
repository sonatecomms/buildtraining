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
    background_color: "#191918",
    theme_color: "#19350C",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
