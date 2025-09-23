"use client";

import { useEffect, useState } from 'react';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // First, verify admin status
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) throw new Error('Not authenticated');
        const meData = await meRes.json();
        if (!meData.user?.is_admin) throw new Error('Not an admin');
        setIsAdmin(true);

        // Fetch pending users
        const usersRes = await fetch('/api/admin/users?approved=false');
        const usersData = await usersRes.json();
        if (usersRes.ok) setPendingUsers(usersData.users || []);

        // Fetch pending reviews
        const reviewsRes = await fetch('/api/admin/reviews?approved=false');
        const reviewsData = await reviewsRes.json();
        if (reviewsRes.ok) setPendingReviews(reviewsData.reviews || []);

      } catch (error) {
        window.location.href = '/'; // Redirect on any error
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Checking permissions...</div>;
  }

  if (!isAdmin) {
    return null; // Render nothing while redirecting
  }

  const handleApproveUser = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`/api/admin/reviews?id=${reviewId}`, { method: 'DELETE' });
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
