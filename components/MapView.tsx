"use client";

import { useEffect, useRef } from 'react';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const validListings = listings.filter(l => l.lat && l.lng);

  useEffect(() => {
    if (!mapRef.current || validListings.length === 0) return;

    // Clear any existing content
    mapRef.current.innerHTML = '';

    // Create a simple HTML map using Leaflet CDN
    const mapHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 600px; width: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Calculate center
          const lats = ${JSON.stringify(validListings.map(l => l.lat))};
          const lngs = ${JSON.stringify(validListings.map(l => l.lng))};
          const centerLat = lats.reduce((a, b) => a + b) / lats.length;
          const centerLng = lngs.reduce((a, b) => a + b) / lngs.length;
          
          // Create map
          const map = L.map('map').setView([centerLat, centerLng], 12);
          
          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          
          // Add markers
          const listings = ${JSON.stringify(validListings)};
          listings.forEach(listing => {
            const marker = L.marker([listing.lat, listing.lng]).addTo(map);
            marker.bindPopup(\`
              <div>
                <strong>\${listing.address}</strong><br>
                \${listing.price ? '$' + listing.price.toLocaleString() : 'Price not available'}
              </div>
            \`);
          });
          
          // Fit bounds to show all markers
          if (listings.length > 1) {
            const group = new L.featureGroup(map._layers);
            map.fitBounds(group.getBounds().pad(0.1));
          }
        </script>
      </body>
      </html>
    `;

    // Create iframe with the map HTML
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    iframe.srcdoc = mapHtml;
    
    mapRef.current.appendChild(iframe);
  }, [validListings]);

  if (validListings.length === 0) {
    return <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">No listings with location data to display on map.</div>;
  }

  return (
    <div className="rounded-lg shadow-md overflow-hidden">
      <div ref={mapRef}></div>
    </div>
  );
}
