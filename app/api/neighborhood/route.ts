import { NextResponse } from "next/server";
import { fetchListingById } from "@/lib/listings";

// Types for neighborhood data
interface Amenity {
  name: string;
  type: string;
  rating?: number;
  distance: string;
  address?: string;
}

interface School {
  name: string;
  type: "Elementary" | "Middle" | "High";
  rating: number;
  distance: string;
}

interface NeighborhoodData {
  walkScore: number;
  transitScore: number;
  bikeScore: number;
  schools: School[];
  amenities: {
    restaurants: Amenity[];
    shopping: Amenity[];
    parks: Amenity[];
    grocery: Amenity[];
  };
  crime: {
    level: "Low" | "Moderate" | "High";
    description: string;
  };
}

// Demo neighborhood data generator based on location
function generateNeighborhoodData(address?: string, city?: string): NeighborhoodData {
  // Generate consistent pseudo-random scores based on address/city
  const seed = (address || city || "default").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const walkScore = 30 + (seed % 70); // 30-100
  const transitScore = 20 + (seed % 80); // 20-100
  const bikeScore = 25 + (seed % 75); // 25-100

  // Generate schools based on area quality (correlated with walk score)
  const baseSchoolRating = Math.floor(walkScore / 10);
  const schools: School[] = [
    {
      name: `${city || "Local"} Elementary School`,
      type: "Elementary",
      rating: Math.max(3, Math.min(10, baseSchoolRating + (seed % 3) - 1)),
      distance: "0.4 miles",
    },
    {
      name: `${city || "Nearby"} Middle School`,
      type: "Middle",
      rating: Math.max(3, Math.min(10, baseSchoolRating + (seed % 4) - 2)),
      distance: "0.8 miles",
    },
    {
      name: `${city || "Area"} High School`,
      type: "High",
      rating: Math.max(3, Math.min(10, baseSchoolRating + (seed % 3) - 1)),
      distance: "1.2 miles",
    },
  ];

  // Crime level based on walkability (walkable areas often have less crime)
  const crimeLevel: "Low" | "Moderate" | "High" = 
    walkScore > 70 ? "Low" : walkScore > 45 ? "Moderate" : "High";
  
  const crimeDescription = {
    Low: "This area has lower crime rates compared to the city average. Residents report feeling safe walking during both day and night.",
    Moderate: "Crime rates in this area are around the city average. Standard safety precautions are recommended.",
    High: "This area has higher crime rates than the city average. Residents should take additional safety precautions, especially at night.",
  }[crimeLevel];

  // Generate amenities
  const restaurants: Amenity[] = [
    { name: "Local Bistro", type: "American", rating: 4.2, distance: "0.2 mi" },
    { name: "Pizza Palace", type: "Pizza", rating: 4.0, distance: "0.3 mi" },
    { name: "Sushi Garden", type: "Japanese", rating: 4.5, distance: "0.5 mi" },
    { name: "Cafe Corner", type: "Coffee & Breakfast", rating: 4.3, distance: "0.4 mi" },
    { name: "BBQ Smokehouse", type: "Barbecue", rating: 4.4, distance: "0.6 mi" },
    { name: "Thai Spice", type: "Thai", rating: 4.1, distance: "0.7 mi" },
  ];

  const shopping: Amenity[] = [
    { name: "Main Street Mall", type: "Shopping Center", distance: "0.8 mi" },
    { name: "Fashion Plaza", type: "Department Store", distance: "1.1 mi" },
    { name: "Boutique Row", type: "Specialty Shops", distance: "0.5 mi" },
    { name: "Electronics Hub", type: "Electronics", distance: "1.3 mi" },
  ];

  const parks: Amenity[] = [
    { name: "Central Park", type: "City Park", distance: "0.3 mi" },
    { name: "Community Playground", type: "Playground", distance: "0.6 mi" },
    { name: "Riverside Trail", type: "Trail", distance: "0.9 mi" },
    { name: "Sports Complex", type: "Sports Fields", distance: "1.2 mi" },
  ];

  const grocery: Amenity[] = [
    { name: "Fresh Market", type: "Grocery", distance: "0.4 mi" },
    { name: "Organic Foods Co", type: "Organic Grocery", distance: "0.7 mi" },
    { name: "Discount Grocer", type: "Supermarket", distance: "1.0 mi" },
  ];

  return {
    walkScore,
    transitScore,
    bikeScore,
    schools,
    amenities: {
      restaurants: walkScore > 50 ? restaurants : restaurants.slice(0, 3),
      shopping: walkScore > 40 ? shopping : shopping.slice(0, 2),
      parks: bikeScore > 40 ? parks : parks.slice(0, 2),
      grocery,
    },
    crime: {
      level: crimeLevel,
      description: crimeDescription,
    },
  };
}

// Fetch real amenities from Google Places API (if key is available)
async function fetchGooglePlacesAmenities(lat: number, lng: number): Promise<Amenity[] | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    // Search for nearby amenities
    const types = ["restaurant", "park", "shopping_mall", "grocery_or_supermarket"];
    const amenities: Amenity[] = [];

    for (const type of types.slice(0, 2)) { // Limit to 2 types to avoid rate limits
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1600&type=${type}&key=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      if (data.results) {
        data.results.slice(0, 5).forEach((place: any) => {
          const distance = place.geometry?.location 
            ? calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng)
            : "~0.5 mi";
          
          amenities.push({
            name: place.name,
            type: type.replace(/_/g, " "),
            rating: place.rating,
            distance,
            address: place.vicinity,
          });
        });
      }
    }

    return amenities;
  } catch (error) {
    console.error("Error fetching Google Places:", error);
    return null;
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return `${distance.toFixed(1)} mi`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const address = searchParams.get("address");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  try {
    let propertyAddress = address;
    let propertyCity: string | undefined;
    let propertyLat = lat ? parseFloat(lat) : undefined;
    let propertyLng = lng ? parseFloat(lng) : undefined;

    // If propertyId provided, fetch property details
    if (propertyId) {
      const listing = await fetchListingById(propertyId);
      if (listing) {
        propertyAddress = listing.address;
        propertyCity = listing.city;
        propertyLat = listing.lat;
        propertyLng = listing.lng;
      }
    }

    // Try to get real data from Google Places if coordinates available
    let googleAmenities: Amenity[] | null = null;
    if (propertyLat && propertyLng) {
      googleAmenities = await fetchGooglePlacesAmenities(propertyLat, propertyLng);
    }

    // Generate base neighborhood data
    const data = generateNeighborhoodData(propertyAddress || undefined, propertyCity || undefined);

    // Enhance with real amenities if available
    if (googleAmenities && googleAmenities.length > 0) {
      data.amenities.restaurants = googleAmenities.filter(a => 
        a.type.toLowerCase().includes("restaurant") || 
        a.type.toLowerCase().includes("food")
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching neighborhood data:", error);
    return NextResponse.json(
      { error: "Failed to fetch neighborhood data" },
      { status: 500 }
    );
  }
}
