'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WhatsAppContactButton } from '@/components/shared/whatsapp-contact-button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export function PublicHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [searchTerm, setSearchTerm] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

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
    setMobileSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="container mx-auto px-4">
        {/* Desktop & Mobile Header */}
        <div className="flex h-14 sm:h-16 items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <div className="relative h-8 sm:h-10 w-24 sm:w-32">
              <Image
                src="/images/logo.png"
                alt="LéoiPhone"
                fill
                sizes="(max-width: 640px) 96px, 128px"
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSubmit} className="relative hidden md:block w-64 lg:w-80">
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

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden min-h-[44px] min-w-[44px]"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Abrir busca"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* WhatsApp Button */}
            <WhatsAppContactButton
              className="bg-[var(--brand-yellow)] text-[var(--brand-black)] hover:bg-[var(--brand-yellow)]/90 min-h-[44px]"
              triggerIcon
              label="WhatsApp"
            />

            {/* Admin Link - Hidden on mobile */}
            <Button asChild variant="outline" className="hidden sm:flex min-h-[44px]">
              <Link href="/login">Admin</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Search Dialog */}
      <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        <DialogContent className="top-0 translate-y-0 border-zinc-800 bg-zinc-950 p-0 sm:max-w-lg">
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 p-4">
              <DialogTitle className="text-lg font-semibold text-white">
                Buscar Produtos
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                onClick={() => setMobileSearchOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSubmit} className="p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="search"
                  placeholder="Digite o modelo do iPhone..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-12 border-zinc-800 bg-zinc-900 pl-11 text-base text-white placeholder:text-zinc-500"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="mt-4 h-12 w-full bg-[var(--brand-yellow)] text-[var(--brand-black)] hover:bg-[var(--brand-yellow)]/90"
              >
                <Search className="mr-2 h-5 w-5" />
                Buscar
              </Button>
            </form>

            {/* Search Tips */}
            <div className="border-t border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-400">
                💡 Dica: Busque por modelo como "iPhone 14", "iPhone 13 Pro" ou código do produto
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
