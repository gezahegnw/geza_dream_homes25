import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchListings } from "@/lib/listings";
import { sessionCookie, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Require authenticated and approved user
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookie.name)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifySessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // Always check live approval status from DB
    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!dbUser.approved) return NextResponse.json({ error: "Forbidden: account pending approval" }, { status: 403 });

    const propertyId = params.id;
    
    // For now, we'll fetch all listings and find the one that matches
    // In a real implementation, you'd want a more efficient single-property API call
    const provider = process.env.LISTINGS_PROVIDER || "mock";
    
    // Try to get a larger set of listings to increase chances of finding the property
    const allListings = await fetchListings({ limit: 100 });
    
    const property = allListings.find(listing => listing.id === propertyId);
    
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Check if user has favorited this property
    const favorite = await prisma.favorite.findUnique({
      where: {
        user_id_property_id: {
          user_id: user.sub,
          property_id: propertyId
        }
      }
    });

    return NextResponse.json({ 
      property: {
        ...property,
        isFavorited: !!favorite
      }
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to fetch property details", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
