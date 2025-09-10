"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || body?.message || "Signup failed");
      // Redirect to listings to see pending approval message
      router.push("/listings");
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Sign up</h1>
      {error && <p className="mb-3 text-red-600 text-sm">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Full name</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input type="email" className="mt-1 w-full rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input type="password" className="mt-1 w-full rounded border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60">{loading ? "Creating account..." : "Create account"}</button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        Already have an account? <a href="/login" className="text-blue-700 underline">Log in</a>.
      </p>
    </main>
  );
}
