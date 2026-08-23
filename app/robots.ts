import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gezadreamhomes.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Signed-in and admin surfaces render nothing useful to a crawler and
        // would otherwise be indexed as empty or login-walled pages.
        disallow: ["/admin", "/api", "/settings", "/favorites", "/my-searches", "/debug", "/login", "/signup"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
