import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { Analytics } from '@vercel/analytics/react'
import { ServiceWorkerManager } from '@/components/service-worker-manager'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Léo iPhone - iPhones Novos e Seminovos com Garantia',
    template: '%s | Léo iPhone',
  },
  description:
    'Encontre iPhones novos e seminovos com os melhores preços. Confira nosso catálogo completo!',
  keywords: [
    'iPhone',
    'Apple',
    'iPhone novo',
    'iPhone seminovo',
    'comprar iPhone',
    'Léo iPhone',
    'iPhone com garantia',
    'iPhone barato',
    'iPhone promoção',
    'iPhone Brasil',
  ],
  authors: [{ name: 'Léo iPhone' }],
  creator: 'Léo iPhone',
  publisher: 'Léo iPhone',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.leoiphone.com.br'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Léo iPhone - iPhones Novos e Seminovos com Garantia',
    description:
      'Encontre iPhones novos e seminovos com os melhores preços. Entrega rápida, garantia e atendimento especializado.',
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'Léo iPhone',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Léo iPhone - Catálogo Completo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Léo iPhone - iPhones Novos e Seminovos com Garantia',
    description:
      'Encontre iPhones novos e seminovos com os melhores preços. Confira nosso catálogo!',
    creator: '@leoiphone',
    site: '@leoiphone',
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
  verification: {
    google: '', // Adicionar Google Search Console ID quando configurar
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Optimization: DNS prefetch and preconnect for faster resource loading */}
        <link rel="dns-prefetch" href="https://aswejqbtejibrilrblnm.supabase.co" />
        <link
          rel="preconnect"
          href="https://aswejqbtejibrilrblnm.supabase.co"
          crossOrigin="anonymous"
        />
        {/* Optimization LCP: Preconnect to image storage */}
        <link
          rel="preconnect"
          href="https://aswejqbtejibrilrblnm.supabase.co/storage"
          crossOrigin="anonymous"
        />
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Leo iPhone" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Leo iPhone" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#09090b" />
        {/* PWA Icons */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ServiceWorkerManager />
        <div suppressHydrationWarning>{children}</div>
        <Toaster richColors closeButton />
        <Analytics />
      </body>
    </html>
  )
}
