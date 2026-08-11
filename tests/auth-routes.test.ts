import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "@/lib/rate-limit";

const findUnique = vi.fn();
const verifyPassword = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: (...a: unknown[]) => findUnique(...a) } } }));
vi.mock("@/lib/auth", () => ({
  verifyPassword: (...a: unknown[]) => verifyPassword(...a),
  createSessionToken: async () => "token",
  sessionCookie: { name: "session", options: {} },
}));

function signedInAs(email: string) {
  findUnique.mockResolvedValue({
    id: "u1",
    email,
    name: "Real",
    approved: true,
    is_admin: false,
    password_hash: "hash",
  });
  verifyPassword.mockResolvedValue(true);
}

function loginRequest(email: string, ip = "203.0.113.1") {
  return new Request("https://example.com/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ email, password: "guess" }),
  });
}

beforeEach(() => {
  resetRateLimits();
  findUnique.mockResolvedValue(null);
  verifyPassword.mockResolvedValue(false);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  resetRateLimits();
  vi.restoreAllMocks();
});

describe("POST /api/auth/login", () => {
  it("stops a password-guessing burst from one address with 429", async () => {
    const { POST } = await import("@/app/api/auth/login/route");

    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await POST(loginRequest(`user${i}@example.com`));
      statuses.push(res.status);
    }

    // 10 attempts per minute per IP, then the door closes.
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses.slice(10)).toEqual([429, 429]);
  });

  it("caps attempts against a single account even from rotating addresses", async () => {
    const { POST } = await import("@/app/api/auth/login/route");

    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const res = await POST(loginRequest("victim@example.com", `203.0.113.${i + 10}`));
      statuses.push(res.status);
    }

    expect(statuses.slice(0, 5).every((s) => s === 401)).toBe(true);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });

  it("tells the caller when to retry", async () => {
    const { POST } = await import("@/app/api/auth/login/route");

    let res: Response | undefined;
    for (let i = 0; i < 11; i++) res = await POST(loginRequest(`user${i}@example.com`));

    expect(res?.status).toBe(429);
    expect(Number(res?.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("still authenticates a valid user within the limit", async () => {
    signedInAs("real@example.com");

    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(loginRequest("real@example.com"));

    expect(res.status).toBe(200);
  });

  it("never locks a user out for signing in repeatedly", async () => {
    signedInAs("real@example.com");
    const { POST } = await import("@/app/api/auth/login/route");

    // Several devices, or a few log out / log back in cycles. Successes must
    // not spend the budget.
    const statuses: number[] = [];
    for (let i = 0; i < 20; i++) {
      statuses.push((await POST(loginRequest("real@example.com"))).status);
    }

    expect(statuses.every((s) => s === 200)).toBe(true);
  });

  it("forgets earlier typos once the password is finally correct", async () => {
    const { POST } = await import("@/app/api/auth/login/route");

    for (let i = 0; i < 4; i++) await POST(loginRequest("real@example.com"));

    signedInAs("real@example.com");
    expect((await POST(loginRequest("real@example.com"))).status).toBe(200);

    // The four strikes are cleared, so the next typo doesn't trip the limit.
    verifyPassword.mockResolvedValue(false);
    expect((await POST(loginRequest("real@example.com"))).status).toBe(401);
  });
});

describe("POST /api/admin/verify", () => {
  it("blocks passcode guessing after 5 tries", async () => {
    process.env.ADMIN_TOKEN = "correct-token-123";
    const { POST } = await import("@/app/api/admin/verify/route");

    const attempt = (token: string) =>
      POST(
        new Request("https://example.com/api/admin/verify", {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.7" },
          body: JSON.stringify({ token }),
        }),
      );

    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) statuses.push((await attempt(`guess-${i}`)).status);

    expect(statuses.slice(0, 5).every((s) => s === 401)).toBe(true);
    expect(statuses.slice(5)).toEqual([429, 429]);

    // The correct token is refused too while the window is open, which is the
    // point: an attacker can't keep guessing by interleaving valid requests.
    expect((await attempt("correct-token-123")).status).toBe(429);
  });

  it("does not eject an admin who browses their own dashboard", async () => {
    process.env.ADMIN_TOKEN = "correct-token-123";
    const { POST } = await import("@/app/api/admin/verify/route");

    // Every admin page re-verifies the stored token on mount, so paging around
    // the dashboard must not spend the guessing budget.
    const statuses: number[] = [];
    for (let i = 0; i < 15; i++) {
      const res = await POST(
        new Request("https://example.com/api/admin/verify", {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.8" },
          body: JSON.stringify({ token: "correct-token-123" }),
        }),
      );
      statuses.push(res.status);
    }

    expect(statuses.every((s) => s === 200)).toBe(true);
  });
});
