"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import StarRating from "@/components/StarRating";

interface ReviewItem {
  id: string;
  created_at: string;
  name: string;
  rating: number;
  title?: string | null;
  content: string;
  image_url?: string | null;
}

interface ReviewsResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  average: number;
}

export default function ReviewsPage() {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  // Optional reCAPTCHA v3 site key
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // Helper to load reCAPTCHA script (if configured) and get a token
  async function getRecaptchaToken(action = "review_submit"): Promise<string | null> {
    if (!recaptchaSiteKey) return null;
    // Inject script once
    if (!(window as any).grecaptcha) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
        s.async = true;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
        document.head.appendChild(s);
      }).catch(() => {});
    }
    if (!(window as any).grecaptcha || !(window as any).grecaptcha.execute) return null;
    try {
      await (window as any).grecaptcha.ready?.();
      const t = await (window as any).grecaptcha.execute(recaptchaSiteKey, { action });
      return typeof t === "string" ? t : null;
    } catch {
      return null;
    }
  }

  const load = async (p = page, ps = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/reviews?page=${p}&pageSize=${ps}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load reviews");
      const json: ReviewsResponse = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  useEffect(() => {
    load(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const averageLabel = useMemo(() => {
    const avg = data?.average ?? 0;
    return avg.toFixed(1);
  }, [data]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const token = await getRecaptchaToken();
      const resp = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, title, content, rating, imageUrl, token }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const detail = body?.error || body?.message || JSON.stringify(body) || "Unknown error";
        setSubmitMsg(`Submit failed: ${detail}`);
        return;
      }
      setSubmitMsg("Thanks for your review!");
      setName("");
      setEmail("");
      setTitle("");
      setContent("");
      setRating(5);
      setImageUrl("");
      await load(1, pageSize);
      setPage(1);
    } catch (e: any) {
      setSubmitMsg(e?.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Client Reviews</h1>

      {/* Summary */}
      <div className="mb-8 flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <StarRating value={Math.round((data?.average ?? 0))} readOnly />
          <span className="text-lg font-semibold">{averageLabel} / 5</span>
        </div>
        <span className="text-gray-500">{data?.total ?? 0} review{(data?.total ?? 0) === 1 ? '' : 's'}</span>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Reviews list */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">Recent Reviews</h2>
          {loading && <p className="text-gray-600">Loading reviews…</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && (
            <div className="space-y-4">
              {data?.items?.length ? (
                data.items.map((r) => (
                  <article key={r.id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-900">{r.name}</div>
                      <StarRating value={r.rating} readOnly size={18} />
                    </div>
                    {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                    <p className="mt-2 text-gray-700">{r.content}</p>
                    {r.image_url && (
                      <div className="mt-3 overflow-hidden rounded-lg border">
                        <div className="relative h-56 w-full">
                          <Image
                            src={r.image_url}
                            alt={r.title || `Review by ${r.name}`}
                            fill
                            className="object-cover"
                            sizes="(min-width: 1024px) 600px, (min-width: 768px) 50vw, 100vw"
                          />
                        </div>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</p>
                  </article>
                ))
              ) : (
                <p className="text-gray-600">No reviews yet.</p>
              )}
            </div>
          )}

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="text-sm text-gray-600">
                Page {data.page} of {data.pages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </button>
                <button
                  className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                  onClick={() => setPage((p) => (data ? Math.min(data.pages, p + 1) : p + 1))}
                  disabled={!!data && page >= data.pages}
                >
                  Next
                </button>
                <select
                  className="rounded border px-2 py-1 text-sm"
                  value={pageSize}
                  onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                >
                  {[5, 10, 20].map((n) => (
                    <option key={n} value={n}>{n}/page</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Submission form */}
        <section id="leave-review">
          <h2 className="mb-4 text-xl font-semibold">Leave a Review</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Your Name</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email (optional)</label>
              <input
                type="email"
                className="mt-1 w-full rounded border px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Title (optional)</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Amazing experience!"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Screenshot/Image URL (optional)</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/your-screenshot.jpg"
              />
              <p className="mt-1 text-xs text-gray-500">Paste a public image URL. We will display it with your review.</p>
            </div>
            <div>
              <label id="rating-label" className="block text-sm font-medium">Your Rating</label>
              <div className="mt-1">
                <StarRating id="rating-label" value={rating} onChange={setRating} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Your Review</label>
              <textarea
                className="mt-1 w-full rounded border px-3 py-2"
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <button
              disabled={submitting}
              className="rounded bg-brand px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
            {submitMsg && <p className="text-sm text-gray-600" aria-live="polite">{submitMsg}</p>}
          </form>
        </section>
      </div>
    </main>
  );
}
