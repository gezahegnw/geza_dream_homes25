"use client";

import { useEffect, useState } from 'react';
import { AdminAuth } from '@/lib/admin-auth';

interface User {
  id: string;
  name: string;
  email: string;
  approved: boolean;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  title: string;
  content: string;
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);

  useEffect(() => {
    // Check if already authenticated
    if (AdminAuth.isAuthenticated()) {
      const savedToken = AdminAuth.getToken();
      if (savedToken) {
        setToken(savedToken);
        setAuthenticated(true);
      }
    } else if (process.env.NODE_ENV !== "production") {
      const t = (process.env as any).ADMIN_TOKEN as string | undefined;
      if (t && !token) setToken(t);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchData();
    }
  }, [authenticated]);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Fetch pending users
      const usersRes = await fetch('/api/admin/users?approved=false', {
        headers: AdminAuth.getHeaders()
      });
      const usersData = await usersRes.json();
      if (usersRes.ok) setPendingUsers(usersData.users || []);

      // Fetch pending reviews
      const reviewsRes = await fetch('/api/admin/reviews?approved=false', {
        headers: AdminAuth.getHeaders()
      });
      const reviewsData = await reviewsRes.json();
      if (reviewsRes.ok) setPendingReviews(reviewsData.reviews || []);

    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Authentication check
  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="bg-white rounded-lg border p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please enter your admin token to access the admin dashboard.</p>
          
          <div className="space-y-4">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter admin token"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
            <button
              onClick={() => {
                AdminAuth.setToken(token);
                setAuthenticated(true);
              }}
              disabled={!token.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Access Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading admin data...</div>;
  }

  const handleApproveUser = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...AdminAuth.getHeaders()
        },
        body: JSON.stringify({ id: userId, approved: true }),
      });
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Failed to approve user:', error);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...AdminAuth.getHeaders()
        },
        body: JSON.stringify({ id: reviewId, approved: true }),
      });
      if (res.ok) {
        setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
      }
    } catch (error) {
      console.error('Failed to approve review:', error);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${reviewId}`, { 
        method: 'DELETE',
        headers: AdminAuth.getHeaders()
      });
      if (res.ok) {
        setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Quick Links */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Admin Pages</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <a href="/admin/users" className="text-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <p className="font-semibold text-blue-800">User Management</p>
          </a>
          <a href="/admin/reviews" className="text-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <p className="font-semibold text-green-800">Review Management</p>
          </a>
          <a href="/admin/leads" className="text-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
            <p className="font-semibold text-yellow-800">Lead Management</p>
          </a>
          <a href="/admin/photos" className="text-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <p className="font-semibold text-purple-800">Photo Management</p>
          </a>
          <a href="/admin/manual" className="text-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <p className="font-semibold text-gray-800">User Manual</p>
          </a>
        </div>
      </div>
      
      <div className="space-y-12">
        {/* User Management */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Pending User Approvals ({pendingUsers.length})</h2>
          {pendingUsers.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {pendingUsers.map(user => (
                <li key={user.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <button onClick={() => handleApproveUser(user.id)} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">Approve</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No users are currently awaiting approval.</p>
          )}
        </div>

        {/* Review Management */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Pending Reviews ({pendingReviews.length})</h2>
          {pendingReviews.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {pendingReviews.map(review => (
                <li key={review.id} className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{review.name} <span className="text-yellow-500">{'★'.repeat(review.rating)}</span></p>
                      <p className="text-sm text-gray-700 font-semibold mt-1">{review.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{review.content}</p>
                    </div>
                    <div className="flex-shrink-0 flex gap-2 ml-4">
                      <button onClick={() => handleApproveReview(review.id)} className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600">Approve</button>
                      <button onClick={() => handleDeleteReview(review.id)} className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600">Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No reviews are currently awaiting approval.</p>
          )}
        </div>
      </div>
    </div>
  );
}
