import type { NextConfig } from "next";

// Baseline security headers applied to every route.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Build stamp for the "what's new" popup: the Vercel commit SHA (short),
  // inlined into the client bundle so the browser can detect a new deployment.
  // Falls back to a stable "dev" locally so the popup shows once, not on every
  // hot reload.
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
