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
        timeOnRedfin: 5 * 86_400_000,
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
        mlsId: "2601483",
        source: { dataSourceDescription: "Heartland MLS" },
        listingAgents: [
          { agentInfo: { agentName: "Chelsea Fanders" }, brokerName: "Platinum Realty LLC" },
        ],
      },
    },
    schoolsAndDistrictsInfo: {
      servingThisHomeSchools: [
        {
          name: "Prairie Creek Elementary School",
          elementary: true,
          gradeRanges: "PreK-5",
          greatSchoolsRating: 8,
          distanceInMiles: "2.7",
          institutionType: "Public",
          schoolDistrict: { districtName: "Spring Hill School District" },
        },
      ],
    },
    belowTheFold: {
      publicRecordsInfo: {
        basicInfo: { propertyTypeName: "Single Family Residential" },
        taxInfo: { rollYear: 2025, taxesDue: 2007.27 },
      },
      propertyHistoryInfo: {
        events: [
          {
            eventDate: Date.UTC(2026, 0, 15),
            eventDescription: "Price Changed",
            price: 450000,
            source: "Heartland MLS",
          },
          { eventDescription: "No date, dropped" },
        ],
      },
      amenitiesInfo: {
        superGroups: [
          {
            titleString: "Parking",
            amenityGroups: [
              {
                groupTitle: "Parking Information",
                amenityEntries: [
                  {
                    amenityName: "Parking Features",
                    amenityValues: ["Attached", "Garage Faces Front"],
                    referenceName: "PARKING_FEATURES",
                  },
                  {
                    amenityName: "Garage Spaces",
                    amenityValues: ["3"],
                    referenceName: "GARAGE_SPACES",
                  },
                ],
              },
            ],
          },
          {
            titleString: "Location",
            amenityGroups: [
              {
                groupTitle: "HOA Information",
                amenityEntries: [
                  {
                    amenityName: "Association Name",
                    amenityValues: ["Wolf Run HOA"],
                    referenceName: "ASSOCIATION_NAME",
                  },
                  {
                    amenityName: "Association Fee",
                    amenityValues: ["$850"],
                    referenceName: "ASSOCIATION_FEE",
                  },
                  {
                    amenityName: "Association Fee Frequency",
                    amenityValues: ["Annually"],
                    referenceName: "ASSOCIATION_FEE_FREQUENCY",
                  },
                  {
                    amenityName: "Association Fee Includes",
                    amenityValues: ["Trash"],
                    referenceName: "ASSOCIATION_FEE_INCLUDES",
                  },
                  {
                    amenityName: "Construction Materials",
                    amenityValues: ["Board &amp; Batten Siding"],
                    referenceName: "CONSTRUCTION_MATERIALS",
                  },
                ],
              },
            ],
          },
        ],
      },
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

  it("maps the MLS fact sheet, HOA, taxes, schools and history", async () => {
    mockDetail(detailResponse);

    const listing = await fetchListingById("83302589");

    expect(listing).toMatchObject({
      garage: 3,
      hoaDues: 71,
      hoaName: "Wolf Run HOA",
      hoaIncludes: ["Trash"],
      taxesDue: 2007.27,
      taxYear: 2025,
      daysOnMarket: 5,
      mlsId: "2601483",
      mlsSource: "Heartland MLS",
      listingAgents: [{ name: "Chelsea Fanders", broker: "Platinum Realty LLC" }],
      schools: [
        {
          name: "Prairie Creek Elementary School",
          level: "Elementary",
          grades: "PreK-5",
          rating: 8,
          distanceMiles: 2.7,
          district: "Spring Hill School District",
        },
      ],
    });

    // Only dated events make it into the timeline.
    expect(listing?.priceHistory).toEqual([
      {
        date: new Date(Date.UTC(2026, 0, 15)).toISOString(),
        event: "Price Changed",
        price: 450000,
        source: "Heartland MLS",
      },
    ]);

    expect(listing?.featureGroups).toContainEqual({
      section: "Parking",
      title: "Parking Information",
      entries: [
        { name: "Parking Features", values: ["Attached", "Garage Faces Front"] },
        { name: "Garage Spaces", values: ["3"] },
      ],
    });

    const location = listing?.featureGroups?.find((group) => group.section === "Location");
    expect(location?.entries).toContainEqual({
      name: "Construction Materials",
      values: ["Board & Batten Siding"],
    });
  });

  it("returns null when the id resolves to nothing", async () => {
    mockDetail({ currentPage: 1, data: null, message: "Not Found", status: false });

    expect(await fetchListingById("999999999")).toBeNull();
  });
});
