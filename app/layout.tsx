import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Home, Users, MessageSquare, Phone, Heart, User, LogOut, Menu, X } from "lucide-react";
import AuthStatus from "@/components/AuthStatus";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import MobileMenu from "../components/MobileMenu";
import MobileCallButton from "@/components/MobileCallButton";
import Image from "next/image";
import AuthStatusServer from "../components/AuthStatusServer";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: 'Geza Dream Homes | Kansas City Real Estate Agent',
    template: '%s | Geza Dream Homes',
  },
  description: 'Find your dream home in the Kansas City metro area with Geza Worku, a dedicated RE/MAX real estate agent. Browse the latest property listings, get expert market insights, and start your home buying or selling journey today.',
  metadataBase: new URL('https://gezadreamhomes.com'),
  openGraph: {
    title: 'Geza Dream Homes | Kansas City Real Estate Agent',
    description: 'Your trusted partner for buying and selling homes in the Kansas City area.',
    type: 'website',
    url: siteUrl,
    images: [
      {
        url: '/og-image.png', // Using a more standard OG image name
        width: 1200,
        height: 630,
        alt: 'Geza Dream Homes - Kansas City Real Estate',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* LocalBusiness schema for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              name: "Geza Dream Homes",
              image: `${siteUrl}/favicon.ico`,
              url: siteUrl,
              telephone: "+1-913-407-8620",
              email: ["gezarealesteteagent@gmail.com", "gworku@remax.net"],
              address: {
                "@type": "PostalAddress",
                streetAddress: "13470 S Arapaho Dr STE 180",
                addressLocality: "Olathe",
                addressRegion: "KS",
                postalCode: "66062",
                addressCountry: "US",
              },
              brand: {
                "@type": "Organization",
                name: "RE/MAX Beyond",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} bg-white min-h-screen flex flex-col`}>
        <header className="sticky top-0 z-50 bg-white shadow-sm">
          <nav className="w-full flex h-20 items-center justify-between px-0 md:px-0">
            <a href="/" className="flex items-center leading-tight pl-4 pr-2" aria-label="Geza Dream Homes">
              {/* Light theme SVG logo */}
              <Image
                src="/logo-light.svg"
                alt="Geza Dream Homes"
                width={300}
                height={80}
                priority
                sizes="(max-width: 768px) 240px, 300px"
                className="block dark:hidden h-16 md:h-20 w-auto"
              />
              {/* Dark theme SVG logo */}
              <Image
                src="/logo-dark.svg"
                alt="Geza Dream Homes"
                width={300}
                height={80}
                priority
                sizes="(max-width: 768px) 240px, 300px"
                className="hidden dark:block h-16 md:h-20 w-auto"
              />
            </a>
            <div className="hidden items-center space-x-8 md:flex">
              <a href="/" className="hover:text-brand">Home</a>
              <a href="/listings" className="hover:text-brand">Listings</a>
              <a href="/favorites" className="hover:text-brand">Favorites</a>
              <a href="/gallery" className="hover:text-brand">Gallery</a>
              <a href="/about" className="hover:text-brand">About</a>
              <a href="/reviews" className="hover:text-brand">Write a Review</a>
              <a 
                href="/contact" 
                className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand/90"
              >
                Contact
              </a>
              {/* Server component pre-hydrates user so header is correct on first paint */}
              <AuthStatusServer />
              <a 
                href="tel:+19134078620" 
                className="hidden lg:inline-flex items-center text-gray-700 hover:text-brand"
              >
                <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                (913) 407-8620
              </a>
            </div>
            <MobileMenu />
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <FloatingCTA />
        <MobileCallButton />
        <Footer />
      </body>
    </html>
  );
}
