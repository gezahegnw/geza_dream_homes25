'use client';

import { useState } from 'react';
import { Search, MapPin, Home, DollarSign } from 'lucide-react';

export default function PropertySearchWidget() {
  const [searchData, setSearchData] = useState({
    location: '',
    propertyType: 'any',
    priceRange: 'any',
    bedrooms: 'any'
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Construct search URL with parameters
    const params = new URLSearchParams();
    if (searchData.location) params.set('location', searchData.location);
    if (searchData.propertyType !== 'any') params.set('type', searchData.propertyType);
    if (searchData.priceRange !== 'any') params.set('price', searchData.priceRange);
    if (searchData.bedrooms !== 'any') params.set('beds', searchData.bedrooms);
    
    window.location.href = `/listings?${params.toString()}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-5 w-5 text-brand" />
        <h3 className="text-lg font-semibold text-gray-900">Find Your Dream Home</h3>
      </div>
      
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Location Input */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Enter city, neighborhood, or ZIP"
            value={searchData.location}
            onChange={(e) => setSearchData({...searchData, location: e.target.value})}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
          />
        </div>

        {/* Property Type */}
        <div className="relative">
          <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={searchData.propertyType}
            onChange={(e) => setSearchData({...searchData, propertyType: e.target.value})}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition-colors appearance-none bg-white"
          >
            <option value="any">Any Property Type</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="townhouse">Townhouse</option>
            <option value="apartment">Apartment</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={searchData.priceRange}
            onChange={(e) => setSearchData({...searchData, priceRange: e.target.value})}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition-colors appearance-none bg-white"
          >
            <option value="any">Any Price</option>
            <option value="0-200000">Under $200K</option>
            <option value="200000-400000">$200K - $400K</option>
            <option value="400000-600000">$400K - $600K</option>
            <option value="600000-800000">$600K - $800K</option>
            <option value="800000+">$800K+</option>
          </select>
        </div>

        {/* Bedrooms */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {['any', '1', '2', '3', '4+'].map((bed) => (
            <button
              key={bed}
              type="button"
              onClick={() => setSearchData({...searchData, bedrooms: bed})}
              className={`py-3 px-3 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                searchData.bedrooms === bed
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
            >
              {bed === 'any' ? 'Any' : bed === '4+' ? '4+' : `${bed}`}
            </button>
          ))}
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="w-full bg-brand text-white py-3 px-6 rounded-lg font-medium hover:bg-brand/90 transition-colors flex items-center justify-center gap-2 touch-manipulation active:bg-brand/80"
        >
          <Search className="h-4 w-4" />
          Search Properties
        </button>
      </form>
    </div>
  );
}
