import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchListingById } from "@/lib/listings";

interface PricePoint {
  price: number;
  date: string;
  status?: string;
}

interface PriceStats {
  currentPrice: number;
  originalPrice: number;
  highestPrice: number;
  lowestPrice: number;
  averagePrice: number;
  totalPriceDrops: number;
  totalPriceIncreases: number;
  daysOnMarket: number;
  priceChangePercent: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");

  if (!propertyId) {
    return NextResponse.json(
      { error: "Property ID is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch tracked history from database
    const trackedHistory = await prisma.propertyTracking.findMany({
      where: { 
        property_id: propertyId,
        price: { not: null }
      },
      orderBy: { tracked_at: "asc" },
    });

    // Get current listing data
    const currentListing = await fetchListingById(propertyId);
    const currentPrice = currentListing?.price;

    // If no history in database, generate some demo data for testing
    let history: PricePoint[] = [];
    
    if (trackedHistory.length === 0 && currentPrice) {
      // Generate realistic demo price history
      const today = new Date();
      const basePrice = currentPrice;
      
      // Create 4-8 data points over the past 60 days
      const numPoints = 4 + (propertyId.charCodeAt(0) % 5); // 4-8 points
      const daysBetween = Math.floor(60 / numPoints);
      
      for (let i = numPoints - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * daysBetween));
        
        // Simulate price drops over time
        let price = basePrice;
        if (i < numPoints - 1) {
          // Add some randomness to make it look realistic
          const dropPercent = 0.02 + (Math.random() * 0.08); // 2-10% drops
          price = Math.round(basePrice * (1 + (dropPercent * (numPoints - 1 - i) / 2)));
        }
        
        history.push({
          price,
          date: date.toISOString(),
          status: i === 0 ? "Active" : undefined,
        });
      }
    } else {
      // Use real tracked data
      history = trackedHistory.map((track: { price: number | null; tracked_at: Date; status: string | null }) => ({
        price: track.price!,
        date: track.tracked_at.toISOString(),
        status: track.status || undefined,
      }));
      
      // Add current price if different from last tracked
      if (currentPrice && history.length > 0) {
        const lastPrice = history[history.length - 1].price;
        if (lastPrice !== currentPrice) {
          history.push({
            price: currentPrice,
            date: new Date().toISOString(),
            status: currentListing?.status || "Active",
          });
        }
      }
    }

    // Calculate statistics
    const stats: PriceStats | null = history.length > 0 ? {
      currentPrice: history[history.length - 1].price,
      originalPrice: history[0].price,
      highestPrice: Math.max(...history.map(h => h.price)),
      lowestPrice: Math.min(...history.map(h => h.price)),
      averagePrice: Math.round(history.reduce((sum, h) => sum + h.price, 0) / history.length),
      totalPriceDrops: 0,
      totalPriceIncreases: 0,
      daysOnMarket: 0,
      priceChangePercent: 0,
    } : null;

    if (stats) {
      // Count price changes
      for (let i = 1; i < history.length; i++) {
        const change = history[i].price - history[i - 1].price;
        if (change < 0) stats.totalPriceDrops++;
        if (change > 0) stats.totalPriceIncreases++;
      }

      // Calculate days on market
      const firstDate = new Date(history[0].date);
      const lastDate = new Date(history[history.length - 1].date);
      stats.daysOnMarket = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate total price change percentage
      const totalChange = history[history.length - 1].price - history[0].price;
      stats.priceChangePercent = (totalChange / history[0].price) * 100;
    }

    return NextResponse.json({
      propertyId,
      history,
      stats,
      dataSource: trackedHistory.length > 0 ? "tracked" : "demo",
    });
  } catch (error) {
    console.error("Error fetching price history:", error);
    return NextResponse.json(
      { error: "Failed to fetch price history" },
      { status: 500 }
    );
  }
}
