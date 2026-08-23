import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchListingById } from "@/lib/listings";

const originalEnv = { ...process.env };

// Trimmed to the fields the mapping reads, keeping the real response's shape:
// everything hangs off aboveTheFold, and marketingRemarks is an array.
const detailResponse = {
  data: {
    aboveTheFold: {
      addressSectionInfo: {
        streetAddress: { assembledAddress: "9932 Roe Ave" },
        city: "Overland Park",
        state: "KS",
        zip: "66207",
        beds: 5,
        baths: 3,
        sqFt: { value: 2567 },
        priceInfo: { amount: 450000 },
        pricePerSqFt: 175,
        lotSize: 14580,
        yearBuilt: 1967,
        status: { displayValue: "Coming Soon" },
        latLong: { latitude: 38.948, longitude: -94.639 },
        url: "/KS/Overland-Park/9932-Roe-Ave-66207/home/83302589",
        primaryPhotoUrl: "https://cdn.example.com/primary.jpg",
      },
      mediaBrowserInfo: {
        photos: [
          { photoUrls: { fullScreenPhotoUrl: "https://cdn.example.com/1.jpg" } },
          { photoUrls: { nonFullScreenPhotoUrl: "https://cdn.example.com/2.jpg" } },
        ],
      },
    },
    mainHouseInfoPanelInfo: {
      mainHouseInfo: {
        marketingRemarks: [{ marketingRemark: "Charmer &mdash; it&rsquo;s lovely" }],
      },
    },
    belowTheFold: {
      publicRecordsInfo: { basicInfo: { propertyTypeName: "Single Family Residential" } },
    },
  },
};

function mockDetail(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: async () => body });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  process.env.LISTINGS_PROVIDER = "rapidapi_redfin";
  process.env.RAPIDAPI_REDFIN_KEY = "test-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...originalEnv };
});

describe("fetchListingById on Redfin", () => {
  it("asks the detail endpoint for a listing page path, not a propertyId", async () => {
    const fetchMock = mockDetail(detailResponse);

    await fetchListingById("83302589");

    // properties/v3/detail?propertyId=... 404s on this host, which made every
    // detail lookup fall back to scanning search results.
    expect(fetchMock).toHaveBeenCalledWith(
      "https://redfin-com-data.p.rapidapi.com/property/detail?url=%2FKS%2Fx%2Fx%2Fhome%2F83302589",
      expect.anything(),
    );
  });

  it("maps the detail response onto a Listing", async () => {
    mockDetail(detailResponse);

    const listing = await fetchListingById("83302589");

    expect(listing).toMatchObject({
      id: "83302589",
      address: "9932 Roe Ave",
      city: "Overland Park",
      state: "KS",
      zipCode: "66207",
      price: 450000,
      beds: 5,
      baths: 3,
      sqft: 2567,
      status: "Coming Soon",
      propertyType: "Single Family Residential",
      yearBuilt: 1967,
      pricePerSqft: 175,
      photos: ["https://cdn.example.com/1.jpg", "https://cdn.example.com/2.jpg"],
      url: "https://www.redfin.com/KS/Overland-Park/9932-Roe-Ave-66207/home/83302589",
    });
    expect(listing?.description).toBe("Charmer — it’s lovely");
  });

  it("returns null when the id resolves to nothing", async () => {
    mockDetail({ currentPage: 1, data: null, message: "Not Found", status: false });

    expect(await fetchListingById("999999999")).toBeNull();
  });
});
