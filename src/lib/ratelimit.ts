import "server-only";

// Minimal in-memory sliding-window rate limiter for low-traffic, single-region
// serverless routes. Good enough to blunt mail-bombing / enumeration of the
// unauthenticated recover endpoint; for multi-region scale, swap for Upstash.
// Note: per-instance memory, so limits are approximate under concurrency.

const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  // opportunistic cleanup so the map doesn't grow unbounded
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  return recent.length <= max;
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff ? xff.split(",")[0] : "").trim() || req.headers.get("x-real-ip") || "unknown";
}
