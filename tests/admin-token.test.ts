import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkAdminToken, getAdminTokenFromRequest, isAdminTokenValid } from "@/lib/admin-token";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.ADMIN_TOKEN = "correct-token-123";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("isAdminTokenValid", () => {
  it("accepts only the configured token", () => {
    expect(isAdminTokenValid("correct-token-123")).toBe(true);
    expect(isAdminTokenValid("wrong-passcode")).toBe(false);
    // A prefix of the real token must not pass; this is what made the admin
    // dashboard render for any non-empty passcode before the fix.
    expect(isAdminTokenValid("correct-token-12")).toBe(false);
    expect(isAdminTokenValid("correct-token-1234")).toBe(false);
  });

  it("rejects empty values", () => {
    expect(isAdminTokenValid("")).toBe(false);
    expect(isAdminTokenValid(null)).toBe(false);
    expect(isAdminTokenValid(undefined)).toBe(false);
  });

  it("denies everything in production when ADMIN_TOKEN is unset", () => {
    delete process.env.ADMIN_TOKEN;
    const nodeEnv = Object.getOwnPropertyDescriptor(process.env, "NODE_ENV");
    Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true });
    expect(isAdminTokenValid("anything")).toBe(false);
    if (nodeEnv) Object.defineProperty(process.env, "NODE_ENV", nodeEnv);
  });
});

describe("getAdminTokenFromRequest", () => {
  it("prefers the x-admin-token header", () => {
    const req = new Request("https://example.com/api/admin/users?token=from-query", {
      headers: { "x-admin-token": "from-header" },
    });
    expect(getAdminTokenFromRequest(req)).toBe("from-header");
  });

  it("falls back to the token query parameter", () => {
    const req = new Request("https://example.com/api/admin/users?token=from-query");
    expect(getAdminTokenFromRequest(req)).toBe("from-query");
  });

  it("returns null when neither is present", () => {
    expect(getAdminTokenFromRequest(new Request("https://example.com/api/admin/users"))).toBeNull();
  });
});

describe("checkAdminToken", () => {
  it("gates a request end to end", () => {
    const good = new Request("https://example.com/api/admin/users", {
      headers: { "x-admin-token": "correct-token-123" },
    });
    const bad = new Request("https://example.com/api/admin/users", {
      headers: { "x-admin-token": "nope" },
    });
    expect(checkAdminToken(good)).toBe(true);
    expect(checkAdminToken(bad)).toBe(false);
    expect(checkAdminToken(new Request("https://example.com/api/admin/users"))).toBe(false);
  });
});
