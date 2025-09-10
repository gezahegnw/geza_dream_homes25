"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Me = {
  id: string;
  name: string;
  email: string;
  approved: boolean;
  is_admin: boolean;
} | null;

export default function AuthStatus({ initialUser = null }: { initialUser?: Me }) {
  const [me, setMe] = useState<Me>(initialUser);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        const body = await res.json();
        if (!alive) return;
        setMe(body.user ?? null);
      } catch (e: any) {
        if (!alive) return;
        setErr(String(e?.message ?? e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    // Always force navigation to avoid stale UI
    window.location.href = "/";
  }

  if (loading) return null;
  if (err) return null;

  const showAuthCtas = !me && typeof pathname === "string" && pathname.startsWith("/listings");

  return (
    <div className="hidden md:flex items-center gap-3 pr-4">
      {me ? (
        <>
          <span className="text-sm text-gray-700 flex items-center gap-2">
            Hello, <span className="font-medium">{me.name.split(" ")[0]}</span>
            {!me.approved && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
                pending
              </span>
            )}
          </span>
          <button
            onClick={handleLogout}
            className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 shadow-sm"
            aria-label="Log out"
          >
            Log out
          </button>
        </>
      ) : showAuthCtas ? (
        <div className="flex items-center gap-2">
          <a href="/login" className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Log in</a>
          <a href="/signup" className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 shadow-sm">Sign up</a>
        </div>
      ) : null}
    </div>
  );
}
