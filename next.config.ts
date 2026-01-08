import type { NextConfig } from 'next'

// Optimization Phase 2: Bundle analyzer to identify unused JS
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,

  // Optimization: Use pre-optimized image variants instead of Vercel's optimization
  // Images are optimized during upload, generating multiple WebP variants (thumb, small, medium, large)
  // This eliminates Vercel's Image Optimization costs entirely (100% free)
  images: {
    unoptimized: true, // Don't use Vercel's image optimization - we pre-optimize everything
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
  turbopack: {},
}

export default withBundleAnalyzer(nextConfig)
