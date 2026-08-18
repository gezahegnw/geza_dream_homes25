import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, sessionCookie } from "@/lib/auth";
import {
  checkRateLimit,
  clearRateLimit,
  getClientIp,
  recordFailure,
  tooManyRequests,
} from "@/lib/rate-limit";

const IP_LIMIT = { limit: 10, windowMs: 60_000 };
// Tighter per-account cap so one target can't be attacked from many addresses.
const EMAIL_LIMIT = { limit: 5, windowMs: 15 * 60_000 };

export async function POST(req: Request) {
  try {
    const ipKey = `login:ip:${getClientIp(req)}`;
    const ipCheck = checkRateLimit(ipKey, IP_LIMIT);
    if (!ipCheck.allowed) return tooManyRequests(ipCheck.retryAfterSeconds);

    const body = await req.json().catch(() => ({} as any));
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    if (!email || !password) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const emailKey = `login:email:${email}`;
    const emailCheck = checkRateLimit(emailKey, EMAIL_LIMIT);
    if (!emailCheck.allowed) return tooManyRequests(emailCheck.retryAfterSeconds);

    // Only wrong guesses are charged, so signing in repeatedly (several
    // devices, or log out and back in) never locks a user out of their account.
    const rejectCredentials = () => {
      recordFailure(ipKey, IP_LIMIT);
      recordFailure(emailKey, EMAIL_LIMIT);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return rejectCredentials();
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return rejectCredentials();

    clearRateLimit(emailKey);

    const token = await createSessionToken({ sub: user.id, email: user.email, name: user.name, approved: user.approved, is_admin: user.is_admin });
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, approved: user.approved } });
    res.cookies.set(sessionCookie.name, token, sessionCookie.options);
    return res;
  } catch (e: any) {
    console.error("[LOGIN_ERROR]", e);
    return NextResponse.json({ error: "Server error", message: String(e?.message ?? 'An unknown error occurred') }, { status: 500 });
  }
}
