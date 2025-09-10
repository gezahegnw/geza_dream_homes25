import Image from 'next/image';

const listings = [
  {
    id: 1,
    title: 'Luxury Family Home',
    address: '123 Dream St, Kansas City, MO',
    price: '$489,900',
    beds: 4,
    baths: 3.5,
    sqft: '3,200',
    image: '/Photos/home1.jpg'
  },
  {
    id: 2,
    title: 'Modern Downtown Condo',
    address: '456 Urban Ave, Kansas City, MO',
    price: '$325,000',
    beds: 2,
    baths: 2,
    sqft: '1,450',
    image: '/Photos/home10.jpg'
  },
  {
    id: 3,
    title: 'Suburban Retreat',
    address: '789 Quiet Ln, Overland Park, KS',
    price: '$575,000',
    beds: 5,
    baths: 4,
    sqft: '3,850',
    image: '/Photos/home11.jpg'
  }
];

export default function FeaturedListings() {
  return (
    <section id="featured" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl">
          Featured Listings
        </h2>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((property) => (
            <div key={property.id} className="overflow-hidden rounded-xl bg-white shadow-lg transition-transform hover:shadow-xl hover:-translate-y-1">
              <div className="relative h-64 w-full">
                <Image
                  src={property.image}
                  alt={property.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                />
                <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-brand">
                  {property.price}
                </div>
              </div>
              <div className="p-6">
                <h3 className="mb-2 text-xl font-bold">{property.title}</h3>
                <p className="mb-4 text-gray-600">{property.address}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{property.beds} Beds</span>
                  <span>{property.baths} Baths</span>
                  <span>{property.sqft} sqft</span>
                </div>
                <button className="mt-4 w-full rounded-lg bg-brand py-2 font-medium text-white hover:bg-brand/90">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <a 
            href="/listings" 
            className="inline-block rounded-lg bg-gray-900 px-8 py-3 font-medium text-white hover:bg-gray-800"
          >
            View All Listings
          </a>
        </div>
      </div>
    </section>
  );
}
