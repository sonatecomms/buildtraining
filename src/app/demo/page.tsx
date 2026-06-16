import type { Metadata } from "next";

// A demo-scoped manifest so "Add to Home Screen" from /demo installs an icon
// whose start_url is /demo (real users install the normal app from elsewhere).
export const metadata: Metadata = {
  manifest: "/demo-manifest.webmanifest",
};

// The demo master login renders from DemoRoot (it intercepts the /demo path so
// it can bypass the real auth gate). This page just makes the route resolve.
export default function DemoPage() {
  return null;
}
