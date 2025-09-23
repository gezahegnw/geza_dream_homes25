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
      
      {/* Property Overview */}
      <div style={{backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
        <h2 style={{marginBottom: '15px', fontSize: '1.5rem'}}>Property Overview</h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
          <div>
            <strong>Price:</strong> {data.price ? `$${data.price.toLocaleString()}` : 'N/A'}
          </div>
          <div>
            <strong>Beds:</strong> {data.beds || 'N/A'}
          </div>
          <div>
            <strong>Baths:</strong> {data.baths || 'N/A'}
          </div>
          <div>
            <strong>Square Feet:</strong> {data.sqft ? `${data.sqft.toLocaleString()} sq ft` : 'N/A'}
          </div>
          {data.pricePerSqft && (
            <div>
              <strong>Price/Sq Ft:</strong> ${data.pricePerSqft}
            </div>
          )}
          <div>
            <strong>Status:</strong> {data.status || 'Active'}
          </div>
          {data.propertyType && (
            <div>
              <strong>Property Type:</strong> {data.propertyType}
            </div>
          )}
          {data.yearBuilt && (
            <div>
              <strong>Year Built:</strong> {data.yearBuilt}
            </div>
          )}
          {data.lotSize && (
            <div>
              <strong>Lot Size:</strong> {data.lotSize.toLocaleString()} sq ft
            </div>
          )}
          {data.garage && (
            <div>
              <strong>Garage:</strong> {data.garage} spaces
            </div>
          )}
          {data.hoaDues && (
            <div>
              <strong>HOA Dues:</strong> ${data.hoaDues}/month
            </div>
          )}
        </div>
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

      {/* Additional Links */}
      {data.url && (
        <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px'}}>
          <h3>View Original Listing</h3>
          <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{color: '#1976d2', textDecoration: 'underline'}}
          >
            View on Redfin →
          </a>
        </div>
      )}

      {/* Contact Information */}
      <div style={{backgroundColor: '#f1f8e9', padding: '20px', borderRadius: '8px'}}>
        <h2>Contact Your Agent</h2>
        <div style={{marginTop: '10px'}}>
          <p><strong>Gezahegn Worku</strong> - RE/MAX Beyond</p>
          <p>📞 Phone: <a href="tel:+19134078620" style={{color: '#2e7d32'}}>(913) 407-8620</a></p>
          <p>📧 Email: <a href="mailto:gezarealesteteagent@gmail.com" style={{color: '#2e7d32'}}>gezarealesteteagent@gmail.com</a></p>
          <p style={{marginTop: '10px', fontStyle: 'italic'}}>
            Ready to schedule a viewing or have questions? Contact me today!
          </p>
        </div>
      </div>
    </div>
  );
}