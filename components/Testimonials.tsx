'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import StarRating from '@/components/StarRating';

type ReviewItem = {
  id: string;
  name: string;
  content: "Geza helped us find our dream home in just 2 weeks! His knowledge of the Kansas City market is incredible and he's always available to answer questions.",
  rating: number;
  title?: string | null;
};

export default function Testimonials() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/reviews?page=1&pageSize=5', { cache: 'no-store' });
        const data = await res.json();
        setItems(data?.items || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const total = items.length;
  const nextTestimonial = () => setCurrent((prev) => (total ? (prev === total - 1 ? 0 : prev + 1) : 0));
  const prevTestimonial = () => setCurrent((prev) => (total ? (prev === 0 ? total - 1 : prev - 1) : 0));

  // Auto-advance every 6s, pause on hover
  useEffect(() => {
    if (!total || paused) return;
    const id = setInterval(() => {
      setCurrent((prev) => (prev === total - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(id);
  }, [total, paused]);

  return (
    <section className="bg-brand/5 py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-900 md:text-4xl">
          What My Clients Say
        </h2>
        <p className="mb-10 text-center text-gray-600">Real words from buyers and sellers I've helped.</p>

        <div
          className="relative mx-auto max-w-4xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {(total ? items : []).map((t) => (
                <div key={t.id} className="w-full flex-shrink-0 px-4">
                  <div className="rounded-2xl bg-white p-8 shadow-lg">
                    <div className="mb-4">
                      <StarRating value={t.rating} readOnly />
                    </div>
                    <p className="mb-6 text-lg italic text-gray-700">&ldquo;{t.content}&rdquo;</p>
                    <div>
                      <p className="font-semibold text-gray-900">{t.name}</p>
                      {t.title && <p className="text-sm text-gray-600">{t.title}</p>}
                    </div>
                  </div>
                </div>
              ))}
              {total === 0 && (
                <div className="w-full flex-shrink-0 px-4">
                  <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
                    {loading ? (
                      <p className="text-gray-600">Loading testimonials…</p>
                    ) : (
                      <p className="text-gray-600">No reviews yet. Be the first to share your experience!</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {total > 1 && (
            <>
              <button
                onClick={prevTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100 focus:outline-none"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-6 w-6 text-gray-700" />
              </button>
              <button
                onClick={nextTestimonial}
                className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100 focus:outline-none"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-6 w-6 text-gray-700" />
              </button>
            </>
          )}

          <div className="mt-6 flex justify-center space-x-2">
            {(total ? items : []).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`h-2 w-2 rounded-full ${current === index ? 'bg-brand' : 'bg-gray-300'}`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-10 flex justify-center gap-3">
          <Link href="/reviews" className="rounded border px-4 py-2 text-sm font-medium">See all reviews</Link>
          <Link href="/reviews#leave-review" className="rounded bg-brand px-4 py-2 text-sm font-medium text-white">Add your review</Link>
        </div>
      </div>
    </section>
  );
}
