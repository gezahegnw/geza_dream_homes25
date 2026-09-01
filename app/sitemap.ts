import { MetadataRoute } from 'next';
import { fetchListings } from '@/lib/listings';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gezadreamhomes.com';

// Listing detail pages render a public summary for signed-out visitors, so
// they are worth crawling. Capped because the provider paginates.
const LISTINGS_IN_SITEMAP = 200;

// Regenerate hourly: listings turn over, and a build-time snapshot would
// advertise sold homes until the next deploy.
export const revalidate = 3600;

// Login-walled routes (/favorites, /settings, /my-searches) are deliberately
// absent: submitting them only earns crawl budget on a sign-in prompt.
const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '/home', priority: 1, changeFrequency: 'weekly' },
  { path: '/listings', priority: 0.9, changeFrequency: 'daily' },
  { path: '/gallery', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/reviews', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/resources', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const staticEntries = routes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  let listingEntries: MetadataRoute.Sitemap = [];
  try {
    const listings = await fetchListings({ limit: LISTINGS_IN_SITEMAP });
    listingEntries = listings.map((listing) => ({
      url: `${baseUrl}/listings/${listing.id}`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
  } catch {
    // A provider outage shouldn't take the whole sitemap down with it.
  }

  return [...staticEntries, ...listingEntries];
}
