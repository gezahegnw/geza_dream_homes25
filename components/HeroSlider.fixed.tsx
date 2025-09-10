'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Loader2, ArrowLeft, ArrowRight, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SlideData {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

const slides: SlideData[] = [
  { 
    image: '/Photos/home2.jpg',
    title: 'Luxury Homes in Kansas City',
    subtitle: 'Discover your dream home in the heart of the city',
    ctaText: 'View Properties',
    ctaLink: '/properties'
  },
  { 
    image: '/Photos/home3.jpg',
    title: 'Modern Living Spaces',
    subtitle: 'Contemporary designs with premium finishes',
    ctaText: 'Explore Listings',
    ctaLink: '/listings'
  },
  { 
    image: '/Photos/home4.jpg',
    title: 'Spacious Family Homes',
    subtitle: 'Perfect for growing families in great neighborhoods',
    ctaText: 'Find Your Home',
    ctaLink: '/homes'
  },
  { 
    image: '/Photos/home5.jpg',
    title: 'Investment Opportunities',
    subtitle: 'Great properties with high ROI potential',
    ctaText: 'Invest Now',
    ctaLink: '/investments'
  },
  { 
    image: '/Photos/home12.jpg',
    title: 'Luxury Condos',
    subtitle: 'Upscale urban living at its finest',
    ctaText: 'View Condos',
    ctaLink: '/condos'
  },
  { 
    image: '/Photos/home13.jpg',
    title: 'Suburban Retreats',
    subtitle: 'Peaceful living just minutes from the city',
    ctaText: 'Explore Suburbs',
    ctaLink: '/suburbs'
  },
  { 
    image: '/Photos/home20.jpg',
    title: 'Waterfront Properties',
    subtitle: 'Stunning homes with water views',
    ctaText: 'View Waterfront',
    ctaLink: '/waterfront'
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
  const sliderRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isMounted = useRef(true);

  // Initialize loaded and error states
  useEffect(() => {
    setLoaded(Array(slides.length).fill(false));
    setError(Array(slides.length).fill(false));
    
    // Set up intersection observer for auto-pausing when not visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );
    
    if (sliderRef.current) {
      observer.observe(sliderRef.current);
    }
    
    return () => {
      if (sliderRef.current) {
        observer.unobserve(sliderRef.current);
      }
      clearTimeout(timeoutRef.current);
      isMounted.current = false;
    };
  }, []);

  // Auto-advance slides with optimized timer
  useEffect(() => {
    if (isPaused || !isVisible) return;
    
    const startTimer = () => {
      timeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          setCurrentSlide(prev => (prev + 1) % slides.length);
          startTimer();
        }
      }, 6000);
    };
    
    startTimer();
    
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [currentSlide, isPaused, isVisible]);

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
        setCurrentSlide(prev => (prev + 1) % slides.length);
      } else {
        // Swipe right - go to previous slide
        setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
      }
    }
  }, [touchStart, touchEnd]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
          break;
        case 'ArrowRight':
          setCurrentSlide(prev => (prev + 1) % slides.length);
          break;
        case ' ':
        case 'Enter':
          // Navigate to the current slide's CTA link
          const currentSlideData = slides[currentSlide];
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
    setLoaded((prev) => {
      const newLoaded = [...prev];
      newLoaded[index] = true;
      return newLoaded;
    });
  };

  // Handle image error
  const handleImageError = (index: number) => {
    setError((prev) => {
      const newError = [...prev];
      newError[index] = true;
      return newError;
    });
  };

  // Go to specific slide
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Go to next slide
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  // Go to previous slide
  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  // Filter out slides with missing or errored images
  const validSlides = slides.filter((_, index) => !error[index]);

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
          <p className="text-gray-600 mb-6">We're currently updating our property listings. Please check back soon!</p>
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

  // Preload next and previous images
  useEffect(() => {
    const preloadImages = [
      slides[(currentSlide + 1) % slides.length]?.image,
      slides[(currentSlide - 1 + slides.length) % slides.length]?.image
    ].filter(Boolean);
    
    preloadImages.forEach(src => {
      const img = new window.Image();
      img.src = src as string;
    });
  }, [currentSlide]);

  return (
    <section 
      ref={sliderRef}
      className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Featured properties"
    >
      <AnimatePresence initial={false} mode="wait">
        {slides.map((slide, index) => (
          <motion.div
            key={`${slide.image}-${index}`}
            className="absolute inset-0"
            initial={{ opacity: 0, x: index > currentSlide ? '100%' : '-100%' }}
            animate={{ 
              opacity: currentSlide === index ? 1 : 0,
              x: currentSlide === index ? 0 : (index > currentSlide ? '100%' : '-100%'),
              transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] }
            }}
            exit={{ 
              opacity: 0,
              x: index > currentSlide ? '-100%' : '100%',
              transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] }
            }}
          >
            {!error[index] && (
              <div className="relative w-full h-full">
                <div className="absolute inset-0">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority={index < 2} // Preload first 2 slides
                    loading={index < 2 ? 'eager' : 'lazy'}
                    onLoadingComplete={() => handleImageLoad(index)}
                    onError={() => handleImageError(index)}
                  />
                </div>
                
                {!loaded[index] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                      <p className="text-gray-500">Loading {slide.title}...</p>
                    </div>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end pb-16 md:items-center md:pb-0">
                  <div className="container mx-auto px-6">
                    <motion.div 
                      className="max-w-3xl text-white"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ 
                        y: currentSlide === index ? 0 : 20,
                        opacity: currentSlide === index ? 1 : 0,
                        transition: { delay: 0.3, duration: 0.5 }
                      }}
                    >
                      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 leading-tight">
                        {slide.title}
                      </h2>
                      <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 text-gray-200 max-w-2xl">
                        {slide.subtitle}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <a
                          href={slide.ctaLink}
                          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          {slide.ctaText}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </a>
                        <a
                          href="/properties"
                          className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                        >
                          View All Properties
                        </a>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Navigation Arrows with hover effect */}
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
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

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 z-10">
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
      
      {/* Pagination dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="group relative p-2 focus:outline-none"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={currentSlide === index ? 'true' : 'false'}
          >
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSlide === index 
                ? 'bg-white scale-125' 
                : 'bg-white/50 group-hover:bg-white/75 group-focus:ring-2 group-focus:ring-white/50'
            }`} />
            {currentSlide === index && (
              <motion.span 
                className="absolute left-1/2 -bottom-6 -translate-x-1/2 text-xs font-medium text-white whitespace-nowrap"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {slides[index].title}
              </motion.span>
            )}
          </button>
        ))}
      </div>
      
      {/* Slide counter */}
      <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm font-medium px-3 py-1 rounded-full backdrop-blur-sm">
        {currentSlide + 1} / {slides.length}
      </div>
    </section>
  );
};

export default HeroSlider;
