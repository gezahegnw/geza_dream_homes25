export interface Listing {
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
}

export type ListingsQuery = {
  q?: string;
  city?: string;
  state_code?: string;
  limit?: number;
  offset?: number;
  page?: number;
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
  
  // Temporarily force mock data if API is failing
  if (provider === "rapidapi_redfin") {
    console.log('[LISTINGS_DEBUG] Temporarily using mock data due to API issues');
    const listings = mockListings();
    setCachedListings(getCacheKey("mock", query), listings);
    return listings;
  }
  const cacheKey = getCacheKey(provider, query);

  const cachedResult = getCachedListings(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  if (provider === "mock") {
    const listings = mockListings();
    if (listings.length === 0) {
      console.warn('[LISTINGS_DEBUG] Zero listings from provider.');
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

    const location =
      query.q ||
      [query.city, query.state_code].filter(Boolean).join(", ") ||
      process.env.REDFIN_DEFAULT_LOCATION ||
      "Los Angeles, CA";
    const limit = String(query.limit ?? 12);
    const offset = String(query.offset ?? 0);
    const page = String(query.page ?? 1);
    const resultsPerPage = String(query.limit ?? 50);
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
    // 1) Try simple location-based search first (cheapest/most reliable)
    let url: string = `https://${host}/property/search?${new URLSearchParams({ location, limit, offset })}`;
    console.log(`[LISTINGS_DEBUG] Provider: ${provider}, URL: ${url}`);
    let res = await fetch(url, { headers: { "x-rapidapi-key": key, "x-rapidapi-host": host } });
    const rl1 = res.headers.get('x-ratelimit-remaining') || res.headers.get('x-ratelimit-requests-remaining');
    if (rl1) console.log(`[LISTINGS_DEBUG] RateLimit Remaining (primary): ${rl1}`);
    console.log(`[LISTINGS_DEBUG] API Response Status: ${res.status}`);

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`[LISTINGS_DEBUG] API Error: ${res.status}`, errorBody);
      if (res.status === 429 || res.status === 403) {
        console.warn('[LISTINGS_DEBUG] Rate limited/forbidden by provider.');
        throw new Error('RATE_LIMITED');
      }
      return [];
    }

    let data: any = {};
    try {
      const responseText = await res.text();
      console.log('[LISTINGS_DEBUG] Raw API response:', responseText.substring(0, 200));
      data = JSON.parse(responseText);
      console.log('[LISTINGS_DEBUG] Successfully parsed API response JSON (primary).');
    } catch (parseError) {
      console.error('[LISTINGS_DEBUG] Failed to parse API response as JSON:', parseError);
      // Return empty array instead of continuing with invalid data
      return [];
    }

    let raw = extractArray(data);
    console.log(`[LISTINGS_DEBUG] Extracted ${raw.length} raw items from API response (primary).`);
    let listings = raw.slice(0, query.limit ?? 12).map((p: any, i: number): Listing => ({
      id: String(p?.propertyId || p?.listingId || i),
      address: p?.streetLine?.value || "",
      city: p?.city,
      state: p?.state,
      price: p?.price?.value ?? p?.price,
      beds: p?.beds?.value ?? p?.beds,
      baths: p?.baths?.value ?? p?.baths,
      sqft: p?.sqFt?.value ?? p?.sqFt,
      photo: p?.photos?.items?.[0] || p?.primary_photo?.href || p?.thumbnail,
      url: p?.url ? `https://www.redfin.com${p.url}` : undefined,
    }));

    // 2) If sale search and primary returned nothing, resolve region and try sale endpoint
    if (listings.length === 0 && searchType === 'sale') {
      const regionId = await resolveRegionId();
      if (regionId) {
        url = `https://${host}/properties/search-sale?${new URLSearchParams({ regionId, page, limit: resultsPerPage })}`;
        console.log(`[LISTINGS_DEBUG] Fallback URL (search-sale): ${url}`);
        res = await fetch(url, { headers: { "x-rapidapi-key": key, "x-rapidapi-host": host } });
        const rl2 = res.headers.get('x-ratelimit-remaining') || res.headers.get('x-ratelimit-requests-remaining');
        if (rl2) console.log(`[LISTINGS_DEBUG] RateLimit Remaining (fallback): ${rl2}`);
        console.log(`[LISTINGS_DEBUG] API Response Status (fallback): ${res.status}`);
        if (res.ok) {
          try {
            const responseText2 = await res.text();
            const d2 = JSON.parse(responseText2);
            const raw2 = extractArray(d2);
            console.log(`[LISTINGS_DEBUG] Extracted ${raw2.length} raw items from API response (fallback).`);
            listings = raw2.slice(0, query.limit ?? 12).map((p: any, i: number): Listing => ({
              id: String(p?.propertyId || p?.listingId || i),
              address: p?.streetLine?.value || "",
              city: p?.city,
              state: p?.state,
              price: p?.price?.value ?? p?.price,
              beds: p?.beds?.value ?? p?.beds,
              baths: p?.baths?.value ?? p?.baths,
              sqft: p?.sqFt?.value ?? p?.sqFt,
              photo: p?.photos?.items?.[0] || p?.primary_photo?.href || p?.thumbnail,
              url: p?.url ? `https://www.redfin.com${p.url}` : undefined,
            }));
          } catch (parseError2) {
            console.error('[LISTINGS_DEBUG] Failed to parse fallback API response as JSON:', parseError2);
          }
        } else {
          const body2 = await res.text();
          console.error(`[LISTINGS_DEBUG] API Error (fallback search-sale): ${res.status}`, body2);
        }
      } else {
        console.warn('[LISTINGS_DEBUG] Could not resolve regionId; staying with primary search results (possibly empty).');
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
              photo: p?.photos?.items?.[0] || p?.primary_photo?.href || p?.thumbnail,
              url: p?.url ? `https://www.redfin.com${p.url}` : undefined,
            }));
          } catch (parseError3) {
            console.error('[LISTINGS_DEBUG] Failed to parse suggestion API response as JSON:', parseError3);
          }
        }
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