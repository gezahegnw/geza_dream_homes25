import type { Metadata } from "next";
import { cookies } from "next/headers";
import { sessionCookie, verifySessionToken } from "@/lib/auth";
import { resolveListing } from "@/lib/resolve-listing";
import type { Listing } from "@/lib/listings";
import ListingDetailClient from "./ListingDetailClient";
import ListingSummary from "./ListingSummary";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const firstValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const priceLabel = (price?: number): string | null =>
  typeof price === "number" && price > 0
    ? price.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : null;

const fullAddress = (listing: Listing): string =>
  [listing.address, listing.city, listing.state].filter(Boolean).join(", ");

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await resolveListing(id, firstValue((await searchParams).q)?.trim());
  if (!listing) {
    return { title: "Listing unavailable", robots: { index: false, follow: true } };
  }

  const price = priceLabel(listing.price);
  const facts = [
    listing.beds ? `${listing.beds} bed` : null,
    listing.baths ? `${listing.baths} bath` : null,
    listing.sqft ? `${listing.sqft.toLocaleString("en-US")} sqft` : null,
  ].filter(Boolean).join(" · ");

  return {
    title: [fullAddress(listing), price].filter(Boolean).join(" — "),
    description:
      listing.description?.slice(0, 200) ??
      `${fullAddress(listing)}${facts ? ` — ${facts}` : ""}. For sale with Geza Worku, BHG Kansas City Homes.`,
    alternates: { canonical: `/listings/${id}` },
    openGraph: {
      title: [fullAddress(listing), price].filter(Boolean).join(" — "),
      description: facts || undefined,
      images: listing.photos?.[0] ? [listing.photos[0]] : undefined,
      type: "website",
    },
  };
}

export default async function ListingPage({ params, searchParams }: PageProps) {
  const { id } = await params;

  const token = (await cookies()).get(sessionCookie.name)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Approved visitors get the full interactive page; everyone else — Googlebot
  // included — gets a server-rendered public summary instead of an empty shell.
  if (session?.approved) {
    return <ListingDetailClient />;
  }

  const listing = await resolveListing(id, firstValue((await searchParams).q)?.trim());
  return <ListingSummary listing={listing} id={id} isSignedIn={session !== null} />;
}
