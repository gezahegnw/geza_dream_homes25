'use client';

import { Phone } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MobileCallButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button after scrolling down 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <div className="md:hidden"> {/* Only show on mobile */}
      <a
        href="tel:+19134078620"
        className={`fixed bottom-4 right-4 z-50 bg-brand text-white p-4 rounded-full shadow-lg hover:bg-brand/90 transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
        aria-label="Call Geza Dream Homes"
      >
        <Phone className="h-6 w-6" />
      </a>
    </div>
  );
}
