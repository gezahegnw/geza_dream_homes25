import { TtlCache } from "./ttl-cache";

export interface ListingFeatureGroup {
  section: string;
  title: string;
  entries: { name?: string; values: string[] }[];
}

export interface ListingSchool {
  name: string;
  level?: string;
  grades?: string;
  rating?: number;
  distanceMiles?: number;
  district?: string;
  institutionType?: string;
}

export interface ListingHistoryEvent {
  date: string;
  event: string;
  price?: number;
  source?: string;
}

export interface ListingAgent {
  name: string;
  broker?: string;
}

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
  hoaName?: string;
  hoaIncludes?: string[];
  hoaAmenities?: string[];
  taxesDue?: number;
  taxYear?: number;
  daysOnMarket?: number;
  mlsId?: string;
  mlsSource?: string;
  listingAgents?: ListingAgent[];
  featureGroups?: ListingFeatureGroup[];
  schools?: ListingSchool[];
  priceHistory?: ListingHistoryEvent[];
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

// In-memory caches for provider responses. Bounded so a crawler walking every
// listing page can't grow them without limit.
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const DETAIL_CACHE_DURATION = 30 * 60 * 1000;
// A miss is cached briefly too: without it a dead or mistyped id costs a full
// provider round trip on every hit, but a listing that just went live
// shouldn't stay "unavailable" for long.
const DETAIL_MISS_CACHE_DURATION = 60 * 1000;

const listingsCache = new TtlCache<Listing[]>(CACHE_DURATION, 200);
const detailCache = new TtlCache<Listing | null>(DETAIL_CACHE_DURATION, 500);

/** Drops every cached provider response. Exposed for tests. */
export function clearListingCaches(): void {
  listingsCache.clear();
  detailCache.clear();
}

function getCacheKey(provider: string, query: ListingsQuery): string {
  return `${provider}-${JSON.stringify(query)}`;
}

function getCachedListings(cacheKey: string): Listing[] | null {
  return listingsCache.get(cacheKey) ?? null;
}

function setCachedListings(cacheKey: string, data: Listing[]): void {
  // Do not cache empty results
  if (data.length === 0) {
    return;
  }
  listingsCache.set(cacheKey, data);
}

