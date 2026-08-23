import { NextResponse } from "next/server";
import { fetchListingById, fetchListings } from "@/lib/listings";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: propertyId } = await params;
    const q = new URL(req.url).searchParams.get("q")?.trim();

    let property = await fetchListingById(propertyId);

    // Providers only return ids that appear in the result set for a given
    // search, so retry within the search the visitor came from.
    if (!property && q) {
      const scoped = await fetchListings({ q, limit: 200 });
      property = scoped.find((listing) => listing.id === propertyId) ?? null;
    }

    if (!property) {
      const fallback = await fetchListings({ limit: 200 });
      property = fallback.find((listing) => listing.id === propertyId) ?? null;
    }

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({
      property: {
        ...property,
        isFavorited: false
      }
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to fetch property details", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
