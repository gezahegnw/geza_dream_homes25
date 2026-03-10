"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MortgageCalculator from "@/components/MortgageCalculator";

// Helper function to map property type codes to readable names
const getPropertyTypeName = (propertyType: any): string => {
  if (!propertyType) return 'Single Family';
  
  // If it's already a string, return it
  if (typeof propertyType === 'string') return propertyType;
  
  // Extract value from object structure
  let typeValue = propertyType;
  if (typeof propertyType === 'object' && propertyType.value !== undefined) {
    typeValue = propertyType.value;
  }
  
  // Convert numeric codes to property type names
  const typeMap: { [key: string]: string } = {
    '1': 'Single Family',
    '2': 'Condo',
    '3': 'Townhouse',
    '4': 'Multi-Family',
    '5': 'Land',
    '6': 'Single Family',
    '7': 'Apartment',
    '8': 'Mobile/Manufactured',
    '9': 'Farm/Ranch',
  };
  
  const typeStr = String(typeValue);
  return typeMap[typeStr] || typeStr;
};

export default function PropertyDetailPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      try {
        if (!params?.id) return;
        const response = await fetch(`/api/listings/${params.id}`);
        if (response.ok) {
          const result = await response.json();
          console.log('Property data:', result.property); // Debug log
          setData(result.property);
        } else if (response.status === 401 || response.status === 403) {
          setError('Your account is pending approval. You will be able to view property details once your account is activated.');
        } else {
          setError('Failed to load property data.');
        }
      } catch (error) {
        console.error('Error loading property:', error);
      }
      setLoading(false);
    }
    loadProperty();
  }, [params?.id]);

  if (loading) return <div>Loading...</div>;
  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-lg shadow-md max-w-lg">
          <h2 className="text-2xl font-bold mb-3">Access Denied</h2>
          <p className="text-base">{error}</p>
          <p className="mt-4 text-sm">If you believe this is an error, please contact support.</p>
        </div>
      </div>
    );
  }

  if (!data) return <div>Property not found</div>;

  return (
    <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif'}}>
      <div style={{marginBottom: '20px'}}>
        <a href="/listings" className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Listings
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Property Details Card */}
          <div style={{
            backgroundColor: '#f8fafc', 
            padding: '25px', 
            borderRadius: '12px', 
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
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px'}}>
              <div style={{minWidth: '120px'}}>
                <span style={{fontSize: '1.2rem', fontWeight: '600', color: '#1f2937'}}>
                  {getPropertyTypeName(data.propertyType)}
                </span>
                <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>Property Type</p>
              </div>
              {data.yearBuilt && (
                <div style={{minWidth: '120px'}}>
                  <span style={{fontSize: '1.2rem', fontWeight: '600', color: '#1f2937'}}>
                    {typeof data.yearBuilt === 'object' && data.yearBuilt.value ? String(data.yearBuilt.value) : (typeof data.yearBuilt === 'number' || typeof data.yearBuilt === 'string' ? String(data.yearBuilt) : 'N/A')}
                  </span>
                  <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>Year Built</p>
                </div>
              )}
              {data.hoaDues && (
                <div style={{minWidth: '120px'}}>
                  <span style={{fontSize: '1.2rem', fontWeight: '600', color: '#1f2937'}}>
                    {typeof data.hoaDues === 'object' && data.hoaDues.value ? `$${String(data.hoaDues.value)}/mo` : (typeof data.hoaDues === 'number' || typeof data.hoaDues === 'string' ? `$${String(data.hoaDues)}/mo` : 'N/A')}
                  </span>
                  <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>HOA Dues</p>
                </div>
              )}
              <div style={{minWidth: '120px'}}>
                <span style={{fontSize: '1.2rem', fontWeight: '600', color: '#1f2937'}}>
                  {(() => {
                    if (!data.garage) return '2 car';
                    if (typeof data.garage === 'object' && data.garage.value) return `${String(data.garage.value)} car`;
                    if (typeof data.garage === 'number' || typeof data.garage === 'string') return `${String(data.garage)} car`;
                    return '2 car';
                  })()}
                </span>
                <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>Garage</p>
              </div>
              {data.lotSize && (
                <div style={{minWidth: '120px'}}>
                  <span style={{fontSize: '1.2rem', fontWeight: '600', color: '#1f2937'}}>
                    {typeof data.lotSize === 'object' && data.lotSize.value ? `${Number(data.lotSize.value).toLocaleString()} sq ft` : (typeof data.lotSize === 'number' ? `${Number(data.lotSize).toLocaleString()} sq ft` : 'N/A')}
                  </span>
                  <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>Lot Size</p>
                </div>
              )}
              {data.pricePerSqft && (
                <div style={{minWidth: '120px'}}>
                  <span style={{fontSize: '1.2rem', fontWeight: '600', color: '#1f2937'}}>
                    {typeof data.pricePerSqft === 'object' && data.pricePerSqft.value ? `$${String(data.pricePerSqft.value)}/sqft` : (typeof data.pricePerSqft === 'number' || typeof data.pricePerSqft === 'string' ? `$${String(data.pricePerSqft)}/sqft` : 'N/A')}
                  </span>
                  <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>Price/Sq Ft</p>
                </div>
              )}
            </div>
          </div>

          {/* Photos Section */}
          {data.photos && data.photos.length > 0 && (
            <div style={{marginBottom: '40px'}}>
              <h2 style={{fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: '#1e293b'}}>
                Property Photos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Right Column for Calculator */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <MortgageCalculator price={data.price || 400000} />
          </div>
        </div>
      </div>

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
            Better Homes and Gardens Kansas City
          </p>
        </div>
        <div style={{display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap'}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <p style={{fontSize: '1.1rem', fontWeight: '500', margin: '0 0 5px 0', color: 'white'}}>
              Gezahegn Worku
            </p>
            <a href="tel:+19134078620" style={{color: 'white', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500'}}>
              📞 Call (913) 407-8620
            </a>
          </div>
          <a href="mailto:gezarealestateagent@gmail.com" style={{color: 'white', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500'}}>
            📧 gezarealestateagent@gmail.com
          </a>
        </div>
        <p style={{fontSize: '0.95rem', opacity: '0.9', marginTop: '15px', margin: '15px 0 0 0'}}>
          Ready to schedule a viewing? Contact me today!
        </p>
      </div>

      <div style={{textAlign: 'center', marginTop: '40px', paddingBottom: '20px'}}>
        <p style={{fontSize: '0.8rem', color: '#9ca3af'}}>
          Listing data powered by <a href="https://rapidapi.com" target="_blank" rel="noopener noreferrer" style={{color: '#6b7280', textDecoration: 'underline'}}>RapidAPI</a>.
        </p>
      </div>
    </div>
  );
}