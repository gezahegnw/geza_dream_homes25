'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type User = {
  id: string;
  name: string;
  email: string;
  approved: boolean;
  is_admin: boolean;
} | null;

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user authentication status
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        const body = await res.json();
        setUser(body.user ?? null);
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    setIsOpen(false);
    window.location.href = "/";
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.mobile-menu-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  // Disable scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-700 hover:text-brand"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 transition-opacity"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        >
          <div className="mobile-menu-container absolute right-0 h-full w-4/5 max-w-sm bg-white p-6 shadow-lg" role="dialog" aria-modal="true">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="block py-2 text-lg font-medium text-gray-900 hover:text-brand"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/listings" 
                className="block py-2 text-lg text-gray-600 hover:text-brand"
                onClick={() => setIsOpen(false)}
              >
                Listings
              </Link>
              <Link 
                href="/about" 
                className="block py-2 text-lg text-gray-600 hover:text-brand"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/reviews" 
                className="block py-2 text-lg text-gray-600 hover:text-brand"
                onClick={() => setIsOpen(false)}
              >
                Reviews
              </Link>
              <Link 
                href="/contact" 
                className="mt-4 block rounded-lg bg-brand px-4 py-3 text-center font-medium text-white hover:bg-brand/90"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
              <a 
                href="tel:+19134078620" 
                className="mt-2 flex items-center justify-center rounded-lg border border-brand bg-white px-4 py-3 font-medium text-brand hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                (913) 407-8620
              </a>

              {/* Authentication Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                {!loading && (
                  <>
                    {user ? (
                      <div className="space-y-3">
                        <div className="text-sm text-gray-700">
                          <div className="font-medium">Hello, {user.name.split(" ")[0]}</div>
                          {!user.approved && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200 mt-1">
                              Account Pending Approval
                            </span>
                          )}
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full rounded-lg bg-red-600 px-4 py-3 text-center font-medium text-white hover:bg-red-700"
                        >
                          Log Out
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Link
                          href="/login"
                          className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsOpen(false)}
                        >
                          Log In
                        </Link>
                        <Link
                          href="/signup"
                          className="block w-full rounded-lg bg-emerald-600 px-4 py-3 text-center font-medium text-white hover:bg-emerald-700"
                          onClick={() => setIsOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
