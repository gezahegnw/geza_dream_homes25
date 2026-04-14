import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, sessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookie.name)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await prisma.notificationPreference.findUnique({
      where: { user_id: session.sub },
    });

    // Return defaults if no preferences exist yet
    if (!preferences) {
      return NextResponse.json({
        email_new_listings: true,
        email_price_drops: true,
        email_status_changes: true,
        price_drop_threshold: 5,
        digest_mode: "immediate",
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookie.name)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate data
    if (data.price_drop_threshold !== undefined) {
      const threshold = parseInt(data.price_drop_threshold);
      if (threshold < 1 || threshold > 50) {
        return NextResponse.json(
          { error: "Price drop threshold must be between 1 and 50" },
          { status: 400 }
        );
      }
    }

    if (data.digest_mode !== undefined) {
      const validModes = ["immediate", "daily", "weekly"];
      if (!validModes.includes(data.digest_mode)) {
        return NextResponse.json(
          { error: "Invalid digest mode" },
          { status: 400 }
        );
      }
    }

    const preferences = await prisma.notificationPreference.upsert({
      where: { user_id: session.sub },
      create: {
        user_id: session.sub,
        email_new_listings: data.email_new_listings ?? true,
        email_price_drops: data.email_price_drops ?? true,
        email_status_changes: data.email_status_changes ?? true,
        price_drop_threshold: data.price_drop_threshold ?? 5,
        digest_mode: data.digest_mode ?? "immediate",
      },
      update: {
        ...(data.email_new_listings !== undefined && {
          email_new_listings: data.email_new_listings,
        }),
        ...(data.email_price_drops !== undefined && {
          email_price_drops: data.email_price_drops,
        }),
        ...(data.email_status_changes !== undefined && {
          email_status_changes: data.email_status_changes,
        }),
        ...(data.price_drop_threshold !== undefined && {
          price_drop_threshold: parseInt(data.price_drop_threshold),
        }),
        ...(data.digest_mode !== undefined && {
          digest_mode: data.digest_mode,
        }),
      },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
