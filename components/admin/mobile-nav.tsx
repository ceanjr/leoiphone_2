'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut, ExternalLink } from 'lucide-react'
import { menuItems } from '@/components/admin/sidebar'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { logout } from '@/app/(auth)/login/actions'
import { resetClient } from '@/lib/supabase/client'
import logoImage from '@/public/images/logo.png'

export function AdminMobileNav() {
  const [open, setOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const pathname = usePathname()

  async function handleLogout() {
    setShowLogoutDialog(false)
    setOpen(false)

    // Limpar localStorage e sessionStorage completamente antes do logout
    try {
      // Remover todos os itens relacionados ao Supabase do localStorage
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))

      // Limpar também sessionStorage
      const sessionKeysToRemove: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          sessionKeysToRemove.push(key)
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))

      // Resetar o singleton do Supabase client
      resetClient()
    } catch (e) {
      console.error('Erro ao limpar storage:', e)
    }

    await logout()
  }

  function handleNavigate() {
    setOpen(false)
  }

  return (
    <>
      <header className="relative sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
              <Image src={logoImage} alt="Léo iPhone" fill sizes="40px" className="object-contain" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">Painel Léo iPhone</p>
              <span className="text-xs text-zinc-500">Gestão administrativa</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 text-white transition hover:border-zinc-700 hover:bg-zinc-900"
            aria-label={open ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open ? (
          <div className="absolute left-3 right-3 top-full z-50 mt-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-xl backdrop-blur">
            <nav className="flex flex-col divide-y divide-zinc-800/80">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavigate}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition ${
                      isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                        isActive ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-200' : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{item.title}</span>
                    {isActive ? (
                      <span className="ml-auto text-xs uppercase tracking-wider text-yellow-300">ativo</span>
                    ) : null}
                  </Link>
                )
              })}

              {/* Catalog Link */}
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleNavigate}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-400 transition hover:text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400">
                  <ExternalLink className="h-4 w-4" />
                </span>
                <span>Ver Catálogo</span>
                <ExternalLink className="ml-auto h-3 w-3 text-zinc-600" />
              </Link>
            </nav>
            <div className="border-t border-zinc-800/80 bg-zinc-950/90 px-4 py-3">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-zinc-300 hover:bg-zinc-900 hover:text-white"
                onClick={() => {
                  setShowLogoutDialog(true)
                }}
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </Button>
            </div>
          </div>
        ) : null}
      </header>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        title="Sair da conta"
        description="Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o painel administrativo."
        confirmText="Sair"
        cancelText="Cancelar"
        onConfirm={handleLogout}
        variant="destructive"
      />
    </>
  )
}
