import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Léo iPhone - Catálogo de iPhones",
  description:
    "Catálogo digital profissional para venda de iPhones novos e seminovos. Encontre o iPhone perfeito para você com os melhores preços.",
  keywords: [
    "iPhone",
    "Apple",
    "iPhone novo",
    "iPhone seminovo",
    "comprar iPhone",
    "Léo iPhone",
  ],
  authors: [{ name: "Léo iPhone" }],
  icons: {
    icon: "/icons/favicon.svg",
    shortcut: "/icons/favicon.svg",
    apple: "/icons/favicon.svg",
  },
  openGraph: {
    title: "Léo iPhone - Catálogo de iPhones",
    description:
      "Catálogo digital profissional para venda de iPhones novos e seminovos",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Optimization: DNS prefetch and preconnect for faster resource loading */}
        <link
          rel="dns-prefetch"
          href="https://aswejqbtejibrilrblnm.supabase.co"
        />
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
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        <div suppressHydrationWarning>{children}</div>
        <Toaster position="top-right" expand={false} richColors closeButton />
        <Analytics />
      </body>
    </html>
  );
}
