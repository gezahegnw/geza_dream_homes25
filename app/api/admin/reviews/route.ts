import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkToken(req: Request): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return true; // allow in local if not set
  const h = req.headers.get("x-admin-token") || new URL(req.url).searchParams.get("token");
  return h === token;
}

// GET /api/admin/reviews?q=&page=1&pageSize=20&approved=all|true|false
export async function GET(req: Request) {
  try {
    if (!checkToken(req)) return unauthorized();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const approvedParam = (searchParams.get("approved") || "all").toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10) || 20));

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
        { title: { contains: q, mode: "insensitive" as const } },
        { content: { contains: q, mode: "insensitive" as const } },
      ];
    }
    if (approvedParam === "true") where.approved = true;
    else if (approvedParam === "false") where.approved = false;

    const [total, items] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      page,
      pageSize,
      total,
      pages: Math.ceil(total / pageSize) || 1,
      reviews: items,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Server error", message: String(e?.message ?? e) }, { status: 500 });
  }
}

// PATCH /api/admin/reviews -> body: { id: string, approved: boolean }
export async function PATCH(req: Request) {
  try {
    if (!checkToken(req)) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    const approved = Boolean(body?.approved);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const updated = await prisma.review.update({ where: { id }, data: { approved } });
    return NextResponse.json({ ok: true, review: updated });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Server error", message: String(e?.message ?? e) }, { status: 500 });
  }
}

// DELETE /api/admin/reviews?id=...
export async function DELETE(req: Request) {
  try {
    if (!checkToken(req)) return unauthorized();
    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get("id") || "").trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Server error", message: String(e?.message ?? e) }, { status: 500 });
  }
}
