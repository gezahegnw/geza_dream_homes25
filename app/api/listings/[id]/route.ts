import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchListings } from "@/lib/listings";
import { sessionCookie, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Simple in-memory cache for geocoded ZIP lookups during server uptime
const geoZipCache = new Map<string, string>();

async function geocodeZip(addressLine: string, city?: string, state?: string): Promise<string | undefined> {
  try {
    const key = [addressLine, city, state].filter(Boolean).join(", ");
    if (geoZipCache.has(key)) return geoZipCache.get(key);

    const q = [addressLine, city, state].filter(Boolean).join(", ");
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        // Nominatim requires a descriptive User-Agent
        "User-Agent": "GezaDreamHomes/1.0 (gezarealesteteagent@gmail.com)",
      },
      // Avoid caching at edge
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    const data: any[] = await res.json();
    const zip = data?.[0]?.address?.postcode as string | undefined;
    if (zip) geoZipCache.set(key, zip);
    return zip;
  } catch {
    return undefined;
  }
}

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

    // Enrich with ZIP via geocoding if missing
    if (!property.zipCode) {
      const zip = await geocodeZip(property.address, property.city, property.state);
      if (zip) {
        property = { ...property, zipCode: zip };
      }
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
