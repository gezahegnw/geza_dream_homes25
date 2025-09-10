"use client";
import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    // Prefill token from env in dev for convenience
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
      const url = new URL(`/api/admin/leads`, window.location.origin);
      if (q.trim()) url.searchParams.set("q", q.trim());
      url.searchParams.set("page", String(nextPage));
      url.searchParams.set("pageSize", String(pageSize));
      const res = await fetch(url.toString(), {
        headers: token ? { "x-admin-token": token } : undefined,
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

  const onExportCsv = () => {
    const url = new URL(`/api/admin/leads`, window.location.origin);
    url.searchParams.set("format", "csv");
    if (q.trim()) url.searchParams.set("q", q.trim());
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));
    if (token) url.searchParams.set("token", token);
    window.location.href = url.toString();
  };

  const rows = useMemo(() => leads ?? [], [leads]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Leads (Admin)</h1>

      <div className="flex flex-wrap items-end gap-2 mb-4">
        <div>
          <label className="block text-sm">Admin Token</label>
          <input value={token} onChange={(e) => setToken(e.target.value)} className="border rounded px-2 py-1 w-[320px]" placeholder="Set ADMIN_TOKEN in .env for prod" />
        </div>
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
  );
}
