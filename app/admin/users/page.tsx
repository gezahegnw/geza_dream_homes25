"use client";
import { useEffect, useMemo, useState } from "react";

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
    if (process.env.NODE_ENV !== "production") {
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Users (Admin)</h1>

      <div className="flex flex-wrap items-end gap-2 mb-4">
        <div>
          <label className="block text-sm">Admin Token</label>
          <input value={token} onChange={(e) => setToken(e.target.value)} className="border rounded px-2 py-1 w-[320px]" placeholder="Set ADMIN_TOKEN in .env for prod" />
        </div>
        <div>
          <label className="block text-sm">Search</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} className="border rounded px-2 py-1 w-[240px]" placeholder="name, email" />
        </div>
        <div>
          <label className="block text-sm">Status</label>
          <select value={approved} onChange={(e) => setApproved(e.target.value as any)} className="border rounded px-2 py-1">
            <option value="all">All</option>
            <option value="true">Approved</option>
            <option value="false">Pending</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Page size</label>
          <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value, 10))} className="border rounded px-2 py-1">
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button onClick={() => load(1)} disabled={loading} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60">{loading ? "Loading..." : "Search"}</button>
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["created_at","approved","name","email","role","actions"].map(h => (
                <th key={h} className="text-left px-3 py-2 border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50 align-top">
                <td className="px-3 py-2 border-b whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2 border-b">{r.approved ? <span className="text-green-700">Approved</span> : <span className="text-amber-700">Pending</span>}</td>
                <td className="px-3 py-2 border-b">{r.name}</td>
                <td className="px-3 py-2 border-b">{r.email}</td>
                <td className="px-3 py-2 border-b">{r.is_admin ? "Admin" : "User"}</td>
                <td className="px-3 py-2 border-b">
                  <div className="flex gap-2">
                    {r.approved ? (
                      <button onClick={() => onToggleApprove(r.id, false)} className="px-2 py-1 border rounded">Unapprove</button>
                    ) : (
                      <button onClick={() => onToggleApprove(r.id, true)} className="px-2 py-1 border rounded bg-green-600 text-white">Approve</button>
                    )}
                    <button onClick={() => onDelete(r.id, r.name)} className="px-2 py-1 border rounded bg-red-600 text-white">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-600">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm">
        <div>
          Page {data?.page ?? page} of {data?.pages ?? 1} • Total {data?.total ?? 0}
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={(data?.page ?? page) <= 1 || loading} onClick={() => load((data?.page ?? page) - 1)}>Prev</button>
          <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={(data?.page ?? page) >= (data?.pages ?? 1) || loading} onClick={() => load((data?.page ?? page) + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
