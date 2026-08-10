import { NextResponse } from "next/server";
import { getAdminTokenFromRequest, isAdminTokenValid, unauthorized } from "@/lib/admin-token";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// A single shared passcode is guessable, so the endpoint that confirms it needs
// a much tighter budget than a normal login.
const VERIFY_LIMIT = { limit: 5, windowMs: 15 * 60_000 };

export async function POST(req: Request) {
  const check = rateLimit(`admin-verify:ip:${getClientIp(req)}`, VERIFY_LIMIT);
  if (!check.allowed) return tooManyRequests(check.retryAfterSeconds);

  let token: string | null = getAdminTokenFromRequest(req);
  if (!token) {
    const body = await req.json().catch(() => null);
    if (body && typeof body.token === "string") token = body.token;
  }
  if (!isAdminTokenValid(token)) return unauthorized();
  return NextResponse.json({ ok: true });
}
