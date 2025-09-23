"use client";

import { useState } from 'react';

interface FilterValues {
  minPrice: string;
  maxPrice: string;
  beds: string;
  baths: string;
  sortBy: string;
}

interface FilterPanelProps {
  onFilterChange: (filters: Partial<FilterValues>) => void;
}

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({ minPrice: '', maxPrice: '', beds: '', baths: '', sortBy: 'newest' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    onFilterChange(filters);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left font-semibold text-lg mb-2 flex justify-between items-center"
      >
        <span>Filter & Sort</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4">
          {/* Price Inputs */}
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700">Min Price</label>
            <input type="number" name="minPrice" id="minPrice" value={filters.minPrice} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="$ Any" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700">Max Price</label>
            <input type="number" name="maxPrice" id="maxPrice" value={filters.maxPrice} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="$ Any" />
          </div>

          {/* Beds & Baths Selectors */}
          <div>
            <label htmlFor="beds" className="block text-sm font-medium text-gray-700">Beds</label>
            <select name="beds" id="beds" value={filters.beds} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>
          <div>
            <label htmlFor="baths" className="block text-sm font-medium text-gray-700">Baths</label>
            <select name="baths" id="baths" value={filters.baths} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">Sort By</label>
            <select name="sortBy" id="sortBy" value={filters.sortBy} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          <div className="col-span-full flex justify-end mt-2">
            <button 
              onClick={applyFilters}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
