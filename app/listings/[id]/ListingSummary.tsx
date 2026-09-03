import Link from "next/link";
import type { Listing } from "@/lib/listings";

const SUMMARY_DESCRIPTION_LENGTH = 400;

const formatPrice = (price?: number): string | null =>
  typeof price === "number" && price > 0
    ? price.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : null;

function buildJsonLd(listing: Listing) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.address,
    url: `/listings/${listing.id}`,
    ...(listing.description ? { description: listing.description } : {}),
    ...(listing.photos?.length ? { image: listing.photos.slice(0, 8) } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.state,
      postalCode: listing.zipCode,
      addressCountry: "US",
    },
    ...(listing.lat && listing.lng
      ? { geo: { "@type": "GeoCoordinates", latitude: listing.lat, longitude: listing.lng } }
      : {}),
    ...(listing.price
      ? {
          offers: {
            "@type": "Offer",
            price: listing.price,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
    ...(listing.beds ? { numberOfBedrooms: listing.beds } : {}),
    ...(listing.baths ? { numberOfBathroomsTotal: listing.baths } : {}),
    ...(listing.sqft
      ? { floorSize: { "@type": "QuantitativeValue", value: listing.sqft, unitCode: "FTK" } }
      : {}),
    ...(listing.yearBuilt ? { yearBuilt: listing.yearBuilt } : {}),
  };
}

export default function ListingSummary({
  listing,
  id,
  isSignedIn,
}: {
  listing: Listing | null;
  id: string;
  isSignedIn: boolean;
}) {
  if (!listing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-lg shadow-md max-w-lg">
          <h1 className="text-2xl font-bold mb-3">Listing unavailable</h1>
          <p className="text-base">This property is no longer available or its details could not be retrieved.</p>
          <div className="mt-4">
            <Link href="/listings" className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
              Back to listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const price = formatPrice(listing.price);
  const location = [listing.city, listing.state, listing.zipCode].filter(Boolean).join(", ");
  const description = listing.description?.slice(0, SUMMARY_DESCRIPTION_LENGTH);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(listing)) }}
      />

      {listing.photos?.[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={listing.photos[0]}
          alt={listing.address}
          className="w-full max-h-[28rem] rounded-lg object-cover"
        />
      )}

      <h1 className="mt-6 text-3xl font-bold text-gray-900">{listing.address}</h1>
      {location && <p className="mt-1 text-lg text-gray-600">{location}</p>}
      {price && <p className="mt-4 text-3xl font-semibold text-green-700">{price}</p>}

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Beds", value: listing.beds },
          { label: "Baths", value: listing.baths },
          { label: "Sq ft", value: listing.sqft?.toLocaleString("en-US") },
          { label: "Year built", value: listing.yearBuilt },
        ]
          .filter((fact) => fact.value !== undefined && fact.value !== null)
          .map((fact) => (
            <div key={fact.label} className="rounded border border-gray-200 p-3 text-center">
              <dt className="text-sm text-gray-500">{fact.label}</dt>
              <dd className="text-lg font-semibold text-gray-900">{fact.value}</dd>
            </div>
          ))}
      </dl>

      {description && (
        <p className="mt-6 whitespace-pre-line text-gray-700">
          {description}
          {listing.description && listing.description.length > SUMMARY_DESCRIPTION_LENGTH ? "…" : ""}
        </p>
      )}

      <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6">
        {isSignedIn ? (
          <>
            <h2 className="text-xl font-semibold text-gray-900">Your account is pending approval</h2>
            <p className="mt-2 text-gray-700">
              Photos, MLS facts, HOA details, schools, taxes and listing history unlock once an
              administrator approves your account.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-900">See the full details</h2>
            <p className="mt-2 text-gray-700">
              Log in to see every photo, the full MLS fact sheet, HOA and tax details, nearby
              schools, listing history and the mortgage calculator.
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href={`/login?redirect=/listings/${id}`}
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded border border-green-600 px-4 py-2 text-green-700 hover:bg-green-50"
              >
                Create account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
