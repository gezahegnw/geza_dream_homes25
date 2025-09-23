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
    <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif'}}>
      <div style={{marginBottom: '20px'}}>
        <a href="/listings" style={{color: '#2563eb', textDecoration: 'none', fontSize: '16px'}}>
          ← Back to Listings
        </a>
      </div>
      
      <div style={{marginBottom: '30px', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px'}}>
        <h1 style={{fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 10px 0', color: '#1f2937'}}>
          {data.address || 'Property Address'}
        </h1>
        <p style={{fontSize: '1.2rem', color: '#6b7280', margin: '0'}}>
          {data.city}, {data.state} {data.zipCode}
        </p>
      </div>
      
      <div style={{
        backgroundColor: '#f8fafc', 
        padding: '25px', 
        borderRadius: '12px', 
        marginBottom: '30px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: '#1e293b'}}>
          Property Details
        </h2>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px'}}>
          <div style={{minWidth: '150px'}}>
            <span style={{fontSize: '2rem', fontWeight: 'bold', color: '#059669'}}>
              {data.price ? `$${data.price.toLocaleString()}` : 'N/A'}
            </span>
            <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>Price</p>
          </div>
          <div style={{minWidth: '100px'}}>
            <span style={{fontSize: '1.5rem', fontWeight: '600', color: '#1f2937'}}>
              {data.beds || 'N/A'}
            </span>
            <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>Beds</p>
          </div>
          <div style={{minWidth: '100px'}}>
            <span style={{fontSize: '1.5rem', fontWeight: '600', color: '#1f2937'}}>
              {data.baths || 'N/A'}
            </span>
            <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>Baths</p>
          </div>
          <div style={{minWidth: '120px'}}>
            <span style={{fontSize: '1.5rem', fontWeight: '600', color: '#1f2937'}}>
              {data.sqft ? `${data.sqft.toLocaleString()}` : 'N/A'}
            </span>
            <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>Sq Ft</p>
          </div>
          <div style={{minWidth: '100px'}}>
            <span style={{
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#ffffff',
              backgroundColor: '#10b981',
              padding: '4px 12px',
              borderRadius: '20px'
            }}>
              {data.status || 'Active'}
            </span>
            <p style={{margin: '5px 0 0 0', color: '#6b7280', fontSize: '0.9rem'}}>Status</p>
          </div>
        </div>
      </div>

      {data.photos && data.photos.length > 0 && (
        <div style={{marginBottom: '40px'}}>
          <h2 style={{fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: '#1e293b'}}>
            Property Photos
          </h2>
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

      <div style={{
        backgroundColor: '#1e40af', 
        color: 'white',
        padding: '30px', 
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <h2 style={{fontSize: '1.8rem', fontWeight: '600', marginBottom: '15px', margin: '0 0 15px 0'}}>
          Contact Your Agent
        </h2>
        <div style={{marginBottom: '20px'}}>
          <p style={{fontSize: '1.2rem', fontWeight: '500', margin: '0 0 5px 0'}}>
            Gezahegn Worku
          </p>
          <p style={{fontSize: '1rem', opacity: '0.9', margin: '0'}}>
            RE/MAX Beyond
          </p>
        </div>
        <div style={{display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap'}}>
          <a href="tel:+19134078620" style={{color: 'white', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500'}}>
            📞 Call (913) 407-8620
          </a>
          <a href="mailto:gezarealesteteagent@gmail.com" style={{color: 'white', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500'}}>
            📧 Email Geza
          </a>
        </div>
        <p style={{fontSize: '0.95rem', opacity: '0.9', marginTop: '15px', margin: '15px 0 0 0'}}>
          Ready to schedule a viewing? Contact me today!
        </p>
      </div>
    </div>
  );
}