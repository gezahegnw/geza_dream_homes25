"use client";

import { useEffect, useState } from "react";
import { 
  GraduationCap, 
  Shield, 
  Coffee, 
  ShoppingBag, 
  Utensils, 
  Trees,
  Footprints,
  Loader2,
  MapPin,
  Star,
  AlertCircle
} from "lucide-react";

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

interface NeighborhoodInsightsProps {
  propertyId: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export default function NeighborhoodInsights({ 
  propertyId, 
  address,
  lat,
  lng 
}: NeighborhoodInsightsProps) {
  const [data, setData] = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "schools" | "amenities">("overview");

  useEffect(() => {
    fetchNeighborhoodData();
  }, [propertyId, lat, lng]);

  const fetchNeighborhoodData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (propertyId) params.append("propertyId", propertyId);
      if (address) params.append("address", address);
      if (lat) params.append("lat", lat.toString());
      if (lng) params.append("lng", lng.toString());

      const response = await fetch(`/api/neighborhood?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch neighborhood data");
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError("Unable to load neighborhood data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center text-amber-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>{error || "No neighborhood data available"}</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 bg-green-50";
    if (score >= 50) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "Very Walkable";
    if (score >= 50) return "Somewhat Walkable";
    return "Car Dependent";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <MapPin className="w-6 h-6 mr-2 text-brand" />
        Neighborhood Insights
      </h2>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${getScoreColor(data.walkScore)}`}>
          <div className="flex items-center mb-2">
            <Footprints className="w-5 h-5 mr-2" />
            <span className="font-semibold">Walk Score</span>
          </div>
          <div className="text-3xl font-bold">{data.walkScore}</div>
          <div className="text-sm">{getScoreLabel(data.walkScore)}</div>
        </div>

        <div className={`p-4 rounded-lg ${getScoreColor(data.transitScore)}`}>
          <div className="flex items-center mb-2">
            <Star className="w-5 h-5 mr-2" />
            <span className="font-semibold">Transit Score</span>
          </div>
          <div className="text-3xl font-bold">{data.transitScore}</div>
          <div className="text-sm">
            {data.transitScore >= 50 ? "Good Transit" : "Limited Transit"}
          </div>
        </div>

        <div className={`p-4 rounded-lg ${getScoreColor(data.bikeScore)}`}>
          <div className="flex items-center mb-2">
            <Trees className="w-5 h-5 mr-2" />
            <span className="font-semibold">Bike Score</span>
          </div>
          <div className="text-3xl font-bold">{data.bikeScore}</div>
          <div className="text-sm">
            {data.bikeScore >= 50 ? "Bike Friendly" : "Not Bikeable"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: "overview", label: "Overview", icon: MapPin },
          { id: "schools", label: "Schools", icon: GraduationCap },
          { id: "amenities", label: "Amenities", icon: Coffee },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? "bg-white text-brand shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Crime Info */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Shield className="w-5 h-5 mr-2 text-brand" />
              <h3 className="font-semibold text-lg">Crime & Safety</h3>
            </div>
            <div className="flex items-center mb-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  data.crime.level === "Low"
                    ? "bg-green-100 text-green-800"
                    : data.crime.level === "Moderate"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {data.crime.level} Crime
              </span>
            </div>
            <p className="text-gray-600 text-sm">{data.crime.description}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Utensils className="w-5 h-5 mr-2 text-brand" />
                <span className="font-medium">Restaurants</span>
              </div>
              <p className="text-2xl font-bold">{data.amenities.restaurants.length}</p>
              <p className="text-sm text-gray-500">within 1 mile</p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <ShoppingBag className="w-5 h-5 mr-2 text-brand" />
                <span className="font-medium">Shopping</span>
              </div>
              <p className="text-2xl font-bold">{data.amenities.shopping.length}</p>
              <p className="text-sm text-gray-500">within 1 mile</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "schools" && (
        <div className="space-y-4">
          {data.schools.map((school, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{school.name}</h3>
                  <p className="text-sm text-gray-500">{school.type} School</p>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-1" />
                  <span className="font-bold">{school.rating}/10</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">{school.distance} away</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "amenities" && (
        <div className="space-y-6">
          {/* Restaurants */}
          {data.amenities.restaurants.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <Utensils className="w-5 h-5 mr-2 text-brand" />
                Restaurants Nearby
              </h3>
              <div className="space-y-2">
                {data.amenities.restaurants.slice(0, 5).map((place, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{place.name}</p>
                      {place.rating && (
                        <p className="text-sm text-gray-500">
                          ⭐ {place.rating} • {place.type}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{place.distance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parks */}
          {data.amenities.parks.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <Trees className="w-5 h-5 mr-2 text-brand" />
                Parks & Recreation
              </h3>
              <div className="space-y-2">
                {data.amenities.parks.slice(0, 5).map((park, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{park.name}</p>
                      <p className="text-sm text-gray-500">{park.type}</p>
                    </div>
                    <span className="text-sm text-gray-600">{park.distance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grocery */}
          {data.amenities.grocery.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2 text-brand" />
                Grocery Stores
              </h3>
              <div className="space-y-2">
                {data.amenities.grocery.slice(0, 5).map((store, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <p className="text-sm text-gray-500">{store.type}</p>
                    </div>
                    <span className="text-sm text-gray-600">{store.distance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6 text-center">
        Neighborhood data is for informational purposes only. Please verify all information independently.
      </p>
    </div>
  );
}
