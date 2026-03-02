/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack filesystem caching: significantly faster restarts
  experimental: {
    turbopackFileSystemCacheForDev: true,
    inlineCss: true,
  },

  // Images: modern defaults for Next.js 16
  images: {
    minimumCacheTTL: 14400, // 4 hours
  },

  // Replace Next.js polyfill module with empty stub for modern browsers (Lighthouse legacy JS)
  turbopack: {
    resolveAlias: {
      "../build/polyfills/polyfill-module": "./lib/modern-polyfill.js",
      "next/dist/build/polyfills/polyfill-module": "./lib/modern-polyfill.js",
    },
  },
}

export default nextConfig
