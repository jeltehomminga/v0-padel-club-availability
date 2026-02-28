/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack filesystem caching: significantly faster restarts
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },

  // Images: modern defaults for Next.js 16
  images: {
    minimumCacheTTL: 14400, // 4 hours
  },
}

export default nextConfig
