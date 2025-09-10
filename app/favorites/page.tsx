"use client";
import { useEffect, useState } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

type Listing = {
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
};

type Favorite = {
  id: string;
  property_id: string;
  created_at: string;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/favorites');
      if (!res.ok) {
        throw new Error('Failed to fetch favorites');
      }
      const data = await res.json();
      setFavorites(data.favorites || []);
      
      // Fetch full listing details for each favorite
      if (data.favorites && data.favorites.length > 0) {
        const listingPromises = data.favorites.map(async (favorite: Favorite) => {
          try {
            const listingRes = await fetch(`/api/listings?id=${favorite.property_id}`);
            if (listingRes.ok) {
              const listingData = await listingRes.json();
              return listingData.listing;
            }
          } catch (error) {
            console.error(`Failed to fetch listing ${favorite.property_id}:`, error);
          }
          return null;
        });
        
        const listingResults = await Promise.all(listingPromises);
        setListings(listingResults.filter(Boolean));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (propertyId: string) => {
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId })
      });
      
      if (res.ok) {
        setFavorites(prev => prev.filter(fav => fav.property_id !== propertyId));
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">My Favorites</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 animate-pulse bg-white">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded" />
              <div className="mt-4 h-4 bg-gray-200 rounded w-3/4" />
              <div className="mt-2 h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">My Favorites</h1>
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">My Favorites</h1>
      
      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <HeartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No favorites yet</h2>
          <p className="text-gray-500 mb-4">Start browsing properties and click the heart icon to save your favorites!</p>
          <a href="/listings" className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">
            Browse Properties
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">You have {favorites.length} saved properties</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => {
              const listing = listings.find(l => l?.id === favorite.property_id);
              
              return (
                <div key={favorite.id} className="rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
                  {listing ? (
                    <a href={`/listings/${listing.id}`} className="block">
                      <div className="relative">
                        {listing.photo && (
                          <img
                            src={listing.photo}
                            alt={listing.address}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFavorite(favorite.property_id);
                          }}
                          className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                        >
                          <HeartSolidIcon className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{listing.address}</h3>
                        {listing.city && listing.state && (
                          <p className="text-gray-600 mb-2">{listing.city}, {listing.state}</p>
                        )}
                        {listing.price && (
                          <p className="text-xl font-bold text-green-600 mb-2">
                            ${listing.price.toLocaleString()}
                          </p>
                        )}
                        <div className="flex gap-4 text-sm text-gray-600">
                          {listing.beds && <span>{listing.beds} beds</span>}
                          {listing.baths && <span>{listing.baths} baths</span>}
                          {listing.sqft && <span>{listing.sqft.toLocaleString()} sqft</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Saved on {new Date(favorite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </a>
                  ) : (
                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">Property ID: {favorite.property_id}</p>
                          <p className="text-sm text-gray-500">
                            Saved on {new Date(favorite.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-amber-600 mt-1">Property details unavailable</p>
                        </div>
                        <button
                          onClick={() => removeFavorite(favorite.property_id)}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <HeartSolidIcon className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
