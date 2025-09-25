import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkToken(req: Request): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return true; // allow in dev if not set
  const header = req.headers.get("x-admin-token") || new URL(req.url).searchParams.get("token");
  return header === token;
}
function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  try {
    if (!checkToken(req)) return unauthorized();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const approvedParam = searchParams.get("approved"); // all|true|false
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }
    if (approvedParam === "true") where.approved = true;
    if (approvedParam === "false") where.approved = false;

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, created_at: true, name: true, email: true, approved: true, is_admin: true },
      }),
    ]);

    return NextResponse.json({ page, pageSize, total, pages: Math.ceil(total / pageSize) || 1, users: items });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Server error", message: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!checkToken(req)) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    const hasApproved = Object.prototype.hasOwnProperty.call(body, "approved");
    const approved = Boolean(body?.approved);
    const hasIsAdmin = Object.prototype.hasOwnProperty.call(body, "is_admin");
    const is_admin = Boolean(body?.is_admin);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const data: any = {};
    if (hasApproved) data.approved = approved;
    if (hasIsAdmin) data.is_admin = is_admin;
    if (Object.keys(data).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    const updated = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ ok: true, user: { id: updated.id, approved: updated.approved, is_admin: updated.is_admin } });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Server error", message: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!checkToken(req)) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Server error", message: String(e?.message ?? e) }, { status: 500 });
  }
}
