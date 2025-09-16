import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gezadreamhome.vercel.app';

  // Static pages
  const staticRoutes = [
    '/home',
    '/listings',
    '/favorites',
    '/gallery',
    '/about',
    '/reviews',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/home' ? 1 : 0.8,
  }));

  // In the future, we can add dynamic routes for individual property listings here

  return [
    ...staticRoutes,
  ];
}
