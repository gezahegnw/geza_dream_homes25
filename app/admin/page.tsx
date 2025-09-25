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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex-1 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Admin Dashboard
            </h1>
            <p className="text-lg text-gray-600">Manage your real estate platform with ease</p>
          </div>
          <div className="absolute top-4 right-4">
            <button
              onClick={() => {
                AdminAuth.logout();
                setAuthenticated(false);
                setToken('');
              }}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-3 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            Admin Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <a href="/admin/users" className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-lg mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">User Management</h3>
                <p className="text-blue-100 text-sm">Manage user accounts and permissions</p>
              </div>
            </a>
            
            <a href="/admin/reviews" className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-lg mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Review Management</h3>
                <p className="text-green-100 text-sm">Moderate customer reviews</p>
              </div>
            </a>
            
            <a href="/admin/leads" className="group relative overflow-hidden bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white p-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-lg mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Lead Management</h3>
                <p className="text-yellow-100 text-sm">Track and manage leads</p>
              </div>
            </a>
            
            <a href="/admin/photos" className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-lg mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Photo Management</h3>
                <p className="text-purple-100 text-sm">Upload and organize photos</p>
              </div>
            </a>
            
            <a href="/admin/manual" className="group relative overflow-hidden bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white p-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-lg mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">User Manual</h3>
                <p className="text-gray-300 text-sm">Documentation and guides</p>
              </div>
            </a>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Pending User Approvals</h2>
                <p className="text-gray-600">{pendingUsers.length} users awaiting approval</p>
              </div>
            </div>
            {pendingUsers.length > 0 ? (
              <div className="space-y-4">
                {pendingUsers.map(user => (
                  <div key={user.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <button 
                        onClick={() => handleApproveUser(user.id)} 
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">All users are approved!</p>
                <p className="text-sm text-gray-400">No pending approvals at this time.</p>
              </div>
            )}
          </div>

          {/* Review Management */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Pending Reviews</h2>
                <p className="text-gray-600">{pendingReviews.length} reviews awaiting moderation</p>
              </div>
            </div>
            {pendingReviews.length > 0 ? (
              <div className="space-y-4">
                {pendingReviews.map(review => (
                  <div key={review.id} className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <p className="font-semibold text-gray-900 mr-2">{review.name}</p>
                          <div className="flex text-yellow-400">
                            {'★'.repeat(review.rating)}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">{review.title}</p>
                        <p className="text-sm text-gray-600">{review.content}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button 
                          onClick={() => handleApproveReview(review.id)} 
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleDeleteReview(review.id)} 
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">All reviews are moderated!</p>
                <p className="text-sm text-gray-400">No pending reviews at this time.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
