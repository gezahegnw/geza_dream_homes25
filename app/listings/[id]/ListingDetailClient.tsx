"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MortgageCalculator from "@/components/MortgageCalculator";
import ShareListing from "@/components/ShareListing";
import NeighborhoodInsights from "@/components/NeighborhoodInsights";
import PriceHistory from "@/components/PriceHistory";
import type { ListingFeatureGroup } from "@/lib/listings";

const DESCRIPTION_PREVIEW_LENGTH = 600;

// Provider lookups for a listing that no longer exists can take tens of
// seconds, so give up rather than leaving the page spinning.
const PROPERTY_FETCH_TIMEOUT_MS = 30_000;

const formatEventDate = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const groupFeaturesBySection = (
  groups: ListingFeatureGroup[],
): [string, ListingFeatureGroup[]][] => {
  const bySection = new Map<string, ListingFeatureGroup[]>();
  for (const group of groups) {
    const existing = bySection.get(group.section);
    if (existing) existing.push(group);
    else bySection.set(group.section, [group]);
  }
  return Array.from(bySection.entries());
};

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

export default function ListingDetailClient() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const retry = () => {
    setError(null);
    setNotFound(false);
    setLoading(true);
    setAttempt((current) => current + 1);
  };

  useEffect(() => {
    // Check authentication status on component mount
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json();
        const authenticated = data.user !== null;
        const approved = data.user?.approved === true;
        setIsAuthenticated(authenticated);
        if (!authenticated) {
          setError('You must be logged in to view property details. Please log in or sign up to continue.');
          setLoading(false);
          return;
        }
        if (!approved) {
          setError('Your account is pending approval. You will be able to view property details once an administrator approves your account.');
          setLoading(false);
          return;
        }
      } catch {
        setIsAuthenticated(false);
        setError('You must be logged in to view property details. Please log in or sign up to continue.');
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    async function loadProperty() {
      try {
        if (!params?.id) return;
        // The search context lets the API resolve ids that only exist inside
        // that search's results.
        const q = new URLSearchParams(window.location.search).get("q");
        const query = q ? `?q=${encodeURIComponent(q)}` : "";
        const response = await fetch(`/api/listings/${params.id}${query}`, {
          signal: AbortSignal.timeout(PROPERTY_FETCH_TIMEOUT_MS),
        });
        if (response.ok) {
          const result = await response.json();
          console.log('Property data:', result.property); // Debug log
          setData(result.property);
        } else if (response.status === 401 || response.status === 403) {
          setError('Your account is pending approval. You will be able to view property details once your account is activated.');
        } else if (response.status === 404) {
          setNotFound(true);
        } else {
          setError('Failed to load property data.');
        }
      } catch (error) {
        console.error('Error loading property:', error);
        setError('This listing is taking too long to load. Please try again.');
      }
      setLoading(false);
    }
    
    // Only load property if authenticated
    if (isAuthenticated === true) {
      loadProperty();
    }
  }, [params?.id, isAuthenticated, attempt]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 animate-pulse" role="status" aria-label="Loading property">
        <div className="h-96 rounded-lg bg-gray-200" />
        <div className="mt-6 h-8 w-2/3 rounded bg-gray-200" />
        <div className="mt-3 h-5 w-1/3 rounded bg-gray-200" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded bg-gray-200" />
          ))}
        </div>
        <p className="mt-6 text-sm text-gray-500">Loading property details…</p>
      </div>
    );
  }
  if (notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-lg shadow-md max-w-lg">
          <h2 className="text-2xl font-bold mb-3">Listing unavailable</h2>
          <p className="text-base">This property is no longer available or its details could not be retrieved.</p>
          <div className="mt-4">
            <a href="/listings" className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">Back to listings</a>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    const isPending = error.includes('pending approval');
    const isAccessError = isPending || isAuthenticated === false;
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-lg shadow-md max-w-lg">
          <h2 className="text-2xl font-bold mb-3">{isAccessError ? 'Access Denied' : "Couldn't load this listing"}</h2>
          <p className="text-base">{error}</p>
          {isAuthenticated === false && !isPending && (
            <div className="mt-4 flex gap-3 justify-center">
              <a href={`/login?redirect=/listings/${params?.id}`} className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">Log in</a>
              <a href="/signup" className="rounded border border-green-600 px-4 py-2 text-green-700 hover:bg-green-50">Create account</a>
            </div>
          )}
          {!isAccessError && (
            <div className="mt-4 flex gap-3 justify-center">
              <button onClick={retry} className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">Try again</button>
              <a href="/listings" className="rounded border border-green-600 px-4 py-2 text-green-700 hover:bg-green-50">Back to listings</a>
            </div>
          )}
          <p className="mt-4 text-sm">If you believe this is an error, please contact support.</p>
        </div>
      </div>
    );
  }

  if (!data) return <div>Property not found</div>;

  const featureSections = groupFeaturesBySection(
    (data.featureGroups ?? []) as ListingFeatureGroup[],
  );

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
        <div className="flex justify-between items-start">
          <div>
            <h1 style={{fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 10px 0', color: '#1f2937'}}>
              {data.address || 'Property Address'}
            </h1>
            <p style={{fontSize: '1.2rem', color: '#6b7280', margin: '0'}}>
              {data.city}, {data.state} {data.zipCode}
            </p>
          </div>
          <ShareListing 
            listingUrl={`/listings/${params?.id}`}
            listingTitle={data.address || 'Property'}
            listingPrice={data.price ? `$${data.price.toLocaleString()}` : undefined}
          />
        </div>
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
              {typeof data.taxesDue === 'number' && (
                <div style={{minWidth: '120px'}}>
                  <span style={{fontSize: '1.2rem', fontWeight: '600', color: '#1f2937'}}>
                    ${Math.round(data.taxesDue).toLocaleString()}/yr
                  </span>
                  <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>
                    Property Tax{data.taxYear ? ` (${data.taxYear})` : ''}
                  </p>
                </div>
              )}
              {typeof data.daysOnMarket === 'number' && (
                <div style={{minWidth: '120px'}}>
                  <span style={{fontSize: '1.2rem', fontWeight: '600', color: '#1f2937'}}>
                    {data.daysOnMarket} {data.daysOnMarket === 1 ? 'day' : 'days'}
                  </span>
                  <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>On Market</p>
                </div>
              )}
            </div>
            {(data.hoaName || data.hoaAmenities?.length || data.hoaIncludes?.length) && (
              <p className="mt-5 text-sm text-gray-600">
                {[
                  data.hoaName ? `HOA: ${data.hoaName}` : null,
                  data.hoaAmenities?.length ? `Amenities: ${data.hoaAmenities.join(', ')}` : null,
                  data.hoaIncludes?.length ? `Dues include: ${data.hoaIncludes.join(', ')}` : null,
                ].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          {/* Description */}
          {data.description && (
            <div>
              <h2 style={{fontSize: '1.5rem', fontWeight: '600', marginBottom: '12px', color: '#1e293b'}}>
                About This Home
              </h2>
              <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                {showFullDescription || data.description.length <= DESCRIPTION_PREVIEW_LENGTH
                  ? data.description
                  : `${data.description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}…`}
              </p>
              {data.description.length > DESCRIPTION_PREVIEW_LENGTH && (
                <button
                  type="button"
                  onClick={() => setShowFullDescription((shown) => !shown)}
                  className="mt-2 text-green-700 font-medium hover:underline"
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}

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

          {/* MLS fact sheet */}
          {Array.isArray(data.featureGroups) && data.featureGroups.length > 0 && (
            <div>
              <h2 style={{fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: '#1e293b'}}>
                Home Facts &amp; Features
              </h2>
              <div className="space-y-4">
                {featureSections.map(([section, groups]) => (
                  <details key={section} className="rounded-lg border border-gray-200 bg-white p-4" open>
                    <summary className="cursor-pointer text-lg font-semibold text-gray-800">{section}</summary>
                    <div className="mt-3 space-y-4">
                      {groups.map((group) => (
                        <div key={group.title}>
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{group.title}</h4>
                          <ul className="mt-1 space-y-1 text-sm text-gray-700">
                            {group.entries.map((entry, i) => (
                              <li key={i}>
                                {entry.name ? <span className="font-medium">{entry.name}: </span> : null}
                                {entry.values.join(', ')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Schools */}
          {Array.isArray(data.schools) && data.schools.length > 0 && (
            <div>
              <h2 style={{fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: '#1e293b'}}>
                Nearby Schools
              </h2>
              <div className="space-y-3">
                {data.schools.map((school: any, i: number) => (
                  <div key={i} className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4">
                    <div>
                      <p className="font-semibold text-gray-800">{school.name}</p>
                      <p className="text-sm text-gray-600">
                        {[school.level, school.grades, school.institutionType, school.district]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {typeof school.rating === 'number' && (
                        <p className="text-sm font-semibold text-green-700">{school.rating}/10</p>
                      )}
                      {typeof school.distanceMiles === 'number' && (
                        <p className="text-sm text-gray-500">{school.distanceMiles} mi</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                School ratings provided by GreatSchools. Verify enrollment eligibility with the district.
              </p>
            </div>
          )}

          {/* Listing history */}
          {Array.isArray(data.priceHistory) && data.priceHistory.length > 0 && (
            <div>
              <h2 style={{fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: '#1e293b'}}>
                Listing History
              </h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 font-medium">Event</th>
                    <th className="py-2 font-medium">Price</th>
                    <th className="py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {data.priceHistory.map((event: any, i: number) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 text-gray-700">{formatEventDate(event.date)}</td>
                      <td className="py-2 text-gray-700">{event.event}</td>
                      <td className="py-2 text-gray-700">
                        {typeof event.price === 'number' ? `$${event.price.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-2 text-gray-500">{event.source || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MLS attribution */}
          {(data.mlsId || data.listingAgents?.length) && (
            <p className="text-sm text-gray-500">
              {data.listingAgents?.length
                ? `Listed by ${data.listingAgents
                    .map((agent: any) => (agent.broker ? `${agent.name} (${agent.broker})` : agent.name))
                    .join(', ')}. `
                : ''}
              {data.mlsId ? `MLS# ${data.mlsId}${data.mlsSource ? ` · ${data.mlsSource}` : ''}.` : ''}
            </p>
          )}
        </div>

        {/* Right Column for Calculator */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <MortgageCalculator price={data.price || 400000} />
            <PriceHistory 
              propertyId={params?.id as string}
              currentPrice={data.price}
            />
            <NeighborhoodInsights 
              propertyId={params?.id as string}
              address={data.address}
              lat={data.lat}
              lng={data.lng}
            />
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#059669', 
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
            BHG Kansas City Homes
          </p>
        </div>
        <div style={{display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap'}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <p style={{fontSize: '1.1rem', fontWeight: '500', margin: '0 0 5px 0', color: 'white'}}>
              Gezahegn Worku
            </p>
            <a href="tel:+19134078620" style={{color: 'white', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500'}}>
              📞 Cell (913) 407-8620
            </a>
            <a href="tel:+19139816050" style={{color: 'white', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500', marginTop: '5px'}}>
              📞 Office (913) 981-6050
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