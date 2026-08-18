import type { Metadata } from "next";
import { fetchListings } from "@/lib/listings";
import ListingsClient, { type Listing } from "./ListingsClient";

export const dynamic = "force-dynamic";

const LISTINGS_PER_PAGE = 9;

export const metadata: Metadata = {
  title: "Kansas City Homes for Sale",
  description:
    "Browse homes for sale across the Kansas City metro — Overland Park, Olathe, Lenexa, Leawood and the surrounding area. Search by price, bedrooms and bathrooms with Geza Worku, BHG Kansas City Homes.",
  alternates: { canonical: "/listings" },
};

export default async function ListingsPage() {
  let listings: Listing[] = [];
  try {
    listings = (await fetchListings({ limit: LISTINGS_PER_PAGE, page: 1, offset: 0 })) as Listing[];
  } catch {
    // The client refetches through /api/listings, which renders the error state.
  }

  return (
    <ListingsClient
      initialListings={listings}
      initialHasMore={listings.length === LISTINGS_PER_PAGE}
    />
  );
}
