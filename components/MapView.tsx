"use client";

interface Listing {
  id: string;
  address: string;
  price?: number;
  lat?: number;
  lng?: number;
}

interface MapViewProps {
  listings: Listing[];
}

export default function MapView({ listings }: MapViewProps) {
  const validListings = listings.filter(l => l.lat && l.lng);

  if (validListings.length === 0) {
    return <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">No listings with location data to display on map.</div>;
  }

  // Calculate bounding box
  const minLat = Math.min(...validListings.map(l => l.lat!));
  const maxLat = Math.max(...validListings.map(l => l.lat!));
  const minLng = Math.min(...validListings.map(l => l.lng!));
  const maxLng = Math.max(...validListings.map(l => l.lng!));

  // Construct the iframe URL
  const markers = validListings.map(l => `marker=${l.lat},${l.lng}`).join('&');
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&${markers}`;

  return (
    <div className="rounded-lg shadow-md overflow-hidden">
      <iframe
        width="100%"
        height="600"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl}
        style={{ border: '1px solid black' }}
      ></iframe>
    </div>
  );
}
