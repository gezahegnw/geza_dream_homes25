"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PropertyDetailPage() {
  const params = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchPropertyDetails(params.id as string);
    }
  }, [params.id]);

  const fetchPropertyDetails = async (propertyId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/listings/${propertyId}`);
      
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/login?redirect=/listings/${propertyId}`;
          return;
        }
        throw new Error('Property not found');
      }
      
      const data = await res.json();
      setProperty(data.property);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!property) return <div>No property found</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <a href="/listings">← Back to Listings</a>
      
      <h1>{property.address}</h1>
      <p>{property.city}, {property.state} {property.zipCode}</p>
      
      <div>Status: {property.status || 'Active'}</div>
      
      {property.photos && property.photos.length > 0 && (
        <div>
          <h2>Photos</h2>
          {property.photos.map((photo, index) => (
            <img 
              key={index}
              src={photo}
              alt={`Photo ${index + 1}`}
              style={{ width: '300px', height: '200px', objectFit: 'cover', margin: '10px' }}
            />
          ))}
        </div>
      )}

      <div>
        <h2>Details</h2>
        <p>Price: {property.price ? `$${property.price.toLocaleString()}` : 'N/A'}</p>
        <p>Bedrooms: {property.beds || 'N/A'}</p>
        <p>Bathrooms: {property.baths || 'N/A'}</p>
        <p>Square Feet: {property.sqft ? `${property.sqft.toLocaleString()} sq ft` : 'N/A'}</p>
      </div>

      {property.description && (
        <div>
          <h2>Description</h2>
          <p>{property.description}</p>
        </div>
      )}
    </div>
  );
}