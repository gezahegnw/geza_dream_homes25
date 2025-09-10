"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
const geza3 = "/geza3.jpg";

export default function ContactPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const [utm, setUtm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!siteKey) return;
    // Inject reCAPTCHA v3 script if not present
    if (!document.querySelector('script[src^="https://www.google.com/recaptcha/api.js"]')) {
      const s = document.createElement("script");
      s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      s.async = true;
      document.head.appendChild(s);
    }
  }, [siteKey]);

  // Capture basic UTM and referrer/landing once on mount (client-only)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const data: Record<string, string> = {};
      const keys = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
      ];
      keys.forEach((k) => {
        const v = params.get(k);
        if (v) data[k] = v;
      });
      data.referrer = document.referrer || '';
      data.landing_page = url.pathname + (url.search || '');
      // Simple source heuristic
      if (data.utm_source) data.source = 'utm';
      else if (data.referrer) data.source = 'referral';
      else data.source = 'direct';
      setUtm(data);
    } catch {}
  }, []);

  async function getRecaptchaToken(siteKey: string): Promise<string | undefined> {
    // Wait for grecaptcha script to be ready, with a short timeout to avoid hanging
    const gre = (window as any).grecaptcha;
    if (!gre) return undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        try {
          gre.ready(() => resolve());
        } catch (err) {
          // Some envs may not have ready; resolve immediately in that case
          resolve();
        }
        // Safety timeout (3s)
        setTimeout(() => resolve(), 3000);
      });
      return await gre.execute(siteKey, { action: "lead" });
    } catch {
      return undefined;
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; // capture form ref before any awaits (React pools events)
    const fd = new FormData(form);
    setLoading(true);
    setStatus("Sending...");
    // Basic client-side validation
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const newErrors: { name?: string; email?: string } = {};
    if (!name) newErrors.name = "Your name is required";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Please enter a valid email";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setLoading(false);
      setStatus("Please correct the highlighted fields");
      setToast({ type: "error", message: "Please correct the highlighted fields" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    try {
      // Collect selected features
      const features = fd.getAll("features").join(", ");

      const payload = {
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        intent: String(fd.get("intent") || ""),
        timeframe: String(fd.get("timeframe") || ""),
        budget: String(fd.get("budget") || ""),
        message: String(fd.get("message") || ""),
        // Property preferences
        interested_location: String(fd.get("interested_location") || ""),
        property_type: String(fd.get("property_type") || ""),
        min_bedrooms: String(fd.get("min_bedrooms") || ""),
        min_bathrooms: String(fd.get("min_bathrooms") || ""),
        min_sqft: String(fd.get("min_sqft") || ""),
        max_sqft: String(fd.get("max_sqft") || ""),
        current_status: String(fd.get("current_status") || ""),
        move_in_date: String(fd.get("move_in_date") || ""),
        features: features,
        // Audit fields
        source: utm.source,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        utm_term: utm.utm_term,
        utm_content: utm.utm_content,
        referrer: utm.referrer,
        landing_page: utm.landing_page,
      };

      // Get reCAPTCHA token if configured
      let token: string | undefined = undefined;
      if (siteKey && (window as any).grecaptcha) {
        token = await getRecaptchaToken(siteKey);
      }

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, token }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = body?.error || body?.message || JSON.stringify(body) || "Unknown error";
        setStatus(`Submit failed (${res.status}). ${detail}`);
        setToast({ type: "error", message: "Submission failed. Please try again." });
        setTimeout(() => setToast(null), 3500);
        return;
      }
      setStatus("Thanks! I will reach out shortly.");
      setToast({ type: "success", message: "Sent! I will reach out shortly." });
      setTimeout(() => setToast(null), 3000);
      form.reset();
    } catch (e) {
      setStatus(
        process.env.NODE_ENV !== "production"
          ? `Network or unexpected error: ${String((e as Error)?.message || e)}`
          : "Something went wrong. Please try again."
      );
      setToast({ type: "error", message: "Something went wrong. Please try again." });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Toast notifications */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg ${
            toast.type === "success" ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          <span>{toast.message}</span>
        </div>
      )}
      <h1 className="text-3xl font-bold mb-8">Contact</h1>
      <div className="grid gap-8 md:grid-cols-2 items-start">
        {/* Left: form */}
        <div className="order-2 md:order-1">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Full Name</label>
              <input
                name="name"
                required
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                className={`mt-1 w-full rounded border px-3 py-2 ${errors.name ? "border-red-500 focus:ring-red-200" : ""}`}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`mt-1 w-full rounded border px-3 py-2 ${errors.email ? "border-red-500 focus:ring-red-200" : ""}`}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input type="tel" name="phone" className="mt-1 w-full rounded border px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium">Intent</label>
                <select name="intent" className="mt-1 w-full rounded border px-3 py-2">
                  <option value="">Select</option>
                  <option>Buying</option>
                  <option>Selling</option>
                  <option>Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Timeframe</label>
                <select name="timeframe" className="mt-1 w-full rounded border px-3 py-2">
                  <option value="">Select</option>
                  <option>0-3 months</option>
                  <option>3-6 months</option>
                  <option>6+ months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Budget</label>
                <input name="budget" placeholder="$400k" className="mt-1 w-full rounded border px-3 py-2" />
              </div>
            </div>

            {/* Property Preferences Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-medium mb-4 text-gray-900">Property Preferences</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium">Interested Location/City</label>
                  <input 
                    name="interested_location" 
                    placeholder="e.g., Overland Park, Olathe, Kansas City" 
                    className="mt-1 w-full rounded border px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Property Type</label>
                  <select name="property_type" className="mt-1 w-full rounded border px-3 py-2">
                    <option value="">Select</option>
                    <option>Single Family Home</option>
                    <option>Condo</option>
                    <option>Townhouse</option>
                    <option>Multi-Family</option>
                    <option>Land/Lot</option>
                    <option>No Preference</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium">Min Bedrooms</label>
                  <select name="min_bedrooms" className="mt-1 w-full rounded border px-3 py-2">
                    <option value="">Any</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Min Bathrooms</label>
                  <select name="min_bathrooms" className="mt-1 w-full rounded border px-3 py-2">
                    <option value="">Any</option>
                    <option>1</option>
                    <option>1.5</option>
                    <option>2</option>
                    <option>2.5</option>
                    <option>3</option>
                    <option>3.5</option>
                    <option>4+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Min Square Feet</label>
                  <input 
                    name="min_sqft" 
                    type="number" 
                    placeholder="1500" 
                    className="mt-1 w-full rounded border px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Max Square Feet</label>
                  <input 
                    name="max_sqft" 
                    type="number" 
                    placeholder="3000" 
                    className="mt-1 w-full rounded border px-3 py-2" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium">Current Housing Status</label>
                  <select name="current_status" className="mt-1 w-full rounded border px-3 py-2">
                    <option value="">Select</option>
                    <option>First-time buyer</option>
                    <option>Currently renting</option>
                    <option>Own home (need to sell)</option>
                    <option>Own home (keeping as investment)</option>
                    <option>Relocating</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Preferred Move-in Date</label>
                  <input 
                    name="move_in_date" 
                    type="date" 
                    className="mt-1 w-full rounded border px-3 py-2" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Must-Have Features (optional)</label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="flex items-center text-sm">
                    <input type="checkbox" name="features" value="garage" className="mr-2" />
                    Garage
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" name="features" value="pool" className="mr-2" />
                    Pool
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" name="features" value="basement" className="mr-2" />
                    Basement
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" name="features" value="fireplace" className="mr-2" />
                    Fireplace
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" name="features" value="hardwood" className="mr-2" />
                    Hardwood Floors
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" name="features" value="updated_kitchen" className="mr-2" />
                    Updated Kitchen
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" name="features" value="fenced_yard" className="mr-2" />
                    Fenced Yard
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" name="features" value="new_construction" className="mr-2" />
                    New Construction
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Message</label>
              <textarea name="message" rows={4} className="mt-1 w-full rounded border px-3 py-2" />
            </div>
            <div className="flex items-start gap-2 text-sm">
              <input type="checkbox" required className="mt-1" />
              <p>I agree to the privacy policy and to be contacted about my inquiry.</p>
            </div>
            <button disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded bg-brand text-white hover:opacity-90 disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? "Sending..." : "Send"}</span>
            </button>
          </form>
          {status && <p className="mt-4 text-sm text-gray-600" aria-live="polite">{status}</p>}
        </div>

        {/* Right: details (photo moved to About page) */}
        <div className="order-1 md:order-2">
          {/* Contact card */}
          <div className="rounded-xl border bg-white p-4 text-sm text-gray-700 shadow-sm">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-base font-semibold leading-none text-gray-900">Gezahegn Worku</p>
                <p className="mt-1 text-sm text-gray-600">RE/MAX Beyond</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <p>
                  <span className="font-semibold">Phone:</span>{' '}
                  <a href="tel:+19134078620" className="hover:text-brand">(913) 407-8620</a>
                </p>
                <p>
                  <span className="font-semibold">Email:</span>{' '}
                  <a href="mailto:gezarealesteteagent@gmail.com" className="hover:text-brand">gezarealesteteagent@gmail.com</a>
                </p>
                <p className="sm:col-span-2">
                  <span className="font-semibold">Work Email:</span>{' '}
                  <a href="mailto:gworku@remax.net" className="hover:text-brand">gworku@remax.net</a>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href="tel:+19134078620"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white shadow hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-brand/40"
                  aria-label="Call Gezahegn Worku"
                >
                  Call
                </a>
                <a
                  href="mailto:gworku@remax.net"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand/40"
                  aria-label="Email Gezahegn Worku"
                >
                  Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
