"use client";

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Use the debug=1 flag to get the raw response from our API
        const res = await fetch('/api/listings?q=Olathe, KS&debug=1');
        if (!res.ok) {
          throw new Error(`API responded with status: ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-4 font-sans">
      <h1 className="text-2xl font-bold mb-4">API Debug Page</h1>
      <p className="mb-4">This page fetches listings for "Olathe, KS" and displays the raw API response for debugging purposes.</p>
      
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {data && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Raw API Response:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
