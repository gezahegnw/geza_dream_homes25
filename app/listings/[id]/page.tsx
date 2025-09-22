"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PropertyDetailPage() {
  const params = useParams();
  const [property, setProperty] = useState<any>(null);
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
        throw new Error('Property not found');
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading property details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="mb-4">{error}</p>
          <a href="/listings" className="text-blue-600 hover:underline">← Back to Listings</a>
        </div>
      </div>
    );
  }

  if (!property) return <div>No property found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <a href="/listings" className="text-blue-600 hover:underline flex items-center">
            ← Back to Listings
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Property Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.address}</h1>
          <p className="text-xl text-gray-600 mb-4">
            {property.city}, {property.state} {property.zipCode}
          </p>
          
          {/* Key Details Row */}
          <div className="flex flex-wrap gap-6 mb-4">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-green-600">
                {property.price ? `$${property.price.toLocaleString()}` : 'Price N/A'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {property.beds || 0} Beds
              </span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {property.baths || 0} Baths
              </span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {property.sqft ? `${property.sqft.toLocaleString()} sq ft` : 'Size N/A'}
              </span>
            </div>
          </div>
          
          <div className="inline-block">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Status: {property.status || 'Active'}
            </span>
          </div>
        </div>

        {/* Photo Gallery */}
        {property.photos && Array.isArray(property.photos) && property.photos.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Property Photos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.photos.map((photo: any, index: number) => {
                if (!photo || typeof photo !== 'string') return null;
                return (
                  <div key={`photo-${index}`} className="rounded-lg overflow-hidden">
                    <img 
                      src={photo}
                      alt={`Property photo ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Property Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Property Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4">Property Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Price</span>
                  <p className="text-lg font-semibold">
                    {property.price ? `$${property.price.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Price per Sq Ft</span>
                  <p className="text-lg font-semibold">
                    {property.pricePerSqft ? `$${property.pricePerSqft}` : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Bedrooms</span>
                  <p className="text-lg font-semibold">{property.beds || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Bathrooms</span>
                  <p className="text-lg font-semibold">{property.baths || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Square Feet</span>
                  <p className="text-lg font-semibold">
                    {property.sqft ? `${property.sqft.toLocaleString()} sq ft` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Lot Size</span>
                  <p className="text-lg font-semibold">
                    {property.lotSize ? `${property.lotSize.toLocaleString()} sq ft` : 'N/A'}
                  </p>
                </div>
              </div>
              
              {property.propertyType && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Property Type</span>
                  <p className="text-lg font-semibold">{property.propertyType}</p>
                </div>
              )}
              
              {property.yearBuilt && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Year Built</span>
                  <p className="text-lg font-semibold">{property.yearBuilt}</p>
                </div>
              )}
              
              {property.garage && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Garage</span>
                  <p className="text-lg font-semibold">{property.garage} spaces</p>
                </div>
              )}
              
              {property.hoaDues && (
                <div>
                  <span className="text-sm font-medium text-gray-500">HOA Dues</span>
                  <p className="text-lg font-semibold">${property.hoaDues}/month</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Description & Contact */}
          <div className="space-y-6">
            {/* Description */}
            {property.description && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Gezahegn Worku</h3>
                  <p className="text-gray-600 mb-4">Your trusted RE/MAX Beyond Realtor</p>
                </div>
                
                <div className="space-y-2">
                  <p className="flex items-center">
                    <span className="font-medium mr-2">Phone:</span>
                    <a href="tel:+19134078620" className="text-blue-600 hover:underline">
                      (913) 407-8620
                    </a>
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium mr-2">Email:</span>
                    <a href="mailto:gezarealesteteagent@gmail.com" className="text-blue-600 hover:underline">
                      gezarealesteteagent@gmail.com
                    </a>
                  </p>
                </div>
                
                <div className="mt-6">
                  <a 
                    href="/contact" 
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block text-center font-medium"
                  >
                    Schedule a Viewing
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}