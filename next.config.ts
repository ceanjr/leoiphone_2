import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,

  // Optimization: Enhanced image configuration for better performance
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/leo-iphone-5c9a0/**',
      },
      {
        protocol: 'https',
        hostname: 'aswejqbtejibrilrblnm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 120, // Optimization: 2 minutes for faster updates
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 292, 384],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
  },

  // Optimization: Enable compression for smaller bundles
  compress: true,

  // Optimization: Remove console logs in production, minify code
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Optimization: Package imports optimization for tree shaking
  experimental: {
    optimizePackageImports: ['lucide-react', '@/components/ui', '@radix-ui/react-icons'],
    optimizeCss: true, // Optimization: CSS optimization
  },

  // Optimization: Disable source maps in production for smaller builds
  productionBrowserSourceMaps: false,

  // Optimization: Security and performance headers
  poweredByHeader: false,
  generateEtags: true,
}

export default nextConfig
