'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calculator, MessageCircle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WhatsAppContactButton } from '@/components/shared/whatsapp-contact-button'
import { CalculadoraTaxasDialog } from '@/components/public/calculadora-taxas-dialog'
import { useAuth } from '@/hooks/use-auth'
import { usePollingTaxas } from '@/hooks/use-polling-taxas'
import type { TaxasConfig } from '@/lib/validations/taxas'
import logoImage from '@/public/images/logo.png'

export function PublicHeader() {
  const { isAuthenticated, loading } = useAuth()
  const [calculadoraOpen, setCalculadoraOpen] = useState(false)
  const [whatsappOpen, setWhatsappOpen] = useState(false)
  const [calculadoraAtiva, setCalculadoraAtiva] = useState(true) // Assume ativo por padrão
  const [menuOpen, setMenuOpen] = useState(false)

  // Polling: verificar se calculadora está ativa
  const handleTaxasUpdate = useCallback((config: { ativo: boolean; taxas: TaxasConfig }) => {
    setCalculadoraAtiva(config.ativo)
  }, [])

  usePollingTaxas({
    enabled: true,
    interval: 5000,
    onUpdate: handleTaxasUpdate,
  })

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between gap-3 sm:h-16">
          {/* Logo - Using static import for better caching */}
          <Link href="/" className="flex flex-shrink-0 items-center">
            <div className="relative h-8 w-24 sm:h-10 sm:w-32">
              <Image
                src={logoImage}
                alt="LéoiPhone"
                fill
                sizes="(max-width: 640px) 96px, 128px"
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop Actions - hidden on mobile */}
          <div className="hidden items-center gap-3 sm:flex">
            <WhatsAppContactButton
              className="min-h-[44px] bg-[var(--brand-yellow)] font-medium text-[var(--brand-black)] hover:bg-[var(--brand-yellow)]/90"
              label="WhatsApp"
              message="Olá, vim do catálogo do Léo iPhone."
            />

            {calculadoraAtiva && <CalculadoraTaxasDialog triggerClassName="min-h-[44px]" />}

            {!loading && (
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href={isAuthenticated ? '/admin/dashboard' : '/login'}>
                  {isAuthenticated ? 'Dashboard' : 'Admin'}
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu - visible only on mobile */}
          <div className="flex sm:hidden">
            <DropdownMenu onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="group rounded-mdtext-zinc-300 flex min-h-[38px] min-w-[38px] flex-col items-center justify-center gap-[5px] transition-colors hover:text-white active:text-[var(--brand-yellow)]"
                  aria-label="Menu"
                >
                  {/* Animated hamburger icon */}
                  <span
                    className={`block h-[2px] w-6 rounded-full bg-current text-(--brand-yellow) transition-all duration-300 ${
                      menuOpen ? 'translate-y-[7px] rotate-45' : ''
                    }`}
                  />
                  <span
                    className={`block h-[2px] w-6 rounded-full bg-current text-(--brand-yellow) transition-all duration-300 ${
                      menuOpen ? 'opacity-0' : ''
                    }`}
                  />
                  <span
                    className={`block h-[2px] w-6 rounded-full bg-current text-(--brand-yellow) transition-all duration-300 ${
                      menuOpen ? '-translate-y-[7px] -rotate-45' : ''
                    }`}
                  />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-64 border-zinc-800 bg-zinc-950/98 shadow-[0_8px_30px_rgb(0,0,0,0.6)] backdrop-blur-lg"
              >
                <DropdownMenuLabel className="text-xs font-normal text-zinc-400">
                  Menu
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* WhatsApp */}
                <DropdownMenuItem
                  className="min-h-[44px] cursor-pointer gap-3"
                  onClick={() => setWhatsappOpen(true)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--brand-yellow)]/20 bg-[var(--brand-yellow)]/10">
                    <MessageCircle className="h-4 w-4 text-[var(--brand-yellow)]" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">WhatsApp</span>
                    <span className="text-xs text-zinc-500">Fale conosco</span>
                  </div>
                </DropdownMenuItem>

                {/* Calculadora */}
                {calculadoraAtiva && (
                  <DropdownMenuItem
                    className="min-h-[44px] cursor-pointer gap-3"
                    onClick={() => setCalculadoraOpen(true)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
                      <Calculator className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">Calculadora</span>
                      <span className="text-xs text-zinc-500">Simule parcelas</span>
                    </div>
                  </DropdownMenuItem>
                )}

                {/* Admin/Dashboard */}
                {!loading && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="min-h-[44px] cursor-pointer gap-3" asChild>
                      <Link href={isAuthenticated ? '/admin/dashboard' : '/login'}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80">
                          <Shield className="h-4 w-4 text-zinc-400" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">
                            {isAuthenticated ? 'Dashboard' : 'Admin'}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {isAuthenticated ? 'Painel admin' : 'Fazer login'}
                          </span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialogs controlados externamente */}
            <div className="hidden">
              <WhatsAppContactButton
                open={whatsappOpen}
                onOpenChange={setWhatsappOpen}
                triggerIcon
                className="hidden"
                label="WhatsApp"
                message="Olá, vim do catálogo do Léo iPhone."
              />
              <CalculadoraTaxasDialog
                open={calculadoraOpen}
                onOpenChange={setCalculadoraOpen}
                triggerClassName="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
