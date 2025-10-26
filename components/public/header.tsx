'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="container mx-auto px-4">
        {/* Desktop Header */}
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative h-10 w-32">
              <Image
                src="/images/logo.png"
                alt="LéoiPhone"
                fill
                sizes="128px"
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Search & WhatsApp & Login */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                type="search"
                placeholder="Buscar iPhone..."
                className="w-64 border-zinc-800 bg-zinc-900 pl-10 text-white placeholder:text-zinc-500"
              />
            </div>
            <Button
              asChild
              style={{
                backgroundColor: 'var(--brand-yellow)',
                color: 'var(--brand-black)',
              }}
            >
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
