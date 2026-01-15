'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Image as ImageIcon,
  LogOut,
  Eye,
  Calculator,
  Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { performLogout } from '@/lib/utils/auth-helpers'
import logoImage from '@/public/images/logo.png'

export const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
  },
  {
    title: 'Produtos',
    icon: Package,
    href: '/admin/produtos',
  },
  {
    title: 'Categorias',
    icon: FolderTree,
    href: '/admin/categorias',
  },
  {
    title: 'Banners',
    icon: ImageIcon,
    href: '/admin/banners',
  },
  {
    title: 'Taxas',
    icon: Calculator,
    href: '/admin/taxas',
  },
  {
    title: 'Produtos Relacionados',
    icon: Link2,
    href: '/admin/produtos-relacionados',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  async function handleLogout() {
    setShowLogoutDialog(false)
    await performLogout()
  }

  return (
    <div className="flex h-full flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Logo - Using static import */}
      <Link
        href="/admin/dashboard"
        className="flex h-16 items-center gap-3 border-b border-zinc-800 px-6 transition-opacity hover:opacity-80"
      >
        <div className="relative h-10 w-10 flex-shrink-0">
          <Image src={logoImage} alt="Léo iPhone" fill className="object-contain" sizes="40px" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Léo iPhone</h1>
          <p className="text-xs text-zinc-400">Admin</p>
        </div>
      </Link>

      {/* Menu */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}

        {/* Separator */}
        <div className="my-2 border-t border-zinc-800" />

        {/* Catalog Link */}
        <Link
          href="/"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          <Eye className="h-5 w-5" />
          Ver Catálogo
        </Link>
      </nav>

      {/* Logout */}
      <div className="border-t border-zinc-800 p-4">
        <Button
          onClick={() => setShowLogoutDialog(true)}
          variant="ghost"
          className="w-full cursor-pointer justify-start text-zinc-400 hover:bg-zinc-900 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>

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
    </div>
  )
}
