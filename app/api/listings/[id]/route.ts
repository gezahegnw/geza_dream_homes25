import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchListingById } from "@/lib/listings";
import { sessionCookie, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// --- TEMPORARY DEBUGGING ROUTE --- //
// This route will be restored after inspecting the raw API data.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const propertyId = params.id;
  const key = process.env.RAPIDAPI_REDFIN_KEY;
  const host = process.env.RAPIDAPI_REDFIN_HOST || "redfin-com-data.p.rapidapi.com";

  if (!key) {
    return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
  }

    // Using the address to query the search endpoint, as the detail endpoint is invalid.
  const location = "24268 W 111th Pl, Olathe, KS 66061"; // Address from user-provided link
  const url = `https://${host}/property/search?location=${encodeURIComponent(location)}`;

  try {
    const apiRes = await fetch(url, { headers: { "x-rapidapi-key": key, "x-rapidapi-host": host } });
    if (!apiRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from Redfin API", status: apiRes.status, body: await apiRes.text() },
        { status: 502 }
      );
    }
    const rawData = await apiRes.json();
    // Return the raw, unprocessed data directly for inspection
    return NextResponse.json(rawData);
  } catch (e: any) {
    return NextResponse.json(
      { error: "An unexpected error occurred", message: e.message },
      { status: 500 }
    );
  }
}
