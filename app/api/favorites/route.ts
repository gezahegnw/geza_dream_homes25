import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionCookie, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Require authenticated user
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookie.name)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await verifySessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user's favorites
    const favorites = await prisma.favorite.findMany({
      where: { user_id: user.sub },
      orderBy: { created_at: "desc" }
    });

    return NextResponse.json({ favorites });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to fetch favorites", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Require authenticated user
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookie.name)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await verifySessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { property_id } = await req.json();
    if (!property_id) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
    }

    // Create or toggle favorite
    const existing = await prisma.favorite.findUnique({
      where: {
        user_id_property_id: {
          user_id: user.sub,
          property_id: String(property_id)
        }
      }
    });

    if (existing) {
      // Remove favorite
      await prisma.favorite.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ favorited: false });
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          user_id: user.sub,
          property_id: String(property_id)
        }
      });
      return NextResponse.json({ favorited: true });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to update favorite", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
