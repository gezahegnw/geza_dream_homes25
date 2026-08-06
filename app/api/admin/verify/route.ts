import { NextResponse } from "next/server";
import { getAdminTokenFromRequest, isAdminTokenValid, unauthorized } from "@/lib/admin-token";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let token: string | null = getAdminTokenFromRequest(req);
  if (!token) {
    const body = await req.json().catch(() => null);
    if (body && typeof body.token === "string") token = body.token;
  }
  if (!isAdminTokenValid(token)) return unauthorized();
  return NextResponse.json({ ok: true });
}
