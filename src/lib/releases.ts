// What's-new content for the popup — fully automated, no manual authoring.
//
// `releases.generated.ts` is rewritten at build time (npm prebuild ->
// scripts/gen-releases.mjs) from recent git commit subjects. The popup shows
// the commits made SINCE the build this browser last saw, deduped by SHA, so
// several deploys before the user opens the app collapse into one popup that
// lists everything new. When nothing is new, it stays closed.

import { commits, buildDate } from "./releases.generated";

export { buildDate };

/** The build stamp for this deployment = the newest commit's short SHA. */
export const BUILD_ID = commits[0]?.sha ?? "dev";

const MAX_SHOWN = 6;

/**
 * Highlights to show given the build id this browser last saw, or null when
 * there is nothing new. Newest first.
 */
export function whatsNewSince(lastSeen: string | null): string[] | null {
  if (commits.length === 0) return null;
  if (!lastSeen) return commits.slice(0, 4).map((c) => c.subject); // first ever visit
  const idx = commits.findIndex((c) => c.sha === lastSeen);
  if (idx === 0) return null; // already on the latest build
  // idx > 0: commits since last seen. idx === -1: last seen is older than our
  // window, so just show the most recent.
  const slice = idx > 0 ? commits.slice(0, idx) : commits.slice(0, MAX_SHOWN);
  return slice.slice(0, MAX_SHOWN).map((c) => c.subject);
}
