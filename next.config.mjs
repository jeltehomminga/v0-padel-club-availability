/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Compiler: automatically memoizes components, zero manual useMemo/useCallback needed
  reactCompiler: true,

  // Turbopack filesystem caching: significantly faster restarts (beta)
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },

  // Images: modern defaults for Next.js 16
  images: {
    minimumCacheTTL: 14400, // 4 hours (Next.js 16 default)
  },
}

export default nextConfig
