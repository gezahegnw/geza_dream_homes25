"use client";
import React, { useEffect, useState } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import FilterPanel from "@/components/FilterPanel";

type Listing = {
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
  status?: string;
  propertyType?: string;
  yearBuilt?: number;
  pricePerSqft?: number;
  hoaDues?: number;
  lotSize?: number;
  garage?: number;
  url?: string;
};

// Helper function to get status badge styling for main listings
const getStatusBadge = (status?: string) => {
  const displayStatus = status || 'Active';
  
  const normalizedStatus = displayStatus.toLowerCase();
  let badgeClass = "absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium z-10 ";
  
  if (normalizedStatus.includes('active')) {
    badgeClass += "bg-green-100 text-green-800";
  } else if (normalizedStatus.includes('pending')) {
    badgeClass += "bg-yellow-100 text-yellow-800";
  } else if (normalizedStatus.includes('sold') || normalizedStatus.includes('closed')) {
    badgeClass += "bg-red-100 text-red-800";
  } else if (normalizedStatus.includes('coming soon') || normalizedStatus.includes('coming_soon')) {
    badgeClass += "bg-blue-100 text-blue-800";
  } else if (normalizedStatus.includes('off market') || normalizedStatus.includes('withdrawn')) {
    badgeClass += "bg-gray-100 text-gray-800";
  } else {
    badgeClass += "bg-gray-100 text-gray-800";
  }
  
  return (
    <span className={badgeClass}>
      {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
    </span>
  );
};

// Force re-deploy to fix image caching issue
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
  const [filters, setFilters] = useState<Partial<{ minPrice: string; maxPrice: string; beds: string; baths: string; sortBy: string; }>>({});

  const LISTINGS_PER_PAGE = 9;

  // Optional IDX iframe override
  const idxUrl = process.env.NEXT_PUBLIC_IDX_IFRAME_URL;

  const fetchAndSetListings = async (pageNum: number, q: string, currentFilters: typeof filters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(LISTINGS_PER_PAGE),
        page: String(pageNum),
      });
      if (q) params.set("q", q);

      // Add filters to params
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value as string);
        }
      });

      const res = await fetch(`/api/listings?${params.toString()}`, { cache: "no-store" });
      const body = await res.json();

      if (!res.ok) {
        const msg = String(body?.error || body?.message || "Failed to load listings");
        throw new Error(`${res.status}:${msg}`);
      }

      const listings = body.listings || [];
      
      
      // For pagination, we only show the current page results
      setItems(listings);
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
    fetchAndSetListings(page, query, filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idxUrl, page]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (idxUrl) return; // iframe mode
    setPage(1); // Reset to first page on new search
    fetchAndSetListings(1, query, filters);
  }

  // Check if user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication status on component mount
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleListingClick = (listingId: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isAuthenticated === false) {
      // Redirect to login with return URL
      window.location.href = `/login?redirect=/listings/${listingId}`;
      return;
    }
    
    // If authenticated, navigate to listing
    window.location.href = `/listings/${listingId}`;
  };

  const toggleFavorite = async (propertyId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAuthenticated === false) {
      // Redirect to login for favorites
      window.location.href = `/login?redirect=/listings`;
      return;
    }
    
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

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setPage(1);
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchAndSetListings(1, query, updatedFilters);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Property Listings</h1>
        {isAuthenticated === false && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Browse freely!</span> Click on any listing to view details. 
              <a href="/login" className="underline hover:text-blue-800 ml-1">Sign in</a> to save favorites and access full property information.
            </p>
          </div>
        )}
      </div>

      {idxUrl ? (
        <div className="w-full">
          <iframe src={idxUrl} title="IDX Listings" className="w-full min-h-[70vh] border rounded" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
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
            </form>

            <FilterPanel onFilterChange={handleFilterChange} />
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
                <div key={p.id} onClick={(e) => handleListingClick(p.id, e)} className="rounded-lg border block hover:shadow-xl hover:-translate-y-1 hover:scale-105 transition-all duration-300 ease-in-out bg-white relative cursor-pointer">
                  {getStatusBadge(p.status)}
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
                    {p.photos && p.photos.length > 0 ? (
                      <img src={p.photos[0]} alt={p.address} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-semibold truncate" title={p.address}>
                      {p.address}
                    </div>
                    <div className="text-sm text-gray-500">
                      {p.city}, {p.state} {p.zipCode ?? ''}
                    </div>
                    <div className="text-sm mt-1">
                      {[p.beds && `${p.beds} bed`, p.baths && `${p.baths} bath`, p.sqft && `${p.sqft.toLocaleString()} sqft`]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                    {p.price ? <div className="mt-1 font-semibold text-lg">${p.price.toLocaleString()}</div> : null}
                  </div>
                </div>
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
