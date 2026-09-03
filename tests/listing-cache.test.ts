import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearListingCaches, fetchListingById } from "@/lib/listings";
import { TtlCache } from "@/lib/ttl-cache";

const originalEnv = { ...process.env };

const detailResponse = {
  data: {
    aboveTheFold: {
      addressSectionInfo: {
        streetAddress: { assembledAddress: "9932 Roe Ave" },
        city: "Overland Park",
        state: "KS",
      },
    },
  },
};

function mockDetail(payload: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () => payload,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  process.env.LISTINGS_PROVIDER = "rapidapi_redfin";
  process.env.RAPIDAPI_REDFIN_KEY = "test-key";
  clearListingCaches();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  process.env = { ...originalEnv };
});

describe("fetchListingById caching", () => {
  it("serves repeat lookups of the same id without hitting the provider again", async () => {
    const fetchMock = mockDetail(detailResponse);

    const first = await fetchListingById("83302589");
    const second = await fetchListingById("83302589");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it("does not serve one listing's data for another id", async () => {
    const fetchMock = mockDetail(detailResponse);

    await fetchListingById("83302589");
    await fetchListingById("11111111");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("caches a miss, but only briefly", async () => {
    const fetchMock = mockDetail({ data: null }, false);

    expect(await fetchListingById("999")).toBeNull();
    expect(await fetchListingById("999")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // A listing that just went live shouldn't stay unavailable for long.
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 61_000);
    await fetchListingById("999");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("TtlCache", () => {
  it("expires entries once their ttl passes", () => {
    const cache = new TtlCache<string>(1_000, 10);
    cache.set("a", "value");
    expect(cache.get("a")).toBe("value");

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 1_001);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("evicts the least recently used entry instead of growing unbounded", () => {
    const cache = new TtlCache<number>(60_000, 2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a"); // "a" is now the most recently used
    cache.set("c", 3);

    expect(cache.size).toBe(2);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });
});
