"use client";
import { useState } from "react";

// Only same-site relative paths are accepted so `?redirect=` cannot be used
// to bounce users to another origin after logging in.
function safeRedirect(value: string | null): string {
  if (!value) return "/listings";
  // Browsers treat backslashes as slashes, so `/\evil.com` is off-site too.
  const normalized = value.replace(/\\/g, "/");
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return "/listings";
  return normalized;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || body?.message || "Login failed");
      // Force a full document navigation so server components receive the new cookie immediately
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      window.location.href = safeRedirect(redirect);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Log in</h1>
      {error && <p className="mb-3 text-red-600 text-sm">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input type="email" className="mt-1 w-full rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input type="password" className="mt-1 w-full rounded border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded bg-green-600 px-4 py-2 text-white disabled:opacity-60">{loading ? "Signing in..." : "Sign in"}</button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        Don&apos;t have an account? <a href="/signup" className="text-green-700 underline">Sign up</a>.
      </p>
    </main>
  );
}
