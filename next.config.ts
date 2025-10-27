import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,

  // Otimizações de imagem
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
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 dias
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 292, 384],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
  },

  // Compressão e otimizações
  compress: true,

  // Otimizações do compilador
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Configurações experimentais para melhor performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@/components/ui', '@radix-ui/react-icons'],
  },

  sourceMaps: true,

  // Desabilitar devIndicators em produção
  productionBrowserSourceMaps: true,

  // Configurações de produção
  poweredByHeader: false,
  generateEtags: true,
}

export default nextConfig
