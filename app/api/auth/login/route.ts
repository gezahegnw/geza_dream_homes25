import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, sessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    if (!email || !password) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    const token = await createSessionToken({ sub: user.id, email: user.email, name: user.name, approved: user.approved, is_admin: user.is_admin });
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, approved: user.approved } });
    res.cookies.set(sessionCookie.name, token, sessionCookie.options);
    return res;
  } catch (e: any) {
    console.error("[LOGIN_ERROR]", e);
    return NextResponse.json({ error: "Server error", message: String(e?.message ?? 'An unknown error occurred') }, { status: 500 });
  }
}
