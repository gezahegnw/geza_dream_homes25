"use client";
import React, { useEffect, useState } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { FunnelIcon } from "@heroicons/react/24/outline";

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

export default function ListingsPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvedBanner, setApprovedBanner] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [allItems, setAllItems] = useState<Listing[]>([]);
  const [filteredItems, setFilteredItems] = useState<Listing[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minBeds: '',
    maxBeds: '',
    minBaths: '',
    maxBaths: '',
    minSqft: '',
    maxSqft: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const LISTINGS_PER_PAGE = 9;

  // Optional IDX iframe override
  const idxUrl = process.env.NEXT_PUBLIC_IDX_IFRAME_URL;

  const fetchAndSetListings = async (pageNum: number, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(LISTINGS_PER_PAGE),
        page: String(pageNum),
      });
      if (q) {
        params.set("q", q);
      }

      const res = await fetch(`/api/listings?${params.toString()}`, { cache: "no-store" });
      const body = await res.json();

      if (!res.ok) {
        const msg = String(body?.error || body?.message || "Failed to load listings");
        throw new Error(`${res.status}:${msg}`);
      }

      const listings = body.listings || [];
      setAllItems(listings);
      setItems(listings);
      setFilteredItems(listings);
      setProvider(body.provider);
      setHasMore(body.hasMore || false);

      // One-time approved banner logic
      if (pageNum === 1) {
        try {
          const meRes = await fetch(`/api/auth/me`, { cache: "no-store" });
          const meBody = await meRes.json().catch(() => ({}));
          if (meBody?.user?.approved && !localStorage.getItem("approved_notified")) {
            setApprovedBanner(true);
            localStorage.setItem("approved_notified", "1");
          }
        } catch {}
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idxUrl) return;
    fetchAndSetListings(page, query);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idxUrl, page]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (idxUrl) return; // iframe mode
    setPage(1); // Reset to first page on new search
    fetchAndSetListings(1, query);
  }

  const toggleFavorite = async (propertyId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId })
      });
      
      if (res.ok) {
        const { favorited } = await res.json();
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          if (favorited) {
            newFavorites.add(propertyId);
          } else {
            newFavorites.delete(propertyId);
          }
          return newFavorites;
        });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...allItems];

    // Price filters
    if (filters.minPrice) {
      filtered = filtered.filter(item => item.price && item.price >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(item => item.price && item.price <= parseInt(filters.maxPrice));
    }

    // Bedroom filters
    if (filters.minBeds) {
      filtered = filtered.filter(item => item.beds && item.beds >= parseInt(filters.minBeds));
    }
    if (filters.maxBeds) {
      filtered = filtered.filter(item => item.beds && item.beds <= parseInt(filters.maxBeds));
    }

    // Bathroom filters
    if (filters.minBaths) {
      filtered = filtered.filter(item => item.baths && item.baths >= parseInt(filters.minBaths));
    }
    if (filters.maxBaths) {
      filtered = filtered.filter(item => item.baths && item.baths <= parseInt(filters.maxBaths));
    }

    // Square footage filters
    if (filters.minSqft) {
      filtered = filtered.filter(item => item.sqft && item.sqft >= parseInt(filters.minSqft));
    }
    if (filters.maxSqft) {
      filtered = filtered.filter(item => item.sqft && item.sqft <= parseInt(filters.maxSqft));
    }

    setFilteredItems(filtered);
    setItems(filtered.slice(0, LISTINGS_PER_PAGE));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      minBeds: '',
      maxBeds: '',
      minBaths: '',
      maxBaths: '',
      minSqft: '',
      maxSqft: ''
    });
    setFilteredItems(allItems);
    setItems(allItems.slice(0, LISTINGS_PER_PAGE));
    setPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters whenever filter values change
  React.useEffect(() => {
    applyFilters();
  }, [filters, allItems]);

  // Handle pagination for filtered results
  React.useEffect(() => {
    const startIndex = (page - 1) * LISTINGS_PER_PAGE;
    const endIndex = startIndex + LISTINGS_PER_PAGE;
    setItems(filteredItems.slice(startIndex, endIndex));
    setHasMore(endIndex < filteredItems.length);
  }, [page, filteredItems]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 space-y-6">
      <h1 className="text-3xl font-bold">Property Listings</h1>

      {idxUrl ? (
        <div className="w-full">
          <iframe src={idxUrl} title="IDX Listings" className="w-full min-h-[70vh] border rounded" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Search location (e.g., Overland Park, KS)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 rounded border px-3 py-2"
              />
              <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50" disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <FunnelIcon className="w-4 h-4" />
                Filters
              </button>
            </form>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-gray-50 p-6 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Min Price"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Max Price"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Bedrooms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Min Beds"
                        value={filters.minBeds}
                        onChange={(e) => handleFilterChange('minBeds', e.target.value)}
                        className="w-full rounded border px-3 py-2 text-sm"
                        min="0"
                      />
                      <input
                        type="number"
                        placeholder="Max Beds"
                        value={filters.maxBeds}
                        onChange={(e) => handleFilterChange('maxBeds', e.target.value)}
                        className="w-full rounded border px-3 py-2 text-sm"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Bathrooms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Min Baths"
                        value={filters.minBaths}
                        onChange={(e) => handleFilterChange('minBaths', e.target.value)}
                        className="w-full rounded border px-3 py-2 text-sm"
                        min="0"
                        step="0.5"
                      />
                      <input
                        type="number"
                        placeholder="Max Baths"
                        value={filters.maxBaths}
                        onChange={(e) => handleFilterChange('maxBaths', e.target.value)}
                        className="w-full rounded border px-3 py-2 text-sm"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>

                  {/* Square Footage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Square Feet</label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Min Sqft"
                        value={filters.minSqft}
                        onChange={(e) => handleFilterChange('minSqft', e.target.value)}
                        className="w-full rounded border px-3 py-2 text-sm"
                        min="0"
                      />
                      <input
                        type="number"
                        placeholder="Max Sqft"
                        value={filters.maxSqft}
                        onChange={(e) => handleFilterChange('maxSqft', e.target.value)}
                        className="w-full rounded border px-3 py-2 text-sm"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {filteredItems.length} of {allItems.length} properties
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
          {approvedBanner && (
            <div className="rounded border border-green-200 bg-green-50 p-4 text-green-800">
              <p className="font-medium">You’re approved! 🎉</p>
              <p className="text-sm mt-1">Welcome—your account has been approved and you now have access to listings.</p>
            </div>
          )}
          {error && (
            <div className="rounded border border-amber-200 bg-amber-50 p-4 text-amber-800">
              {error.startsWith("401:") ? (
                <div>
                  <p className="font-medium">You must be logged in to view listings.</p>
                  <div className="mt-2 flex gap-3">
                    <a href="/login" className="rounded bg-blue-600 px-4 py-2 text-white">Log in</a>
                    <a href="/signup" className="rounded border px-4 py-2">Create account</a>
                  </div>
                </div>
              ) : error.startsWith("403:") ? (
                <div>
                  <p className="font-medium">Your account is pending approval.</p>
                  <p className="text-sm mt-1">Once an administrator approves your account, you will have access to listings. If you believe this is a mistake, please contact support.</p>
                </div>
              ) : (
                <p>{error.replace(/^\d+:\s*/, "")}</p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading &&
              Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-4 animate-pulse bg-white">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded" />
                  <div className="mt-4 h-4 bg-gray-200 rounded w-3/4" />
                  <div className="mt-2 h-3 bg-gray-200 rounded w-1/2" />
                  <div className="mt-2 h-3 bg-gray-200 rounded w-5/6" />
                </div>
              ))}
            {!loading &&
              items.map((p) => (
                <a key={p.id} href={`/listings/${p.id}`} className="rounded-lg border block hover:shadow-xl hover:-translate-y-1 hover:scale-105 transition-all duration-300 ease-in-out bg-white relative">
                  <button
                    onClick={(e) => toggleFavorite(p.id, e)}
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                  >
                    {favorites.has(p.id) ? (
                      <HeartSolidIcon className="w-5 h-5 text-red-500" />
                    ) : (
                      <HeartIcon className="w-5 h-5 text-gray-600 hover:text-red-500" />
                    )}
                  </button>
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-t-lg overflow-hidden">
                    {p.photo ? (
                      <img src={p.photo} alt={p.address} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-semibold truncate" title={p.address}>
                      {p.address}
                    </div>
                    <div className="text-sm text-gray-500">
                      {p.city}, {p.state}
                    </div>
                    <div className="text-sm mt-1">
                      {[p.beds && `${p.beds} bed`, p.baths && `${p.baths} bath`, p.sqft && `${p.sqft.toLocaleString()} sqft`]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                    {p.price ? <div className="mt-1 font-semibold text-lg">${p.price.toLocaleString()}</div> : null}
                  </div>
                </a>
              ))}
            </div>

            {items.length > 0 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="rounded bg-gray-200 px-4 py-2 text-gray-800 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="font-medium">Page {page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore || loading}
                  className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
        </>
      )}
    </div>
  );
}
