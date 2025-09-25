"use client";
import { useEffect, useMemo, useState } from "react";
import { AdminAuth } from '@/lib/admin-auth';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [pages, setPages] = useState<number>(1);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
      const url = new URL(`/api/admin/leads`, window.location.origin);
      if (q.trim()) url.searchParams.set("q", q.trim());
      url.searchParams.set("page", String(nextPage));
      url.searchParams.set("pageSize", String(pageSize));
      const res = await fetch(url.toString(), {
        headers: AdminAuth.getHeaders(),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || body?.message || "Failed to load");
      setLeads(body.leads);
      setTotal(body.total ?? 0);
      setPages(body.pages ?? 1);
      setPage(body.page ?? nextPage);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  const onExportCsv = async () => {
    try {
      const url = new URL(`/api/admin/leads`, window.location.origin);
      url.searchParams.set("format", "csv");
      if (q.trim()) url.searchParams.set("q", q.trim());
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(pageSize));

      const res = await fetch(url.toString(), {
        headers: AdminAuth.getHeaders(),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || body?.message || "Failed to export CSV");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();

    } catch (e: any) {
      alert(`Error exporting CSV: ${String(e?.message ?? e)}`);
    }
  };

  const rows = useMemo(() => leads ?? [], [leads]);

  // Wait for client-side mount to avoid hydration mismatch
  if (!isClient) {
    return null; // or a loading spinner
  }

  // Show authentication screen if not authenticated and no token
  if (!AdminAuth.isAuthenticated() && !token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="bg-white rounded-lg border p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please enter your admin token to access lead management.</p>
          
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
              Access Lead Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-2">Lead Management</h1>
            <p className="text-gray-600">Track and manage customer leads</p>
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

      <div className="flex flex-wrap items-end gap-2 mb-4">
        {!AdminAuth.isAuthenticated() && (
          <div>
            <label className="block text-sm">Admin Token</label>
            <input value={token} onChange={(e) => setToken(e.target.value)} className="border rounded px-2 py-1 w-[320px]" placeholder="Set ADMIN_TOKEN in .env for prod" />
          </div>
        )}
        <div>
          <label className="block text-sm">Search</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} className="border rounded px-2 py-1 w-[240px]" placeholder="name, email, phone, message" />
        </div>
        <div>
          <label className="block text-sm">Page size</label>
          <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value, 10))} className="border rounded px-2 py-1">
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button onClick={() => load(1)} disabled={loading} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60">{loading ? "Loading..." : "Search"}</button>
        <button onClick={onExportCsv} className="px-3 py-2 rounded border">Export CSV</button>
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[
                "created_at",
                "name",
                "email",
                "phone",
                "intent",
                "timeframe",
                "budget",
                "message",
                "ip",
              ].map((h) => (
                <th key={h} className="text-left px-3 py-2 border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-2 border-b whitespace-nowrap">{l.created_at ? new Date(l.created_at).toLocaleString() : ""}</td>
                <td className="px-3 py-2 border-b">{l.name}</td>
                <td className="px-3 py-2 border-b">{l.email}</td>
                <td className="px-3 py-2 border-b">{l.phone ?? ""}</td>
                <td className="px-3 py-2 border-b">{l.intent ?? ""}</td>
                <td className="px-3 py-2 border-b">{l.timeframe ?? ""}</td>
                <td className="px-3 py-2 border-b">{l.budget ?? ""}</td>
                <td className="px-3 py-2 border-b max-w-[400px] truncate" title={l.message ?? ""}>{l.message ?? ""}</td>
                <td className="px-3 py-2 border-b">{l.ip ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm">
        <div>
          Page {page} of {pages} • Total {total}
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page <= 1 || loading}
            onClick={() => load(page - 1)}
          >
            Prev
          </button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page >= pages || loading}
            onClick={() => load(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
