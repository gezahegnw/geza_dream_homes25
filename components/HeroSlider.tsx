'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SlideData {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  alt?: string;
}

const slides: SlideData[] = [
  {
    image: '/Photos/home2.jpg',
    title: 'Lakefront modern villa at sunrise',
    subtitle: 'Stone-and-glass home overlooking a calm lake and hills',
    ctaText: 'View Waterfront',
    ctaLink: '/waterfront',
    alt: 'Modern stone-and-glass villa overlooking a calm lake at sunrise'
  },
  {
    image: '/Photos/home3.jpg',
    title: 'Snowy suburban street with brick homes',
    subtitle: 'Row of attached houses, cars, and a wood fence in fresh snow',
    ctaText: 'Explore Suburbs',
    ctaLink: '/suburbs',
    alt: 'Row of suburban homes and cars during a light snowfall on a sunny day'
  },
  {
    image: '/Photos/home4.jpg',
    title: 'Two‑story craftsman family home at dusk',
    subtitle: 'Gabled roof, gray siding, and lit windows after rain',
    ctaText: 'Find Your Home',
    ctaLink: '/homes',
    alt: 'Two-story craftsman-style family home with lit windows at dusk'
  },
  {
    image: '/Photos/home5.jpg',
    title: 'Two‑story home with three‑car garage at sunset',
    subtitle: 'Wide driveway, gray siding, and warm interior lights',
    ctaText: 'See Listings',
    ctaLink: '/listings',
    alt: 'Freshly landscaped two-story home with three-car garage at sunset'
  },
  {
    image: '/Photos/home12.jpg',
    title: 'Aerial view of a suburban neighborhood',
    subtitle: 'Cul‑de‑sacs, tree‑lined streets, and detached houses',
    ctaText: 'Browse Listings',
    ctaLink: '/listings',
    alt: 'Aerial view of a suburban neighborhood with tree-lined streets'
  },
  {
    image: '/Photos/home13.jpg',
    title: 'Cozy living room with plants and gray sofa',
    subtitle: 'Potted succulents on a white table in front of a couch',
    ctaText: 'View Interiors',
    ctaLink: '/listings',
    alt: 'Close-up of living room decor with plants, sofa, and throw blanket'
  },
  {
    image: '/Photos/home20.jpg',
    title: 'Bright white kitchen with island and pendant lights',
    subtitle: 'Shaker cabinets, stainless appliances, and wood floors',
    ctaText: 'Browse Homes',
    ctaLink: '/listings',
    alt: 'Spacious white kitchen with island, stainless appliances, and pendant lights'
  },
  {
    image: '/Photos/home21.jpg',
    title: 'Modern condo living and dining room',
    subtitle: 'Glass table, patterned chairs, sofa, and tall windows',
    ctaText: 'View Condos',
    ctaLink: '/condos',
    alt: 'Contemporary condo interior with dining table, sofa, and large windows'
  }
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>([]);
  const [error, setError] = useState<boolean[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [imageList, setImageList] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isMounted = useRef(false);

  // Total slides to use (prefer dynamic list from API) — only after client mounts to avoid hydration mismatch
  const total = (isClient && imageList && imageList.length > 0) ? imageList.length : slides.length;

  // Mark client-mounted to avoid hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch all images from /api/photos and init states (client only)
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch('/api/photos');
        if (!res.ok) throw new Error('Failed to load photos');
        const data = await res.json();
        if (Array.isArray(data.images)) {
          setImageList(data.images);
        }
      } catch (e) {
        // Fallback silently to built-in slides
      }
    };
    if (isClient) fetchImages();
  }, [isClient]);

  // Initialize loaded and error arrays whenever total changes
  useEffect(() => {
    if (total > 0) {
      setLoaded(Array(total).fill(false));
      setError(Array(total).fill(false));
    }
    
    // Set up intersection observer for auto-pausing when not visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    if (sliderRef.current) {
      observer.observe(sliderRef.current);
    }
    
    return () => {
      if (sliderRef.current) {
        observer.unobserve(sliderRef.current);
      }
      clearTimeout(timeoutRef.current);
    };
  }, []);

  // Track mount status explicitly (handles React Strict Mode double-invoke)
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Auto-advance using chained timeouts keyed to currentSlide (client only)
  useEffect(() => {
    if (!isClient || total < 2) return;
    // Log for debugging in DevTools
    try { console.debug('[HeroSlider] advance to', currentSlide); } catch {}
    const id = setTimeout(() => {
      if (!isMounted.current) return;
      setCurrentSlide(prev => (prev + 1) % total);
    }, 4000);
    return () => clearTimeout(id);
  }, [currentSlide, total, isClient]);

  // Handle touch events for swipe with momentum
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = useCallback(() => {
    const touchDiff = touchStart - touchEnd;
    const swipeThreshold = 50;
    
    if (Math.abs(touchDiff) > swipeThreshold) {
      if (touchDiff > 0) {
        // Swipe left - go to next slide
        setCurrentSlide(prev => (prev + 1) % Math.max(total, 1));
      } else {
        // Swipe right - go to previous slide
        setCurrentSlide(prev => (prev - 1 + Math.max(total, 1)) % Math.max(total, 1));
      }
    }
  }, [touchStart, touchEnd]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          setCurrentSlide(prev => (prev - 1 + Math.max(total, 1)) % Math.max(total, 1));
          break;
        case 'ArrowRight':
          setCurrentSlide(prev => (prev + 1) % Math.max(total, 1));
          break;
        case ' ':
        case 'Enter':
          // Navigate to the current slide's CTA link
          const currentSlideData = slides[currentSlide % slides.length];
          if (currentSlideData?.ctaLink) {
            window.location.href = currentSlideData.ctaLink;
          }
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  // Handle image load
  const handleImageLoad = (index: number) => {
    setLoaded(prev => {
      const newLoaded = [...prev];
      newLoaded[index] = true;
      return newLoaded;
    });
  };

  // Handle image error
  const handleImageError = (index: number) => {
    setError(prev => {
      const newError = [...prev];
      newError[index] = true;
      return newError;
    });
  };

  // Go to specific slide
  const goToSlide = (index: number) => {
    setCurrentSlide(index % Math.max(total, 1));
  };

  // Go to next slide
  const nextSlide = () => {
    setCurrentSlide(prev => (prev === total - 1 ? 0 : prev + 1));
  };

  // Go to previous slide
  const prevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? total - 1 : prev - 1));
  };

  // Preload next and previous images
  useEffect(() => {
    if (total <= 0) return;
    const list = imageList.length > 0 ? imageList : slides.map(s => s.image);
    const preloadImages = [
      list[(currentSlide + 1) % total],
      list[(currentSlide - 1 + total) % total]
    ].filter(Boolean);
    
    preloadImages.forEach(src => {
      const img = new window.Image();
      img.src = src as string;
    });
  }, [currentSlide, total, imageList]);

  // Filter out slides with missing or errored images
  const validSlides = (imageList.length > 0 ? imageList : slides.map(s => s.image)).filter((_, index) => !error[index]);

  // If no valid slides, show a placeholder
  if (validSlides.length === 0) {
    return (
      <div 
        className="relative h-[80vh] w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"
        role="alert"
        aria-live="polite"
      >
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Slides Available</h2>
          <p className="text-gray-600 mb-6">We&apos;re currently updating our property listings. Please check back soon!</p>
          <a 
            href="/properties" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            View All Properties
          </a>
        </div>
      </div>
    );
  }

  return (
    <section 
      ref={sliderRef}
      className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Featured properties"
    >
      {isClient && (
        <AnimatePresence mode="sync">
          {(() => {
            const index = currentSlide % Math.max(total, 1);
            const list = imageList.length > 0 ? imageList : slides.map(s => s.image);
            const imgSrc = list[index];
            const meta = slides[index % slides.length];
            if (error[index]) return null;
            return (
              <motion.div
                key={imgSrc}
                className="absolute inset-0 z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <div className="relative w-full h-full">
                  <div className="absolute inset-0">
                    <img
                      src={`${imgSrc}?v=${index}`}
                      alt={meta?.alt ?? meta?.title ?? 'Featured property'}
                      className="w-full h-full object-cover"
                      loading={index < 2 ? 'eager' : 'lazy'}
                      onLoad={() => handleImageLoad(index)}
                      onError={() => handleImageError(index)}
                    />
                  </div>
                  {/* Soft gradient overlay for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                  <div className="absolute inset-0 flex items-end pb-16 md:items-center md:pb-0">
                    <div className="container mx-auto px-6">
                      <div className="max-w-3xl text-white">
                        {/* Buttons removed per user request */}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      )}

      {/* Navigation Arrows with hover effect */}
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none z-30">
        <motion.button
          onClick={prevSlide}
          className="bg-black/60 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 pointer-events-auto"
          aria-label="Previous slide"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.button>
        <motion.button
          onClick={nextSlide}
          className="bg-black/60 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 pointer-events-auto"
          aria-label="Next slide"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.button>
      </div>

      {/* Progress bar (render after client to avoid hydration mismatch on animations) */}
      {isClient && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 z-30">
          <motion.div 
            className="h-full bg-white"
            initial={{ width: '0%' }}
            animate={{ 
              width: isPaused || !isVisible ? '100%' : '0%',
              transition: { 
                duration: 6, 
                ease: 'linear',
                repeat: Infinity,
                repeatType: 'loop',
                repeatDelay: 0.5
              }
            }}
            key={currentSlide}
          />
        </div>
      )}
      
      {/* Pagination dots and slide counter removed per request */}

      
    </section>
  );
};

export default HeroSlider;
