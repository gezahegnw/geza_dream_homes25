"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PropertyDetailPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProperty() {
      try {
        if (!params?.id) return;
        const response = await fetch(`/api/listings/${params.id}`);
        if (response.ok) {
          const result = await response.json();
          setData(result.property);
        }
      } catch (error) {
        console.error('Error loading property:', error);
      }
      setLoading(false);
    }
    loadProperty();
  }, [params?.id]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Property not found</div>;

  return (
    <div style={{padding: '20px', maxWidth: '1000px', margin: '0 auto'}}>
      <a href="/listings">← Back to Listings</a>
      
      <h1>{data.address || 'Property Address'}</h1>
      <p>{data.city}, {data.state} {data.zipCode}</p>
      
      <div>
        <p>Price: {data.price ? `$${data.price.toLocaleString()}` : 'N/A'}</p>
        <p>Beds: {data.beds || 'N/A'}</p>
        <p>Baths: {data.baths || 'N/A'}</p>
        <p>Sq Ft: {data.sqft ? `${data.sqft.toLocaleString()}` : 'N/A'}</p>
        <p>Status: {data.status || 'Active'}</p>
      </div>

      {data.photos && data.photos.length > 0 && (
        <div style={{marginBottom: '30px'}}>
          <h2 style={{marginBottom: '20px'}}>Photos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.photos.map((photo: any, i: number) => (
              <img 
                key={i}
                src={photo}
                alt={`Photo ${i + 1}`}
                style={{
                  width: '100%', 
                  height: '250px', 
                  objectFit: 'cover', 
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {data.description && (
        <div>
          <h2>Description</h2>
          <p>{data.description}</p>
        </div>
      )}

      <div>
        <h2>Contact</h2>
        <p>Gezahegn Worku - RE/MAX Beyond</p>
        <p>Phone: (913) 407-8620</p>
        <p>Email: gezarealesteteagent@gmail.com</p>
      </div>
    </div>
  );
}