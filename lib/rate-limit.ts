import { NextResponse } from "next/server";

type Window = { count: number; resetAt: number };

/**
 * Fixed-window counters kept in module scope. Each serverless instance gets its
 * own map, so the effective limit is (limit x instances) rather than a global
 * one -- enough to stop credential stuffing from a single client, but a shared
 * store (Redis/Vercel KV) is needed for a hard guarantee.
 */
const windows = new Map<string, Window>();

export type RateLimitOptions = { limit: number; windowMs: number };

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(key: string, { limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds };
}

function pruneExpired(now: number) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

/**
 * Vercel sets x-forwarded-for; the left-most entry is the client. Falling back
 * to a shared bucket is deliberate: an unidentifiable caller should still be
 * limited rather than exempt.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again in a moment." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

/** Test helper: clears all counters between cases. */
export function resetRateLimits() {
  windows.clear();
}
