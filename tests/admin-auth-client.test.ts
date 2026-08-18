import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminAuth } from "@/lib/admin-auth";

function respondWith(status: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: status >= 200 && status < 300, status }) as Response),
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("AdminAuth.login", () => {
  it("stores the token when the server accepts it", async () => {
    respondWith(200);

    await expect(AdminAuth.login("correct-token-123")).resolves.toEqual({ ok: true });
    expect(AdminAuth.getToken()).toBe("correct-token-123");
    expect(AdminAuth.isAuthenticated()).toBe(true);
  });

  it("discards the token on 401", async () => {
    AdminAuth.setToken("stale");
    respondWith(401);

    const result = await AdminAuth.login("wrong");

    expect(result).toEqual({ ok: false, error: "Invalid admin token." });
    expect(AdminAuth.getToken()).toBeNull();
  });

  it("keeps a stored token when the server answers 429", async () => {
    AdminAuth.setToken("correct-token-123");
    respondWith(429);

    const result = await AdminAuth.login("correct-token-123");

    expect(result.ok).toBe(false);
    // Throwing the token away here would sign the admin out over a transient
    // rate limit and force them to re-enter it while still blocked.
    expect(AdminAuth.getToken()).toBe("correct-token-123");
  });

  it("keeps a stored token when the server errors", async () => {
    AdminAuth.setToken("correct-token-123");
    respondWith(500);

    await AdminAuth.login("correct-token-123");

    expect(AdminAuth.getToken()).toBe("correct-token-123");
  });
});
