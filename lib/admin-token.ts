import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

export function getAdminTokenFromRequest(req: Request): string | null {
  const header = req.headers.get("x-admin-token");
  if (header) return header;
  try {
    return new URL(req.url).searchParams.get("token");
  } catch {
    return null;
  }
}

export function isAdminTokenValid(provided: string | null | undefined): boolean {
  const expected = process.env.ADMIN_TOKEN;
  // Without a configured token there is nothing to verify against: allow only
  // outside production so local development keeps working.
  if (!expected) return process.env.NODE_ENV !== "production";
  if (!provided) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function checkAdminToken(req: Request): boolean {
  return isAdminTokenValid(getAdminTokenFromRequest(req));
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
