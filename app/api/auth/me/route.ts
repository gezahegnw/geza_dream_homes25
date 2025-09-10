import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, sessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookie.name)?.value;
    if (!token) return NextResponse.json({ user: null });
    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ user: null });
    // Pull the latest info from DB so approval status is always current
    const dbUser = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, name: true, email: true, approved: true, is_admin: true },
    });
    if (!dbUser) return NextResponse.json({ user: null });
    return NextResponse.json({ user: dbUser });
  } catch (e: any) {
    return NextResponse.json({ user: null, error: String(e?.message ?? e) }, { status: 500 });
  }
}
