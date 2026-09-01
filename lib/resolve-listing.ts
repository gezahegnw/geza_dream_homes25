import { fetchListingById, fetchListings, type Listing } from "@/lib/listings";

// A signed-out visit resolves the same listing twice (once for the page's
// metadata, once for its body), and a crawler may hit neighbouring ids in
// quick succession, so hold results briefly. Misses expire sooner: a listing
// that just went live shouldn't stay "unavailable" for long.
const HIT_TTL_MS = 5 * 60 * 1000;
const MISS_TTL_MS = 60 * 1000;

const resolved = new Map<string, { listing: Listing | null; expiresAt: number }>();

export function clearResolvedListings(): void {
  resolved.clear();
}

/**
 * Resolves a listing id through the provider, falling back to search results
 * for ids the detail endpoint doesn't know.
 */
export async function resolveListing(id: string, q?: string): Promise<Listing | null> {
  const key = `${id}::${q ?? ""}`;
  const cached = resolved.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.listing;

  const listing = await lookup(id, q);
  resolved.set(key, {
    listing,
    expiresAt: Date.now() + (listing ? HIT_TTL_MS : MISS_TTL_MS),
  });
  return listing;
}

async function lookup(id: string, q?: string): Promise<Listing | null> {
  const direct = await fetchListingById(id);
  if (direct) return direct;

  // Providers only return ids that appear in the result set for a given
  // search, so retry within the search the visitor came from. Without a
  // search to scope the retry, the default result set is the only other place
  // the id can turn up — trying both costs a dead link an extra provider round
  // trip for no chance of a hit.
  const scoped = await fetchListings(q ? { q, limit: 200 } : { limit: 200 });
  return scoped.find((listing) => listing.id === id) ?? null;
}
