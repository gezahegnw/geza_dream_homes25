import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchListings, fetchListingsDebug } from "@/lib/listings";
import { sessionCookie, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Require authenticated and approved user
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookie.name)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifySessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Always check live approval status from DB so approval updates take effect without requiring re-login
    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!dbUser.approved) return NextResponse.json({ error: "Forbidden: account pending approval" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    
    // Check if requesting a specific listing by ID
    const id = searchParams.get("id");
    if (id) {
      // Fetch all listings and find the one with matching ID
      const allListings = await fetchListings({ limit: 100 });
      const listing = allListings.find((l: any) => l.id === id || l.id === parseInt(id));
      
      if (listing) {
        return NextResponse.json({ listing });
      } else {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      }
    }
    
    const q = searchParams.get("q") || undefined;
    const city = searchParams.get("city") || undefined;
    const state_code = searchParams.get("state_code") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 12;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const offset = (page - 1) * limit;

    const provider = process.env.LISTINGS_PROVIDER || "mock";
    const debugFlag = new URL(req.url).searchParams.get("debug") === "1";
    if (debugFlag) {
      const { items, debug } = await fetchListingsDebug({ q, city, state_code, limit, offset, page });
      return NextResponse.json({ listings: items, provider, debug });
    }
    try {
      const listings = await fetchListings({ q, city, state_code, limit, offset, page });
      return NextResponse.json({ listings, provider });
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      if (msg === 'RATE_LIMITED') {
        return NextResponse.json({ error: 'Provider temporarily rate-limited. Please try again shortly.' }, { status: 429 });
      }
      throw err;
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to fetch listings", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
