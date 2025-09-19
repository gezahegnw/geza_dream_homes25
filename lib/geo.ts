// lib/geo.ts

// Simple in-memory cache for geocoded ZIP lookups during server uptime
const geoZipCache = new Map<string, string>();

export async function geocodeZip(addressLine: string, city?: string, state?: string): Promise<string | undefined> {
  try {
    const key = [addressLine, city, state].filter(Boolean).join(", ");
    if (geoZipCache.has(key)) return geoZipCache.get(key);

    const q = [addressLine, city, state].filter(Boolean).join(", ");
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(q)}`;
    
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "GezaDreamHomes/1.0 (gezarealesteteagent@gmail.com)",
      },
      cache: "no-store",
    });

    if (!res.ok) return undefined;
    
    const data: any[] = await res.json();
    const zip = data?.[0]?.address?.postcode as string | undefined;
    
    if (zip) geoZipCache.set(key, zip);
    
    return zip;
  } catch {
    return undefined;
  }
}
