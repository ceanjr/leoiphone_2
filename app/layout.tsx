import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
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
      </head>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        <div suppressHydrationWarning>{children}</div>
        <Toaster position="top-right" expand={false} richColors closeButton />
      </body>
    </html>
  );
}
