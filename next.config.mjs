/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  // Handle static files from public directory
  async rewrites() {
    return [];
  },
  // Production optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },
};

export default nextConfig;
