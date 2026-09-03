import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const fetchListingById = vi.fn();
const fetchListings = vi.fn();
const cookieGet = vi.fn();
const verifySessionToken = vi.fn();

vi.mock("@/lib/listings", () => ({
  fetchListingById: (...a: unknown[]) => fetchListingById(...a),
  fetchListings: (...a: unknown[]) => fetchListings(...a),
  clearListingCaches: () => {},
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet }),
}));

vi.mock("@/lib/auth", () => ({
  sessionCookie: { name: "auth_token" },
  verifySessionToken: (...a: unknown[]) => verifySessionToken(...a),
}));

vi.mock("@/app/listings/[id]/ListingDetailClient", () => ({
  default: () => <div>interactive listing detail</div>,
}));

const ListingPage = (await import("@/app/listings/[id]/page")).default;
const { generateMetadata } = await import("@/app/listings/[id]/page");
const { clearResolvedListings } = await import("@/lib/resolve-listing");

const listing = {
  id: "42",
  address: "13477 W 177th St",
  city: "Bucyrus",
  state: "KS",
  zipCode: "66013",
  price: 725000,
  beds: 5,
  baths: 4,
  sqft: 2756,
  photos: ["https://cdn.example.com/1.jpg"],
  description: "Stunning new construction on a walkout lot.",
};

const props = (id = "42") => ({
  params: Promise.resolve({ id }),
  searchParams: Promise.resolve({}),
});

beforeEach(() => {
  clearResolvedListings();
  fetchListingById.mockReset().mockResolvedValue(listing);
  fetchListings.mockReset().mockResolvedValue([]);
  cookieGet.mockReset().mockReturnValue(undefined);
  verifySessionToken.mockReset().mockResolvedValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listing detail page", () => {
  it("server-renders the listing for a signed-out visitor instead of an empty shell", async () => {
    render(await ListingPage(props()));

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("13477 W 177th St");
    expect(screen.getByText("Bucyrus, KS, 66013")).toBeTruthy();
    expect(screen.getByText("$725,000")).toBeTruthy();
    expect(screen.getByText(/Stunning new construction/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Log in" }).getAttribute("href")).toBe(
      "/login?redirect=/listings/42",
    );
  });

  it("emits RealEstateListing structured data crawlers can read", async () => {
    const { container } = render(await ListingPage(props()));

    const script = container.querySelector('script[type="application/ld+json"]');
    const jsonLd = JSON.parse(script?.textContent ?? "{}");
    expect(jsonLd["@type"]).toBe("RealEstateListing");
    expect(jsonLd.offers.price).toBe(725000);
    expect(jsonLd.address.addressLocality).toBe("Bucyrus");
    expect(jsonLd.numberOfBedrooms).toBe(5);
  });

  it("hands approved visitors the interactive page", async () => {
    cookieGet.mockReturnValue({ value: "token" });
    verifySessionToken.mockResolvedValue({ approved: true });

    render(await ListingPage(props()));

    expect(screen.getByText("interactive listing detail")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Log in" })).toBeNull();
  });

  it("tells a pending visitor why details are missing rather than offering login", async () => {
    cookieGet.mockReturnValue({ value: "token" });
    verifySessionToken.mockResolvedValue({ approved: false });

    render(await ListingPage(props()));

    expect(screen.getByText(/pending approval/i)).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Log in" })).toBeNull();
  });

  it("says the listing is unavailable when the provider cannot resolve it", async () => {
    fetchListingById.mockResolvedValue(null);

    render(await ListingPage(props("999")));

    expect(screen.getByText("Listing unavailable")).toBeTruthy();
  });

  it("builds metadata from the listing and de-indexes unresolvable ids", async () => {
    const meta = await generateMetadata(props());
    expect(meta.title).toBe("13477 W 177th St, Bucyrus, KS — $725,000");
    expect(meta.alternates?.canonical).toBe("/listings/42");
    expect(meta.openGraph?.images).toEqual(["https://cdn.example.com/1.jpg"]);

    clearResolvedListings();
    fetchListingById.mockResolvedValue(null);
    const missing = await generateMetadata(props("999"));
    expect(missing.robots).toEqual({ index: false, follow: true });
  });
});
