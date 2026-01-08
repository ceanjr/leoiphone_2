import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { Analytics } from '@vercel/analytics/react'
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
    title: 'Catálogo Léo iPhone',
    description:
      'Veja os modelos disponíveis de iPhones com preços, imagens e informações detalhadas.',
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.leoiphone.com.br',
    siteName: 'Léo iPhone',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.leoiphone.com.br'}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Léo iPhone - Catálogo Completo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catálogo Léo iPhone',
    description:
      'Veja os modelos disponíveis de iPhones com preços, imagens e informações detalhadas.',
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
        <meta name="theme-color" content="#09090b" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <div suppressHydrationWarning>{children}</div>
        <Toaster richColors closeButton />
        <Analytics />
      </body>
    </html>
  )
}
