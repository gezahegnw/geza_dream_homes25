'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

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
  },
  { 
    image: '/Photos/home21.jpg',
    title: 'Luxury Estates',
    subtitle: 'Exclusive properties for discerning buyers',
    ctaText: 'Discover Estates',
    ctaLink: '/estates'
  }
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>([]);
  const [error, setError] = useState<boolean[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Initialize loaded and error states
  useEffect(() => {
    setLoaded(Array(slides.length).fill(false));
    setError(Array(slides.length).fill(false));
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    
    return () => clearInterval(timer);
  }, [isPaused]);

  // Handle touch events for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // Swipe left - go to next slide
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }
    
    if (touchStart - touchEnd < -50) {
      // Swipe right - go to previous slide
      setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    }
  };

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
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  // Go to previous slide
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  // Filter out slides with missing or errored images
  const validSlides = slides.filter((_, index) => !error[index]);

  // If no valid slides, show a placeholder
  if (validSlides.length === 0) {
    return (
      <div className="relative h-[80vh] w-full bg-gray-100 flex items-center justify-center">
        <p className="text-xl text-gray-600">No slides available</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[500px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentSlide === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {!error[index] && (
            <div className="relative w-full h-full">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority={index === 0}
                onLoadingComplete={() => handleImageLoad(index)}
                onError={() => handleImageError(index)}
              />
              {!loaded[index] && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="text-white text-center px-4 max-w-3xl">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">{slide.title}</h2>
                  <p className="text-xl md:text-2xl mb-8">{slide.subtitle}</p>
                  <a
                    href={slide.ctaLink}
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-colors duration-300"
                  >
                    {slide.ctaText}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
        aria-label="Previous slide"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
        aria-label="Next slide"
      >
        <ArrowRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSlide === index ? 'bg-white w-8' : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
