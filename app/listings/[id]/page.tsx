"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

type PropertyDetails = {
  id: string;
  address: string;
  city?: string;
  state?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  photo?: string;
  url?: string;
  isFavorited?: boolean;
};

export default function PropertyDetailPage() {
  const params = useParams();
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

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
          // Redirect to login page if unauthorized
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
      setIsFavorited(data.property.isFavorited || false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!property) return;
    
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: property.id })
      });
      
      if (res.ok) {
        const { favorited } = await res.json();
        setIsFavorited(favorited);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg mb-8"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <a 
            href="/listings" 
            className="inline-flex items-center bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Listings
          </a>
        </div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Back button */}
      <div className="mb-8">
        <a 
          href="/listings" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Listings
        </a>
      </div>

      {/* Property header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.address}</h1>
          <p className="text-lg text-gray-600">{property.city}, {property.state}</p>
        </div>
        <button
          onClick={toggleFavorite}
          className="p-3 rounded-full bg-white border-2 border-gray-200 hover:border-red-300 transition-colors"
        >
          {isFavorited ? (
            <HeartSolidIcon className="w-6 h-6 text-red-500" />
          ) : (
            <HeartIcon className="w-6 h-6 text-gray-600 hover:text-red-500" />
          )}
        </button>
      </div>

      {/* Property image */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden mb-8">
        {property.photo ? (
          <img 
            src={property.photo} 
            alt={property.address} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">No image available</span>
          </div>
        )}
      </div>

      {/* Property details */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Property Details</h2>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Price</span>
              <span className="text-lg font-bold">
                {property.price ? `$${property.price.toLocaleString()}` : 'Price not available'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Bedrooms</span>
              <span>{property.beds || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Bathrooms</span>
              <span>{property.baths || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Square Feet</span>
              <span>{property.sqft ? `${property.sqft.toLocaleString()} sqft` : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Gezahegn Worku</h3>
            <p className="text-gray-600 mb-4">Your trusted RE/MAX Beyond Realtor</p>
            <div className="space-y-2">
              <p className="flex items-center">
                <span className="font-medium mr-2">Phone:</span>
                <a href="tel:+19134078620" className="text-blue-600 hover:underline">
                  (913) 407-8620
                </a>
              </p>
              <p className="flex items-center">
                <span className="font-medium mr-2">P Email:</span>
                <a href="mailto:gezarealesteteagent@gmail.com" className="text-blue-600 hover:underline">
                  gezarealesteteagent@gmail.com
                </a>
              </p>
              <p className="flex items-center">
                <span className="font-medium mr-2">W Email:</span>
                <a href="mailto:gworku@remax.net" className="text-blue-600 hover:underline">
                  gworku@remax.net
                </a>
              </p>
            </div>
            <div className="mt-6">
              <a 
                href="/contact" 
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block text-center"
              >
                Schedule a Viewing
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* External link */}
      {property.url && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">View more details on the original listing:</p>
          <a 
            href={property.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            View on Redfin →
          </a>
        </div>
      )}
    </div>
  );
}
