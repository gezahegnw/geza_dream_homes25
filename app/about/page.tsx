import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">About Me</h1>
      <div className="grid gap-8 md:grid-cols-2 items-start">
        {/* Bio */}
        <div className="space-y-5 order-2 md:order-1">
          <p className="text-gray-700">
            Welcome! I’m <span className="font-semibold">Gezahegn Worku</span> (Geza), a dedicated real estate agent, committed to
            helping buyers and sellers navigate the exciting journey of homeownership. Whether you’re searching for your dream home,
            looking to sell, or investing in real estate, I’m here to guide you every step of the way.
          </p>
          <p className="text-gray-700">
            With a passion for real estate and a deep understanding of the market, I take pride in providing expert advice, strong
            negotiation skills, and a seamless experience for my clients. My goal is simple: to turn your real estate dreams into
            reality while making the process smooth, stress-free, and even enjoyable!
          </p>
          <p className="text-gray-700">
            I also speak <span className="font-semibold">Amharic</span> fluently and am proud to serve the Amharic-speaking community. If you or your
            family prefer to discuss your real estate needs in Amharic, I’m happy to help from start to finish.
          </p>
          <p className="text-gray-700">
            What sets me apart? I believe that a home is more than just a place to live—it’s where memories are made, futures are
            built, and dreams take shape. That’s why I go above and beyond to ensure every client finds the perfect home or gets the
            best value for their property.
          </p>
          <p className="text-gray-700">
            Outside of real estate, you’ll find me spending time with family and friends or enjoying outdoor adventures. I’d love the
            opportunity to work with you and help you achieve your real estate goals. Let’s make your next move the best one yet!
          </p>
          <div className="pt-1">
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
              Languages: English • Amharic
            </span>
          </div>
          <div>
            <a href="/contact" className="inline-block rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand/90">
              Contact Me
            </a>
          </div>
        </div>

        {/* Photo (reused from Contact page) */}
        <div className="order-1 md:order-2">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border bg-gray-50 shadow-lg">
            <Image
              src="/geza3.jpg"
              alt="Gezahegn Worku — RE/MAX Beyond"
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {/* Caption */}
          <div className="mt-3 text-center text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Gezahegn Worku</p>
            <p>RE/MAX Beyond</p>
          </div>
        </div>
      </div>
    </div>
  );
}
