import { Header } from '@/components/admin/header'
import { BannerForm } from '@/components/admin/banners/banner-form'
import { createBanner } from '../actions'

export const metadata = {
  title: 'Novo Banner - Admin Léo iPhone',
  description: 'Criar novo banner para o carrossel',
}

export default function NovoBannerPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header title="Novo Banner" description="Crie um banner para o carrossel da home" />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <BannerForm onSubmit={createBanner} submitLabel="Criar" />
        </div>
      </div>
    </div>
  )
}
