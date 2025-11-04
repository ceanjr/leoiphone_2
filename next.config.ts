import type { NextConfig } from 'next'

// @ts-ignore - next-pwa doesn't have types
import withPWAInit from 'next-pwa'

// Optimization Phase 2: Bundle analyzer to identify unused JS
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// PWA Configuration
const withPWA = withPWAInit({
  dest: 'public',
  // Desabilitar completamente em desenvolvimento para evitar problemas de cache
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // Não cachear páginas HTML (apenas assets)
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    // NUNCA cachear auth requests do Supabase
    {
      urlPattern: /^https:\/\/aswejqbtejibrilrblnm\.supabase\.co\/auth/,
      handler: 'NetworkOnly',
    },
    // Cache de imagens do Supabase
    {
      urlPattern: /^https:\/\/aswejqbtejibrilrblnm\.supabase\.co\/storage/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'supabase-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache de imagens locais
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache de Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // API calls com NetworkFirst (sempre tenta rede primeiro)
    {
      urlPattern: /^https:\/\/aswejqbtejibrilrblnm\.supabase\.co\/rest/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutos
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
})

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,

  // Optimization: Enhanced image configuration for cost reduction
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
    formats: ['image/webp'], // WebP only - reduces transformations (removed AVIF)
    minimumCacheTTL: 2678400, // 31 days cache (reduced transformations)
    deviceSizes: [640, 750, 828, 1080, 1200], // Mobile-first optimized sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256], // Thumbnail sizes
    unoptimized: false, // Keep optimization for product photos
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

export default withPWA(withBundleAnalyzer(nextConfig))