// Redfin marketing remarks arrive as HTML-escaped text destined for a JSX text node.
function decodeHtmlEntities(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    mdash: "\u2014",
    ndash: "\u2013",
    rsquo: "\u2019",
    lsquo: "\u2018",
    rdquo: "\u201d",
    ldquo: "\u201c",
    hellip: "\u2026",
  };
  return value.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      return String.fromCodePoint(parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) {
      return String.fromCodePoint(parseInt(entity.slice(1), 10));
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

interface RedfinAmenityEntry {
  amenityName?: string;
  amenityValues?: string[];
  referenceName?: string;
}

interface RedfinAmenityGroup {
  groupTitle?: string;
  amenityEntries?: RedfinAmenityEntry[];
}

interface RedfinAmenitySuperGroup {
  titleString?: string;
  amenityGroups?: RedfinAmenityGroup[];
}

interface RedfinSchool {
  name?: string;
  gradeRanges?: string;
  greatSchoolsRating?: number;
  distanceInMiles?: string;
  institutionType?: string;
  elementary?: boolean;
  middle?: boolean;
  high?: boolean;
  schoolDistrict?: { districtName?: string };
}

interface RedfinHistoryEvent {
  eventDate?: number;
  eventDescription?: string;
  price?: number;
  source?: string;
}

interface RedfinListingAgent {
  agentInfo?: { agentName?: string };
  brokerName?: string;
}

// The MLS fact sheet: super groups (Interior, Exterior, ...) of labelled groups
// of name/value entries. Values are HTML-escaped like the marketing remarks.
function mapFeatureGroups(superGroups: RedfinAmenitySuperGroup[]): ListingFeatureGroup[] {
  return superGroups.flatMap((superGroup) =>
    (superGroup.amenityGroups ?? [])
      .map((group) => ({
        section: superGroup.titleString ?? "",
        title: group.groupTitle ?? "",
        entries: (group.amenityEntries ?? [])
          .map((entry) => ({
            name: decodeHtmlEntities(entry.amenityName),
            values: (entry.amenityValues ?? [])
              .map((value) => decodeHtmlEntities(value))
              .filter((value): value is string => Boolean(value)),
          }))
          .filter((entry) => entry.values.length > 0),
      }))
      .filter((group) => group.section && group.title && group.entries.length > 0),
  );
}

function amenityValues(
  superGroups: RedfinAmenitySuperGroup[],
  referenceName: string,
): string[] | undefined {
  for (const superGroup of superGroups) {
    for (const group of superGroup.amenityGroups ?? []) {
      for (const entry of group.amenityEntries ?? []) {
        if (entry.referenceName === referenceName && entry.amenityValues?.length) {
          return entry.amenityValues
            .map((value) => decodeHtmlEntities(value))
            .filter((value): value is string => Boolean(value));
        }
      }
    }
  }
  return undefined;
}

const HOA_PERIODS_PER_YEAR: Record<string, number> = {
  monthly: 12,
  quarterly: 4,
  "semi-annually": 2,
  semiannually: 2,
  annually: 1,
  yearly: 1,
};

// MLS association fees come as a display string plus a frequency; the UI shows
// a monthly figure so buyers can compare listings.
function monthlyHoaDues(fee?: string, frequency?: string): number | undefined {
  if (!fee) return undefined;
  const amount = Number(fee.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  const periods = HOA_PERIODS_PER_YEAR[(frequency ?? "monthly").trim().toLowerCase()];
  if (!periods) return undefined;
  return Math.round((amount * periods) / 12);
}

function schoolLevel(school: RedfinSchool): string | undefined {
  const levels = [
    school.elementary ? "Elementary" : null,
    school.middle ? "Middle" : null,
    school.high ? "High" : null,
  ].filter(Boolean);
  return levels.length ? levels.join(" / ") : undefined;
}

function mapSchools(schools: RedfinSchool[]): ListingSchool[] {
  return schools
    .filter((school) => Boolean(school.name))
    .map((school) => ({
      name: school.name as string,
      level: schoolLevel(school),
      grades: school.gradeRanges,
      rating: school.greatSchoolsRating,
      distanceMiles: school.distanceInMiles ? Number(school.distanceInMiles) : undefined,
      district: school.schoolDistrict?.districtName,
      institutionType: school.institutionType,
    }));
}

function mapPriceHistory(events: RedfinHistoryEvent[]): ListingHistoryEvent[] {
  return events
    .filter((event) => Boolean(event.eventDescription) && Boolean(event.eventDate))
    .map((event) => ({
      date: new Date(event.eventDate as number).toISOString(),
      event: event.eventDescription as string,
      price: event.price,
      source: event.source,
    }));
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
      description: p?.description || p?.remarks || p?.listingRemarks || p?.publicRemarks || p?.mlsDescription || p?.propertyDescription || p?.details?.description, // Attempt to get description
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
              description: p?.description || p?.remarks || p?.listingRemarks || p?.publicRemarks || p?.mlsDescription || p?.propertyDescription || p?.details?.description, // Attempt to get description
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
              description: p?.description || p?.remarks || p?.listingRemarks || p?.publicRemarks || p?.mlsDescription || p?.propertyDescription || p?.details?.description, // Attempt to get description
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
  const cacheKey = `${provider}-${propertyId}`;

  const cached = detailCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const listing = await fetchListingByIdUncached(provider, propertyId);
  detailCache.set(
    cacheKey,
    listing,
    listing ? DETAIL_CACHE_DURATION : DETAIL_MISS_CACHE_DURATION,
  );
  return listing;
}

async function fetchListingByIdUncached(
  provider: string,
  propertyId: string,
): Promise<Listing | null> {
  if (provider !== "rapidapi_redfin") {
    // Fallback for mock or other providers: find from the main list
    const allListings = await fetchListings({ limit: 200 }); // Fetch a larger list to increase chances
    return allListings.find(listing => listing.id === propertyId) || null;
  }

  // Specific implementation for Redfin to get full details
  const key = process.env.RAPIDAPI_REDFIN_KEY;
  const host = process.env.RAPIDAPI_REDFIN_HOST || "redfin-com-data.p.rapidapi.com";
  if (!key) throw new Error("RAPIDAPI_REDFIN_KEY not set");

  // The endpoint keys off a listing page path rather than an id. Only the
  // trailing /home/<propertyId> and a syntactically valid state segment are
  // matched, so the street and city segments can be placeholders.
  const path = `/${process.env.REDFIN_DETAIL_STATE || "KS"}/x/x/home/${propertyId}`;
  const url = `https://${host}/property/detail?url=${encodeURIComponent(path)}`;

  const res = await fetch(url, { headers: { "x-rapidapi-key": key, "x-rapidapi-host": host } });

  if (!res.ok) {
    return null;
  }

  try {
    const data = await res.json();
    const p = data?.data;
    const addr = p?.aboveTheFold?.addressSectionInfo;
    if (!addr) {
      return null;
    }

    const mainHouse = p?.mainHouseInfoPanelInfo?.mainHouseInfo;
    const publicRecords = p?.belowTheFold?.publicRecordsInfo?.basicInfo;
    const taxInfo = p?.belowTheFold?.publicRecordsInfo?.taxInfo;
    const superGroups: RedfinAmenitySuperGroup[] =
      p?.belowTheFold?.amenitiesInfo?.superGroups ?? [];
    const featureGroups = mapFeatureGroups(superGroups);
    const schools = mapSchools(p?.schoolsAndDistrictsInfo?.servingThisHomeSchools ?? []);
    const priceHistory = mapPriceHistory(p?.belowTheFold?.propertyHistoryInfo?.events ?? []);
    const listingAgents: ListingAgent[] = (mainHouse?.listingAgents ?? [])
      .map((agent: RedfinListingAgent) => ({
        name: agent?.agentInfo?.agentName ?? "",
        broker: agent?.brokerName,
      }))
      .filter((agent: ListingAgent) => Boolean(agent.name));
    const hoaDues = monthlyHoaDues(
      amenityValues(superGroups, "ASSOCIATION_FEE")?.[0],
      amenityValues(superGroups, "ASSOCIATION_FEE_FREQUENCY")?.[0],
    );
    const timeOnRedfin: number | undefined = addr?.timeOnRedfin;
    const photos: string[] = (p?.aboveTheFold?.mediaBrowserInfo?.photos ?? [])
      .map((photo: any) => photo?.photoUrls?.fullScreenPhotoUrl || photo?.photoUrls?.nonFullScreenPhotoUrl)
      .filter(Boolean);

    const listing: Listing = {
      id: propertyId,
      address: addr?.streetAddress?.assembledAddress || "",
      city: addr?.city,
      state: addr?.state,
      zipCode: addr?.zip,
      price: addr?.priceInfo?.amount ?? addr?.latestPriceInfo?.amount,
      beds: addr?.beds,
      baths: addr?.baths,
      sqft: addr?.sqFt?.value,
      photos: photos.length ? photos : (addr?.primaryPhotoUrl ? [addr.primaryPhotoUrl] : []),
      description: decodeHtmlEntities(
        (mainHouse?.marketingRemarks ?? [])
          .map((remark: any) => remark?.marketingRemark)
          .filter(Boolean)
          .join("\n\n") || undefined,
      ),
      status: addr?.status?.displayValue || "Active",
      propertyType: publicRecords?.propertyTypeName,
      yearBuilt: addr?.yearBuilt ?? publicRecords?.yearBuilt,
      pricePerSqft: addr?.pricePerSqFt,
      lotSize: addr?.lotSize ?? publicRecords?.lotSqFt,
      url: addr?.url ? `https://www.redfin.com${addr.url}` : undefined,
      lat: addr?.latLong?.latitude,
      lng: addr?.latLong?.longitude,
      garage: Number(amenityValues(superGroups, "GARAGE_SPACES")?.[0]) || undefined,
      hoaDues,
      hoaName: amenityValues(superGroups, "ASSOCIATION_NAME")?.[0],
      hoaIncludes: amenityValues(superGroups, "ASSOCIATION_FEE_INCLUDES"),
      hoaAmenities: amenityValues(superGroups, "ASSOCIATION_AMENITIES"),
      taxesDue: taxInfo?.taxesDue,
      taxYear: taxInfo?.rollYear,
      daysOnMarket:
        typeof timeOnRedfin === "number" ? Math.max(1, Math.round(timeOnRedfin / 86_400_000)) : undefined,
      mlsId: mainHouse?.mlsId,
      mlsSource: mainHouse?.source?.dataSourceDescription,
      listingAgents: listingAgents.length ? listingAgents : undefined,
      featureGroups: featureGroups.length ? featureGroups : undefined,
      schools: schools.length ? schools : undefined,
      priceHistory: priceHistory.length ? priceHistory : undefined,
    };

    return listing;
  } catch (e) {
    return null;
  }
}