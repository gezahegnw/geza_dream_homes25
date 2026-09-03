/**
 * Bounded in-memory cache with per-entry TTL and least-recently-used eviction.
 *
 * Listing data is served from a handful of long-lived server instances, so an
 * unbounded Map grows with every distinct search or listing id a crawler walks
 * through. `maxEntries` puts a ceiling on that; expired entries are dropped
 * lazily on read and swept when the cache is full.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, { value: T; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number,
  ) {}

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    // Re-insert so Map iteration order tracks recency for eviction.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number = this.ttlMs): void {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
    if (this.entries.size > this.maxEntries) this.evict();
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }

  private evict(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
    // Oldest keys come first, so dropping from the front removes the least
    // recently used entries.
    for (const key of this.entries.keys()) {
      if (this.entries.size <= this.maxEntries) break;
      this.entries.delete(key);
    }
  }
}
