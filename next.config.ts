import type { NextConfig } from 'next'

// Optimization Phase 2: Bundle analyzer to identify unused JS
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

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
    formats: ['image/webp'], // Optimization LCP: Only WebP for faster processing
    minimumCacheTTL: 86400, // Optimization LCP: 24 hours cache
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
  },

  // Optimization: Enable compression for smaller bundles
  compress: true,

  // Optimization Phase 2: Advanced compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Optimization Phase 2: Enhanced package imports and CSS optimization
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@/components/ui',
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-dropdown-menu',
    ],
    optimizeCss: true,
  },

  // Optimization: Disable source maps in production for smaller builds
  productionBrowserSourceMaps: false,

  // Optimization: Security and performance headers
  poweredByHeader: false,
  generateEtags: true,
}

export default withBundleAnalyzer(nextConfig)
