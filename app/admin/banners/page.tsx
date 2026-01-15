import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Header } from '@/components/admin/header'
import { BannerList } from '@/components/admin/banners/banner-list'
import { getBanners } from './actions'

export const metadata = {
  title: 'Banners - Admin Léo iPhone',
  description: 'Gerenciar banners do carrossel',
}

export default async function BannersPage() {
  const { banners } = await getBanners()

  return (
    <div className="min-h-screen bg-black">
      <Header title="Banners" description="Gerencie os banners do carrossel da home" />

      <div className="p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-400">
            {banners.length} banner{banners.length !== 1 ? 's' : ''} cadastrado
            {banners.length !== 1 ? 's' : ''}
          </p>

          <Link
            href="/admin/banners/novo"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--brand-yellow)',
              color: 'var(--brand-black)',
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Banner
          </Link>
        </div>

        <BannerList banners={banners} />
      </div>
    </div>
  )
}
