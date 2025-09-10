"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Footer() {
  const pathname = usePathname();
  const isContactPage = useMemo(() => pathname === "/contact", [pathname]);

  return (
    <footer className="border-t">
      {/* Brand logo in footer */}
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <a href="/" className="inline-flex items-center" aria-label="Geza Dream Homes" title="Geza Dream Homes">
          {/* Match header behavior: show light logo on light mode, dark logo on dark mode */}
          <Image
            src="/logo-light.svg"
            alt="Geza Dream Homes"
            width={300}
            height={80}
            sizes="(max-width: 768px) 240px, 300px"
            className="block dark:hidden h-16 md:h-20 w-auto"
            priority
          />
          <Image
            src="/logo-dark.svg"
            alt="Geza Dream Homes"
            width={300}
            height={80}
            sizes="(max-width: 768px) 240px, 300px"
            className="hidden dark:block h-16 md:h-20 w-auto"
            priority
          />
        </a>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-500 grid md:grid-cols-3 gap-6">
        {/* Left column: Address (hidden on contact page) */}
        {!isContactPage && (
          <div>
            <p className="font-semibold text-gray-700">Gezahegn Worku</p>
            <p>RE/MAX Beyond</p>
            <p>13470 S Arapaho Dr STE 180</p>
            <p>Olathe, KS 66062</p>
          </div>
        )}

        {/* Middle column: Contact (hidden on contact page) */}
        {!isContactPage && (
          <div>
            <p>
              <span className="font-semibold">Phone:</span>{" "}
              <a className="hover:text-brand" href="tel:+19134078620">
                (913) 407-8620
              </a>
            </p>
            <p>
              <span className="font-semibold">Email:</span>{" "}
              <a className="hover:text-brand" href="mailto:gezarealesteteagent@gmail.com">
                gezarealesteteagent@gmail.com
              </a>
            </p>
            <p>
              <span className="font-semibold">Work Email:</span>{" "}
              <a className="hover:text-brand" href="mailto:gworku@remax.net">
                gworku@remax.net
              </a>
            </p>
          </div>
        )}

        {/* Right column: Quick Links */}
        <div className={!isContactPage ? "md:text-right" : "md:col-span-3 md:flex md:justify-end"}>
          <nav className="space-y-2 text-right">
            <a href="/" className="block hover:text-brand">Home</a>
            <a href="/listings" className="block hover:text-brand">Listings</a>
            <a href="/about" className="block hover:text-brand">About</a>
            <a href="/reviews" className="block hover:text-brand">Reviews</a>
            <a href="/contact" className="block hover:text-brand">Contact</a>
          </nav>
        </div>
      </div>
      {/* Bottom legal bar */}
      <div className="border-t bg-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-gray-600">
          <p className="mb-2 text-center md:text-left">© {new Date().getFullYear()} Geza Dream Homes.</p>
          <div className="flex items-center justify-center gap-4 md:justify-start">
            <a href="/privacy" className="inline-flex items-center gap-1.5 hover:text-brand" aria-label="Privacy policy">
              {/* shield icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              <span>Privacy</span>
            </a>
            <span className="text-gray-400" aria-hidden>•</span>
            <a href="/terms" className="inline-flex items-center gap-1.5 hover:text-brand" aria-label="Terms of service">
              {/* document icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <path d="M14 2v6h6"/>
                <path d="M8 13h8"/>
                <path d="M8 17h5"/>
              </svg>
              <span>Terms</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
