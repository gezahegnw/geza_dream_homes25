"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type PropertyDetails = {
  id: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  photos?: string[];
  description?: string;
  status?: string;
  propertyType?: string;
  yearBuilt?: number;
  pricePerSqft?: number;
  hoaDues?: number;
  lotSize?: number;
  garage?: number;
  url?: string;
  isFavorited?: boolean;
};

export default function PropertyDetailPage() {
  const params = useParams();
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchPropertyDetails(params.id as string);
    }
  }, [params.id]);

  const fetchPropertyDetails = async (propertyId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/listings/${propertyId}`);
      
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/login?redirect=/listings/${propertyId}`;
          return;
        }
        if (res.status === 404) {
          throw new Error('Property not found');
        }
        throw new Error('Failed to fetch property details');
      }
      
      const data = await res.json();
      setProperty(data.property);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading property details...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
        <p className="mb-4">{error}</p>
        <a href="/listings" className="text-blue-600 hover:underline">← Back to Listings</a>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <a href="/listings" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Listings
      </a>
      
      <h1 className="text-3xl font-bold mb-2">{property.address}</h1>
      <p className="text-lg text-gray-600 mb-4">
        {property.city}, {property.state} {property.zipCode}
      </p>
      
      <div className="mb-8">
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
          {property.status || 'Active'}
        </span>
      </div>

      {property.photos && property.photos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Photos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {property.photos.map((photo, index) => (
              <img 
                key={index}
                src={photo}
                alt={`Property photo ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div>
          <span className="text-sm text-gray-500">Price</span>
          <p className="text-lg font-semibold">
            {property.price ? `$${property.price.toLocaleString()}` : 'N/A'}
          </p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Bedrooms</span>
          <p className="text-lg font-semibold">{property.beds || 'N/A'}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Bathrooms</span>
          <p className="text-lg font-semibold">{property.baths || 'N/A'}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Square Feet</span>
          <p className="text-lg font-semibold">
            {property.sqft ? `${property.sqft.toLocaleString()} sq ft` : 'N/A'}
          </p>
        </div>
        {property.propertyType && (
          <div>
            <span className="text-sm text-gray-500">Property Type</span>
            <p className="text-lg font-semibold">{property.propertyType}</p>
          </div>
        )}
        {property.yearBuilt && (
          <div>
            <span className="text-sm text-gray-500">Year Built</span>
            <p className="text-lg font-semibold">{property.yearBuilt}</p>
          </div>
        )}
      </div>

      {property.description && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Description</h2>
          <p className="text-gray-700">{property.description}</p>
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
        <p className="text-gray-700 mb-4">
          Interested in this property? Contact us for more details.
        </p>
        <a 
          href="/contact" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          Contact Agent
        </a>
      </div>
    </div>
  );
}