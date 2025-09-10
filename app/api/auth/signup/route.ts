import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, sessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!name || !email || !password || password.length < 6) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const password_hash = await hashPassword(password);
    const user = await prisma.user.create({ data: { name, email, password_hash, approved: false } });

    // Optionally issue a session so user can see their status
    const token = await createSessionToken({ sub: user.id, email: user.email, name: user.name, approved: user.approved, is_admin: user.is_admin });
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, approved: user.approved } });
    res.cookies.set(sessionCookie.name, token, sessionCookie.options);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", message: String(e?.message ?? e) }, { status: 500 });
  }
}
