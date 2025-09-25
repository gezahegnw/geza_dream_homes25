import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kansas City Metro Real Estate Services',
  description: 'Welcome to Geza Dream Homes, your trusted partner for buying and selling real estate in the Kansas City metro area. Explore featured properties, client testimonials, and expert resources to start your journey.',
};

export const dynamic = "force-dynamic";
import HeroSlider from '@/components/HeroSlider';
import WhyChooseUs from '@/components/WhyChooseUs';
import Testimonials from '@/components/Testimonials';
import MortgageCalculator from '@/components/MortgageCalculator';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section with Slider */}
      <HeroSlider />
      
      
      {/* Why Choose Us */}
      <div className="pt-16">
        <WhyChooseUs />
      </div>
      
      
      {/* Testimonials */}
      <Testimonials />

      {/* Featured Listings Preview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Properties</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your trusted partner in finding the perfect home in Kansas City Metro Area. Let&apos;s make your dream home a reality.
            </p>
          </div>
          <div className="text-center">
            <a
              href="/listings"
              className="inline-block bg-brand text-white px-8 py-3 rounded-lg font-medium hover:bg-brand/90 transition-colors"
            >
              View All Properties
            </a>
          </div>
        </div>
      </section>

      {/* Mortgage Calculator */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Calculate Your Monthly Payment</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get an estimate of your monthly mortgage payment and see if you're ready to buy.
            </p>
          </div>
          <MortgageCalculator />
        </div>
      </section>

      {/* Resources for Buyers & Sellers */}
      <section className="bg-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-2xl font-bold text-gray-900 md:text-3xl">Resources</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="https://kcrar.com/buyers-sellers/buying-a-home/"
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-lg border bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <h3 className="mb-2 text-lg font-semibold text-brand group-hover:underline">Buying a Home</h3>
              <p className="text-sm text-gray-600">KCRAR guide for home buyers</p>
            </a>
            <a
              href="https://kcrar.com/buyers-sellers/selling-a-home/"
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-lg border bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <h3 className="mb-2 text-lg font-semibold text-brand group-hover:underline">Selling a Home</h3>
              <p className="text-sm text-gray-600">Tips and steps to sell your home</p>
            </a>
            <a
              href="https://kcrar.com/buyers-sellers/find-a-downpayment-program/"
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-lg border bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <h3 className="mb-2 text-lg font-semibold text-brand group-hover:underline">Find a Downpayment Program</h3>
              <p className="text-sm text-gray-600">Discover assistance programs</p>
            </a>
            <a
              href="https://kcrar.com/media-statistics/market-statistics/"
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-lg border bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <h3 className="mb-2 text-lg font-semibold text-brand group-hover:underline">Market Statistics</h3>
              <p className="text-sm text-gray-600">Latest market data from KCRAR</p>
            </a>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="bg-brand py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">Ready to Find Your Dream Home?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg">
            Contact me today to schedule a consultation and start your home buying or selling journey.
          </p>
          <a
            href="/contact"
            className="inline-block rounded-lg bg-white px-8 py-3 text-lg font-medium text-brand hover:bg-gray-100"
          >
            Get in Touch
          </a>
        </div>
      </section>
    </main>
  );
}
