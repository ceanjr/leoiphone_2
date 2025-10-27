'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WhatsAppContactButton } from '@/components/shared/whatsapp-contact-button'

export function PublicHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!searchParams) return
    const current = searchParams.get('busca') ?? ''
    if (typeof window === 'undefined') return
    const handle = window.setTimeout(() => {
      setSearchTerm((prev) => (prev === current ? prev : current))
    }, 0)
    return () => window.clearTimeout(handle)
  }, [searchParams])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = searchTerm.trim()
    const query = trimmed ? `?busca=${encodeURIComponent(trimmed)}` : ''
    if (pathname === '/' && query === window.location.search) return
    router.push(`/${query}`)
  }

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
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
            <form onSubmit={handleSubmit} className="relative hidden md:block w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                type="search"
                placeholder="Buscar iPhone..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="border-zinc-800 bg-zinc-900 pl-10 text-white placeholder:text-zinc-500"
              />
              <button type="submit" className="sr-only">
                Buscar
              </button>
            </form>
            <WhatsAppContactButton
              className="bg-[var(--brand-yellow)] text-[var(--brand-black)] hover:bg-[var(--brand-yellow)]/90"
              triggerIcon
            >
              WhatsApp
            </WhatsAppContactButton>
            <Button asChild variant="outline">
              <Link href="/login">Admin</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
