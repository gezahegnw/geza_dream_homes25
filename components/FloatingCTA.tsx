'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageCircle, X } from 'lucide-react';

export default function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000); // Show after 3 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded ? (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-gray-900">Ready to get started?</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Let's discuss your real estate goals and find your perfect home.
          </p>
          <div className="space-y-2">
            <a
              href="tel:+19134078620"
              className="flex items-center gap-3 w-full bg-brand text-white px-4 py-3 rounded-lg hover:bg-brand/90 transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span className="font-medium">Call Now</span>
            </a>
            <a
              href="/contact"
              className="flex items-center gap-3 w-full bg-gray-100 text-gray-900 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">Send Message</span>
            </a>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-brand text-white p-4 rounded-full shadow-2xl hover:bg-brand/90 transition-all hover:scale-105"
        >
          <Phone className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
