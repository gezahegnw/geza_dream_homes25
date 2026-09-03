import { NextResponse } from "next/server";
import { resolveListing } from "@/lib/resolve-listing";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: propertyId } = await params;
    const q = new URL(req.url).searchParams.get("q")?.trim();

    const property = await resolveListing(propertyId, q);

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
