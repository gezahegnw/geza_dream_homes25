export interface Listing {
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
  lat?: number;
  lng?: number;
}

export type ListingsQuery = {
  q?: string;
  city?: string;
  state_code?: string;
  limit?: number;
  offset?: number;
  page?: number;
  minPrice?: string;
  maxPrice?: string;
  beds?: string;
  baths?: string;
  sortBy?: string;
};

// Simple in-memory cache for API responses
const listingsCache = new Map<string, { data: Listing[]; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function getCacheKey(provider: string, query: ListingsQuery): string {
  return `${provider}-${JSON.stringify(query)}`;
}

function getCachedListings(cacheKey: string): Listing[] | null {
  const cached = listingsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedListings(cacheKey: string, data: Listing[]): void {
  // Do not cache empty results
  if (data.length === 0) {
    return;
  }
  listingsCache.set(cacheKey, { data, timestamp: Date.now() });
}

function mockListings(): Listing[] {
  return [1, 2, 3, 4, 5, 6].map((i) => ({
    id: String(i),
    address: `123${i} Dream St`,
    city: "Austin",
    state: "TX",
    price: 500000 + i * 10000,
    beds: 3,
    baths: 2,
    sqft: 1800 + i * 50,
  }));
}

export async function fetchListings(query: ListingsQuery = {}): Promise<Listing[]> {
  const provider = process.env.LISTINGS_PROVIDER || "mock";
  const cacheKey = getCacheKey(provider, query);

  const cachedResult = getCachedListings(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  if (provider === "mock") {
    const listings = mockListings();
    if (listings.length === 0) {
      // No-op, just to have a line for potential future logging
    }
    setCachedListings(cacheKey, listings);
    return listings;
  }

  if (provider === "rapidapi_zillow") {
    const key = process.env.RAPIDAPI_ZILLOW_KEY;
    const host = process.env.RAPIDAPI_ZILLOW_HOST || "zillow-com1.p.rapidapi.com";
    if (!key) throw new Error("RAPIDAPI_ZILLOW_KEY not set");

    const location =
      query.q ||
      [query.city, query.state_code].filter(Boolean).join(", ") ||
      process.env.ZILLOW_DEFAULT_LOCATION ||
      "Kansas City, MO";

    const params = new URLSearchParams({ location });
    const url = `https://${host}/api/v1/propertyExtendedSearch?${params.toString()}`;

    const res = await fetch(url, { headers: { "x-rapidapi-key": key, "x-rapidapi-host": host } }).catch(() => null);
    if (!res || !res.ok) return [];

    const data = await res.json().catch(() => ({}));
    const raw: any[] = data?.props || [];
    const listings = raw.slice(0, query.limit ?? 12).map((p: any, i: number) => ({
      id: String(p?.zpid || i),
      address: p?.address || "",
      city: p?.city,
      state: p?.state,
      price: p?.price || undefined,
      beds: p?.bedrooms || undefined,
      baths: p?.bathrooms || undefined,
      sqft: p?.livingArea || undefined,
      photo: p?.imgSrc || undefined,
      url: p?.detailUrl || undefined,
    }));

    setCachedListings(cacheKey, listings);
    return listings;
  }

  if (provider === "rapidapi_realtor") {
    const key = process.env.RAPIDAPI_REALTOR_KEY;
    const host = process.env.RAPIDAPI_REALTOR_HOST || "realtor.p.rapidapi.com";
    if (!key) throw new Error("RAPIDAPI_REALTOR_KEY not set");

    const location =
      query.q ||
      [query.city, query.state_code].filter(Boolean).join(", ") ||
      process.env.REALTOR_DEFAULT_LOCATION ||
      "Kansas City, MO";

    const params = new URLSearchParams({ city: location, limit: String(query.limit ?? 12), offset: String(query.offset ?? 0) });
    const url = `https://${host}/properties/v2/list-for-sale?${params.toString()}`;

    const res = await fetch(url, { headers: { "x-rapidapi-key": key, "x-rapidapi-host": host } }).catch(() => null);
    if (!res || !res.ok) return [];

    const data = await res.json().catch(() => ({}));
    const raw: any[] = data?.properties || [];
    const listings = raw.slice(0, query.limit ?? 12).map((p: any, i: number) => ({
      id: String(p?.property_id || i),
      address: p?.address?.line || "",
      city: p?.address?.city,
      state: p?.address?.state_code,
      price: p?.price || undefined,
      beds: p?.beds || undefined,
      baths: p?.baths || undefined,
      sqft: p?.building_size?.size || undefined,
      photo: p?.photos?.[0]?.href || undefined,
      url: p?.rdc_web_url || undefined,
    }));

    setCachedListings(cacheKey, listings);
    return listings;
  }

  if (provider === "rapidapi_redfin") {
    const key = process.env.RAPIDAPI_REDFIN_KEY;
    const host = process.env.RAPIDAPI_REDFIN_HOST || "redfin-com-data.p.rapidapi.com";
    if (!key) throw new Error("RAPIDAPI_REDFIN_KEY not set");

    const extractArray = (payload: any): any[] => {
      if (!payload) return [];
      const d = payload.data ?? payload;
      if (Array.isArray(d)) return d;
      if (Array.isArray(d?.homes)) return d.homes;
      if (Array.isArray(d?.listings)) return d.listings;
      if (Array.isArray(d?.properties)) return d.properties;
      if (Array.isArray(d?.results)) return d.results;
      return [];
    };

    // Prefer city-only searches for better data quality (includes zip codes)
    let location = query.q || 
      (query.city || [query.city, query.state_code].filter(Boolean).join(", ")) ||
      process.env.REDFIN_DEFAULT_LOCATION ||
      "Los Angeles, CA";
    
    // If query.q contains "city, state" pattern, extract just the city for better data
    if (query.q && query.q.includes(",")) {
      const parts = query.q.split(",").map(part => part.trim());
      if (parts.length === 2 && parts[1].length <= 3) { // Likely "City, ST" format
        location = parts[0]; // Use just the city
      }
    }
    const limit = String(query.limit ?? 12);
    const offset = String(query.offset ?? 0);
    const page = String(query.page ?? 1);
    const resultsPerPage = String(Math.max(query.limit ?? 50, 50)); // Request more results for pagination
    const searchType = (process.env.REDFIN_SEARCH_TYPE || "sale").toLowerCase();

    const resolveRegionId = async (): Promise<string | null> => {
      const acParams = new URLSearchParams({ location });
      const acUrl = `https://${host}/properties/auto-complete?${acParams.toString()}`;
      try {
        const acRes = await fetch(acUrl, { headers: { "x-rapidapi-key": key, "x-rapidapi-host": host } });
        if (!acRes.ok) return null;
        const acData = await acRes.json();
        const region = acData?.data?.regions?.[0];
        return region?.regionId || region?.id || null;
      } catch (e) {
        return null;
      }
    };
    const searchParams: Record<string, string> = { location, limit, offset };
    if (query.minPrice) searchParams.min_price = query.minPrice;
    if (query.maxPrice) searchParams.max_price = query.maxPrice;
    if (query.beds) searchParams.beds = query.beds;
    if (query.baths) searchParams.baths = query.baths;
    
    // Map our sort values to what Redfin API expects
    if (query.sortBy) {
      switch (query.sortBy) {
        case 'price_asc':
          searchParams.sort = 'price_low_to_high';
          break;
        case 'price_desc':
          searchParams.sort = 'price_high_to_low';
          break;
        case 'newest':
          searchParams.sort = 'newest';
          break;
        default:
          searchParams.sort = query.sortBy;
      }
    }

    // 1) Try simple location-based search first (cheapest/most reliable)
    let url: string = `https://${host}/property/search?${new URLSearchParams(searchParams)}`;
    let res = await fetch(url, { headers: { "x-rapidapi-key": key, "x-rapidapi-host": host } });
    const rl1 = res.headers.get('x-ratelimit-remaining') || res.headers.get('x-ratelimit-requests-remaining');

    if (!res.ok) {
      const errorBody = await res.text();
      if (res.status === 429 || res.status === 403) {
        throw new Error('RATE_LIMITED');
      }
      return [];
    }

    let data: any = {};
    try {
      const responseText = await res.text();
      data = JSON.parse(responseText);
    } catch (parseError) {
      // Return empty array instead of continuing with invalid data
      return [];
    }

    let raw = extractArray(data);
    
    // Apply pagination to the raw results
    const startIndex = query.offset ?? 0;
    const pageSize = query.limit ?? 12;
    const paginatedRaw = raw.slice(startIndex, startIndex + pageSize);
    
    let listings = paginatedRaw.map((p: any, i: number): Listing => ({
      id: String(p?.propertyId || p?.listingId || i),
      address: p?.streetLine?.value || "",
      city: p?.city,
      state: p?.state,
      zipCode: p?.zipCode || p?.zip || p?.postalCode,
      price: p?.price?.value ?? p?.price,
      beds: p?.beds?.value ?? p?.beds,
      baths: p?.baths?.value ?? p?.baths,
      sqft: p?.sqFt?.value ?? p?.sqFt,
      photos: p?.photos?.items || (p?.primary_photo?.href ? [p.primary_photo.href] : []) || (p?.thumbnail ? [p.thumbnail] : []),
      description: p?.description || p?.remarks, // Attempt to get description
      status: p?.status || p?.listingStatus || p?.mlsStatus || p?.propertyStatus || 'Active', // Try multiple status field names
      propertyType: p?.propertyType || p?.property_type || p?.type,
      yearBuilt: p?.yearBuilt || p?.year_built || p?.built_year,
      pricePerSqft: p?.pricePerSqft || p?.price_per_sqft || (p?.price && p?.sqFt ? Math.round(p.price / p.sqFt) : undefined),
      hoaDues: p?.hoaDues || p?.hoa_dues || p?.hoa || p?.hoaFee,
      lotSize: p?.lotSize || p?.lot_size || p?.lotSqft,
      garage: p?.garage || p?.garageSpaces || p?.parking,
      url: p?.url ? `https://www.redfin.com${p.url}` : undefined,
      lat: p?.latLong?.latitude || p?.latLong?.value?.latitude,
      lng: p?.latLong?.longitude || p?.latLong?.value?.longitude,
    }));

    // 2) If sale search and primary returned nothing, resolve region and try sale endpoint
    if (listings.length === 0 && searchType === 'sale') {
      const regionId = await resolveRegionId();
      if (regionId) {
        url = `https://${host}/properties/search-sale?${new URLSearchParams({ regionId, page, limit: resultsPerPage })}`;
        res = await fetch(url, { headers: { "x-rapidapi-key": key, "x-rapidapi-host": host } });
        const rl2 = res.headers.get('x-ratelimit-remaining') || res.headers.get('x-ratelimit-requests-remaining');
        if (res.ok) {
          try {
            const responseText2 = await res.text();
            const d2 = JSON.parse(responseText2);
            const raw2 = extractArray(d2);
            listings = raw2.slice(0, query.limit ?? 12).map((p: any, i: number): Listing => ({
              id: String(p?.propertyId || p?.listingId || i),
              address: p?.streetLine?.value || "",
              city: p?.city,
              state: p?.state,
              zipCode: p?.zipCode || p?.zip || p?.postalCode,
              price: p?.price?.value ?? p?.price,
              beds: p?.beds?.value ?? p?.beds,
              baths: p?.baths?.value ?? p?.baths,
              sqft: p?.sqFt?.value ?? p?.sqFt,
              photos: p?.photos?.items || (p?.primary_photo?.href ? [p.primary_photo.href] : []) || (p?.thumbnail ? [p.thumbnail] : []),
              description: p?.description || p?.remarks, // Attempt to get description
              status: p?.status || p?.listingStatus || p?.mlsStatus || p?.propertyStatus || 'Active', // Try multiple status field names
              propertyType: p?.propertyType || p?.property_type || p?.type,
              yearBuilt: p?.yearBuilt || p?.year_built || p?.built_year,
              pricePerSqft: p?.pricePerSqft || p?.price_per_sqft || (p?.price && p?.sqFt ? Math.round(p.price / p.sqFt) : undefined),
              hoaDues: p?.hoaDues || p?.hoa_dues || p?.hoa || p?.hoaFee,
              lotSize: p?.lotSize || p?.lot_size || p?.lotSqft,
              garage: p?.garage || p?.garageSpaces || p?.parking,
              url: p?.url ? `https://www.redfin.com${p.url}` : undefined,
            }));
          } catch (parseError2) {
            // Silently fail
          }
        } else {
          const body2 = await res.text();
        }
      } else {
      }
    }
    
    if (listings.length === 0 && Array.isArray(data.suggestionLocation) && data.suggestionLocation.length > 0) {
      const firstSuggestion = data.suggestionLocation[0];
      const suggestedId = firstSuggestion.id;

      const suggestedLocation = firstSuggestion.location;
      if (suggestedLocation) {
        const suggestedUrl = `https://${host}/property/search?${new URLSearchParams({ location: suggestedLocation, limit, offset })}`;
        const sRes = await fetch(suggestedUrl, { headers: { "x-rapidapi-key": key, "x-rapidapi-host": host } });

        if (sRes.ok) {
          try {
            const responseText3 = await sRes.text();
            const sData = JSON.parse(responseText3);
            const sRaw = extractArray(sData);
            listings = sRaw.slice(0, query.limit ?? 12).map((p: any, i: number): Listing => ({
              id: String(p?.propertyId || p?.listingId || i),
              address: p?.streetLine?.value || "",
              city: p?.city,
              state: p?.state,
              price: p?.price?.value ?? p?.price,
              beds: p?.beds?.value ?? p?.beds,
              baths: p?.baths?.value ?? p?.baths,
              sqft: p?.sqFt?.value ?? p?.sqFt,
              photos: p?.photos?.items || (p?.primary_photo?.href ? [p.primary_photo.href] : []) || (p?.thumbnail ? [p.thumbnail] : []),
              description: p?.description || p?.remarks, // Attempt to get description
              status: p?.status || p?.listingStatus || p?.mlsStatus || p?.propertyStatus || 'Active', // Try multiple status field names
              url: p?.url ? `https://www.redfin.com${p.url}` : undefined,
            }));
          } catch (parseError3) {
            // Silently fail
          }
        }
      }
    }

    // Apply client-side sorting since API sorting may not work reliably
    if (query.sortBy && listings.length > 0) {
      switch (query.sortBy) {
        case 'price_asc':
          listings.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;
        case 'price_desc':
          listings.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
        case 'newest':
          // Keep original order for newest (API should handle this)
          break;
      }
    }

    setCachedListings(cacheKey, listings);
    return listings;
  }

  return []; // Fallback
}

export async function fetchListingsDebug(query: ListingsQuery = {}): Promise<{ items: Listing[]; debug: any }> {
  const provider = process.env.LISTINGS_PROVIDER || "mock";
  const items = await fetchListings(query);
  return { items, debug: { provider, itemCount: items.length } };
}

// Fetch a single listing by its ID with full details
export async function fetchListingById(propertyId: string): Promise<Listing | null> {
  const provider = process.env.LISTINGS_PROVIDER || "mock";

  if (provider !== "rapidapi_redfin") {
    // Fallback for mock or other providers: find from the main list
    const allListings = await fetchListings({ limit: 200 }); // Fetch a larger list to increase chances
    return allListings.find(listing => listing.id === propertyId) || null;
  }

  // Specific implementation for Redfin to get full details
  const key = process.env.RAPIDAPI_REDFIN_KEY;
  const host = process.env.RAPIDAPI_REDFIN_HOST || "redfin-com-data.p.rapidapi.com";
  if (!key) throw new Error("RAPIDAPI_REDFIN_KEY not set");

  const url = `https://${host}/properties/v3/detail?propertyId=${propertyId}`;

  const res = await fetch(url, { headers: { "x-rapidapi-key": key, "x-rapidapi-host": host } });

  if (!res.ok) {
    return null;
  }

  try {
    const data = await res.json();
    const p = data?.data;
    if (!p) {
      return null;
    }

    // Map the detailed response to our Listing interface
    const listing: Listing = {
      id: String(p?.propertyId || propertyId),
      address: p?.streetAddress?.formattedStreetLine || p?.streetAddress?.streetAddress,
      city: p?.city,
      state: p?.state,
      zipCode: p?.zip,
      price: p?.price?.value ?? p?.price,
      beds: p?.beds,
      baths: p?.baths,
      sqft: p?.sqFt?.value,
      photos: p?.photos?.map((photo: any) => photo.url) || [],
      description: p?.propertyHistory?.[0]?.eventDescription || p?.remarks,
      status: p?.listingMetadata?.listingStatus || 'Active',
      propertyType: p?.propertyType,
      yearBuilt: p?.yearBuilt,
      pricePerSqft: p?.pricePerSqFt?.value,
      hoaDues: p?.hoa?.fee,
      lotSize: p?.lotSize?.value,
      garage: p?.garage?.garageSpaces,
      url: p?.url ? `https://www.redfin.com${p.url}` : undefined,
    };

    return listing;
  } catch (e) {
    return null;
  }
}