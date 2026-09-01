import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchListingById = vi.fn();
const fetchListings = vi.fn();

vi.mock("@/lib/listings", () => ({
  fetchListingById: (...a: unknown[]) => fetchListingById(...a),
  fetchListings: (...a: unknown[]) => fetchListings(...a),
}));

const { GET } = await import("@/app/api/listings/[id]/route");

const overlandPark = { id: "42", address: "1 Overland Park Way", city: "Overland Park" };

function request(url: string) {
  return new Request(url);
}

beforeEach(() => {
  fetchListingById.mockReset().mockResolvedValue(null);
  fetchListings.mockReset().mockResolvedValue([]);
});

describe("GET /api/listings/[id]", () => {
  it("returns the listing the provider resolves by id", async () => {
    fetchListingById.mockResolvedValue(overlandPark);

    const res = await GET(request("https://example.com/api/listings/42"), {
      params: Promise.resolve({ id: "42" }),
    });

    expect(res.status).toBe(200);
    expect((await res.json()).property.address).toBe("1 Overland Park Way");
  });

  it("falls back to the search the visitor came from", async () => {
    fetchListings.mockImplementation(async ({ q }: { q?: string }) =>
      q === "overland park" ? [overlandPark] : [],
    );

    const res = await GET(
      request("https://example.com/api/listings/42?q=overland%20park"),
      { params: Promise.resolve({ id: "42" }) },
    );

    expect(res.status).toBe(200);
    expect((await res.json()).property.id).toBe("42");
  });

  it("404s instead of erroring when the listing cannot be resolved", async () => {
    const res = await GET(request("https://example.com/api/listings/999"), {
      params: Promise.resolve({ id: "999" }),
    });

    expect(res.status).toBe(404);
  });

  it("stops after the scoped search rather than sweeping the default results", async () => {
    const res = await GET(request("https://example.com/api/listings/999?q=olathe"), {
      params: Promise.resolve({ id: "999" }),
    });

    expect(res.status).toBe(404);
    expect(fetchListings).toHaveBeenCalledTimes(1);
    expect(fetchListings).toHaveBeenCalledWith({ q: "olathe", limit: 200 });
  });
});
