import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchListings } from "@/lib/listings";
import { sessionCookie, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeZip } from "@/lib/geo";

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
    
    // Fetch a larger set of listings and find the one that matches by id
    const allListings = await fetchListings({ limit: 200 });
    let property = allListings.find(listing => listing.id === propertyId);
    
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Debug: Log the original property data
    console.log('DEBUG: Original property data:', JSON.stringify(property, null, 2));

    // Enrich with ZIP - first try to extract from Redfin URL, then fallback to geocoding
    if (!property.zipCode) {
      let zip: string | undefined;
      
      // Try to extract zip from Redfin URL first (more accurate)
      if (property.url) {
        const urlMatch = property.url.match(/\/([0-9]{5})\/home\//);
        if (urlMatch) {
          zip = urlMatch[1];
          console.log('DEBUG: Extracted zipCode from Redfin URL:', zip);
        }
      }
      
      // Fallback to geocoding if URL extraction failed
      if (!zip) {
        console.log('DEBUG: No zipCode found in URL, attempting geocoding for:', property.address, property.city, property.state);
        zip = await geocodeZip(property.address, property.city, property.state);
        console.log('DEBUG: Geocoding result:', zip);
      }
      
      if (zip) {
        property = { ...property, zipCode: zip };
        console.log('DEBUG: Property enriched with zipCode:', zip);
      }
    } else {
      console.log('DEBUG: Property already has zipCode:', property.zipCode);
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
