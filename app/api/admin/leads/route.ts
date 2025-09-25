import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";

function ok<T>(data: T, headers?: HeadersInit) {
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json", ...(headers || {}) },
  });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkToken(req: Request): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return true; // if not set, allow for local dev
  const h = req.headers.get("x-admin-token") || new URL(req.url).searchParams.get("token");
  return h === token;
}

export async function GET(req: Request) {
  try {
    if (!checkToken(req)) return unauthorized();

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "json").toLowerCase();
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10) || 20));

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { message: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    if (format === "csv") {
      const header = [
        "id",
        "created_at",
        "name",
        "email",
        "phone",
        "intent",
        "timeframe",
        "budget",
        "message",
        "user_agent",
        "ip",
        "source",
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "referrer",
        "landing_page",
      ];
      const rows = (leads as any[]).map((l) =>
        [
          l.id,
          new Date(l.created_at).toISOString(),
          l.name,
          l.email,
          l.phone ?? "",
          l.intent ?? "",
          l.timeframe ?? "",
          l.budget ?? "",
          String(l.message ?? "").replace(/\n/g, " ").replace(/\r/g, " "),
          l.user_agent ?? "",
          l.ip ?? "",
          l.source ?? "",
          l.utm_source ?? "",
          l.utm_medium ?? "",
          l.utm_campaign ?? "",
          l.utm_term ?? "",
          l.utm_content ?? "",
          l.referrer ?? "",
          l.landing_page ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
      const csv = [header.join(","), ...rows].join("\n");
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename=leads-${Date.now()}.csv`,
        },
      });
    }

    return ok({
      page,
      pageSize,
      total,
      pages: Math.ceil(total / pageSize),
      leads,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Server error", message: String(e?.message ?? e) }, { status: 500 });
  }
}
