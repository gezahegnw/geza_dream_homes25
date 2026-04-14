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
  description: 'Find your dream home in the Kansas City metro area with Geza Worku, a dedicated BHG Kansas City Homes real estate agent. Browse the latest property listings, get expert market insights, and start your home buying or selling journey today.',
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
    <html lang="en" suppressHydrationWarning>
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
              email: ["gezarealestateagent@gmail.com", "gezahegnw@knasascityhomes.com"],
              address: {
                "@type": "PostalAddress",
                streetAddress: "8300 College Blvd, Ste 130",
                addressLocality: "Overland Park",
                addressRegion: "KS",
                postalCode: "66210",
                addressCountry: "US",
              },
              brand: {
                "@type": "Organization",
                name: "BHG Kansas City Homes",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} bg-white min-h-screen flex flex-col`}>
        <header className="sticky top-0 z-40 bg-white shadow-sm">
          <nav className="w-full flex h-20 items-center justify-between px-0 md:px-0">
            <a href="/" className="flex items-center leading-tight pl-4 pr-2" aria-label="Geza Dream Homes">
              <Image
                src="/logo-light.svg"
                alt="Geza Dream Homes"
                width={300}
                height={80}
                priority
                sizes="(max-width: 768px) 240px, 300px"
                className="h-16 md:h-20 w-auto"
              />
            </a>
            <div className="hidden items-center space-x-8 md:flex">
              <a href="/" className="text-gray-700 hover:text-brand">Home</a>
              <a href="/listings" className="text-gray-700 hover:text-brand">Listings</a>
              <a href="/favorites" className="text-gray-700 hover:text-brand">Favorites</a>
              <a href="/gallery" className="text-gray-700 hover:text-brand">Gallery</a>
              <a href="/about" className="text-gray-700 hover:text-brand">About</a>
              <a href="/reviews" className="text-gray-700 hover:text-brand">Write a Review</a>
              <a 
                href="/contact" 
                className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand/90"
              >
                Contact
              </a>
              {/* Server component pre-hydrates user so header is correct on first paint */}
              <AuthStatusServer />
              <a href="/settings" className="text-gray-700 hover:text-brand" title="Settings">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </a>
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
