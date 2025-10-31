import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { Analytics } from '@vercel/analytics/react'
import { ServiceWorkerManager } from '@/components/service-worker-manager'
import './globals.css'

export const metadata: Metadata = {
  title: 'Léo iPhone - Catálogo',
  description:
    'Veja os modelos disponíveis de iPhones com preço, imagens e informações detalhadas.',
  keywords: ['iPhone', 'Apple', 'iPhone novo', 'iPhone seminovo', 'comprar iPhone', 'Léo iPhone'],
  authors: [{ name: 'Léo iPhone' }],
  metadataBase: new URL('https://www.leoiphone.com.br'),
  openGraph: {
    title: 'Léo iPhone - Catálogo',
    description:
      'Veja os modelos disponíveis de iPhones com preço, imagens e informações detalhadas.',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://www.leoiphone.com.br',
    siteName: 'Léo iPhone',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Léo iPhone - Catálogo',
    description:
      'Veja os modelos disponíveis de iPhones com preço, imagens e informações detalhadas.',
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
