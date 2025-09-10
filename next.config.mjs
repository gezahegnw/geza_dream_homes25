/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Disable Image Optimization API
  },
  // Handle static files from public directory
  async rewrites() {
    return [];
  },
};

export default nextConfig;
