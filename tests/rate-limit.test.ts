import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getClientIp, rateLimit, resetRateLimits, tooManyRequests } from "@/lib/rate-limit";

const OPTS = { limit: 3, windowMs: 60_000 };

beforeEach(() => {
  resetRateLimits();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  resetRateLimits();
});

describe("rateLimit", () => {
  it("allows requests up to the limit and blocks the next one", () => {
    expect(rateLimit("k", OPTS)).toMatchObject({ allowed: true, remaining: 2 });
    expect(rateLimit("k", OPTS)).toMatchObject({ allowed: true, remaining: 1 });
    expect(rateLimit("k", OPTS)).toMatchObject({ allowed: true, remaining: 0 });
    expect(rateLimit("k", OPTS).allowed).toBe(false);
  });

  it("keeps separate budgets per key", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", OPTS);
    expect(rateLimit("a", OPTS).allowed).toBe(false);
    expect(rateLimit("b", OPTS).allowed).toBe(true);
  });

  it("recovers once the window elapses", () => {
    for (let i = 0; i < 4; i++) rateLimit("k", OPTS);
    expect(rateLimit("k", OPTS).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(rateLimit("k", OPTS)).toMatchObject({ allowed: true, remaining: 2 });
  });

  it("reports how long to wait", () => {
    for (let i = 0; i < 3; i++) rateLimit("k", OPTS);
    vi.advanceTimersByTime(30_000);

    const blocked = rateLimit("k", OPTS);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(30);
  });

  it("does not extend the window on blocked attempts", () => {
    for (let i = 0; i < 10; i++) rateLimit("k", OPTS);
    vi.advanceTimersByTime(60_001);

    // A caller who keeps hammering must not lock themselves out indefinitely.
    expect(rateLimit("k", OPTS).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("takes the left-most x-forwarded-for entry", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
    });
    expect(getClientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip, then a shared bucket", () => {
    const realIp = new Request("https://example.com", { headers: { "x-real-ip": "203.0.113.9" } });
    expect(getClientIp(realIp)).toBe("203.0.113.9");
    expect(getClientIp(new Request("https://example.com"))).toBe("unknown");
  });
});

describe("tooManyRequests", () => {
  it("answers 429 with a Retry-After header", () => {
    const res = tooManyRequests(42);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
  });
});
