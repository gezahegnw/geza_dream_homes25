import { clearListingCaches, fetchListingById, fetchListings, type Listing } from "@/lib/listings";

/**
 * Drops the provider caches this resolver reads through. Exposed for tests.
 */
export function clearResolvedListings(): void {
  clearListingCaches();
}

/**
 * Resolves a listing id through the provider, falling back to search results
 * for ids the detail endpoint doesn't know. Both lookups are cached inside
 * `lib/listings`, so a signed-out visit — which resolves the same id twice,
 * once for the page's metadata and once for its body — costs one round trip.
 */
export async function resolveListing(id: string, q?: string): Promise<Listing | null> {
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
