"use client";
import { useEffect, useMemo, useState } from "react";
import { AdminAuth } from '@/lib/admin-auth';

type UserItem = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  approved: boolean;
  is_admin: boolean;
};

type ApiList = {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
  users: UserItem[];
};

export default function AdminUsersPage() {
  const [token, setToken] = useState("");
  const [q, setQ] = useState("");
  const [approved, setApproved] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiList | null>(null);

  useEffect(() => {
    // Check if already authenticated
    if (AdminAuth.isAuthenticated()) {
      const savedToken = AdminAuth.getToken();
      if (savedToken) {
        setToken(savedToken);
        load(1); // Auto-load data if authenticated
      }
    } else if (process.env.NODE_ENV !== "production") {
      const t = (process.env as any).ADMIN_TOKEN as string | undefined;
      if (t && !token) setToken(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(nextPage = page) {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`/api/admin/users`, window.location.origin);
      if (q.trim()) url.searchParams.set("q", q.trim());
      if (approved !== "all") url.searchParams.set("approved", approved);
      url.searchParams.set("page", String(nextPage));
      url.searchParams.set("pageSize", String(pageSize));
      const res = await fetch(url.toString(), { headers: token ? { "x-admin-token": token } : undefined });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || body?.message || "Failed to load");
      setData(body as ApiList);
      setPage(body.page ?? nextPage);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action is permanent.`)) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-admin-token": token } : {}),
        },
        body: JSON.stringify({ id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || body?.message || "Failed to delete");
      await load(page);
    } catch (e: any) {
      alert(`Error: ${String(e?.message ?? e)}`);
    } finally {
      setLoading(false);
    }
  }

  async function onToggleApprove(id: string, approved: boolean) {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-admin-token": token } : {}),
        },
        body: JSON.stringify({ id, approved }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || body?.message || "Failed to update");
      await load(page);
    } catch (e: any) {
      alert(`Error: ${String(e?.message ?? e)}`);
    } finally {
      setLoading(false);
    }
  }

  const rows = useMemo(() => data?.users ?? [], [data]);

  // Show authentication screen if not authenticated and no token
  if (!AdminAuth.isAuthenticated() && !token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="bg-white rounded-lg border p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please enter your admin token to access user management.</p>
          
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
                load(1);
              }}
              disabled={!token.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Access User Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">User Management</h1>
            <p className="text-gray-600">Manage user accounts and permissions</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/admin"
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </a>
            <button
              onClick={() => {
                AdminAuth.logout();
                window.location.href = '/admin';
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

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-3 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Search & Filter Users</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {!AdminAuth.isAuthenticated() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Token</label>
                <input 
                  value={token} 
                  onChange={(e) => setToken(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  placeholder="Set ADMIN_TOKEN in .env for prod" 
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                placeholder="Search by name or email" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                value={approved} 
                onChange={(e) => setApproved(e.target.value as any)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">All Users</option>
                <option value="true">Approved</option>
                <option value="false">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Page Size</label>
              <select 
                value={pageSize} 
                onChange={(e) => setPageSize(parseInt(e.target.value, 10))} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => load(1)} 
              disabled={loading} 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
            >
              {loading ? 'Searching...' : 'Search Users'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/20">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4">
            <h3 className="text-xl font-bold text-white">Users Directory</h3>
            <p className="text-blue-100 text-sm">Manage all user accounts and permissions</p>
          </div>
          
          <div className="overflow-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {[
                    { key: "created_at", label: "Created" },
                    { key: "approved", label: "Status" },
                    { key: "name", label: "Name" },
                    { key: "email", label: "Email" },
                    { key: "role", label: "Role" },
                    { key: "actions", label: "Actions" }
                  ].map(h => (
                    <th key={h.key} className="text-left px-6 py-4 font-semibold text-gray-700 border-b border-gray-200">{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {r.approved ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        r.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {r.is_admin ? "👑 Admin" : "👤 User"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {r.approved ? (
                          <button 
                            onClick={() => onToggleApprove(r.id, false)} 
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105"
                          >
                            Unapprove
                          </button>
                        ) : (
                          <button 
                            onClick={() => onToggleApprove(r.id, true)} 
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105"
                          >
                            Approve
                          </button>
                        )}
                        <button 
                          onClick={() => onDelete(r.id, r.name)} 
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No users found</p>
                        <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Page <span className="font-medium">{data?.page ?? page}</span> of <span className="font-medium">{data?.pages ?? 1}</span> • 
              Total <span className="font-medium">{data?.total ?? 0}</span> users
            </div>
            <div className="flex gap-2">
              <button 
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
                disabled={(data?.page ?? page) <= 1 || loading} 
                onClick={() => load((data?.page ?? page) - 1)}
              >
                Previous
              </button>
              <button 
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
                disabled={(data?.page ?? page) >= (data?.pages ?? 1) || loading} 
                onClick={() => load((data?.page ?? page) + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
