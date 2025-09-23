"use client";

import { useEffect, useState } from 'react';

interface SavedSearch {
  id: string;
  name: string;
  filters: any;
}

export default function MySearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSearches() {
      try {
        const res = await fetch('/api/saved-searches');
        if (res.ok) {
          const data = await res.json();
          setSearches(data.searches || []);
        } else {
          // Handle not logged in or other errors
          window.location.href = '/login?redirect=/my-searches';
        }
      } catch (error) {
        console.error('Failed to fetch searches:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSearches();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) return;
    try {
      const res = await fetch(`/api/saved-searches?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSearches(prev => prev.filter(s => s.id !== id));
        alert('Search deleted successfully!');
      } else {
        alert('Failed to delete search.');
      }
    } catch (error) {
      alert('An error occurred while deleting the search.');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading your saved searches...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Saved Searches</h1>
      {searches.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {searches.map(search => (
            <li key={search.id} className="py-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">{search.name}</p>
                <p className="text-sm text-gray-600">{JSON.stringify(search.filters)}</p>
              </div>
              <button onClick={() => handleDelete(search.id)} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">Delete</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>You have no saved searches yet.</p>
      )}
    </div>
  );
}
