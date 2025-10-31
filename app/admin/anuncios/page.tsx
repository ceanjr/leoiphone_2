import { Metadata } from 'next'
import { AnunciosManager } from '@/components/admin/anuncios/anuncios-manager'

export const metadata: Metadata = {
  title: 'Anúncios Facebook | Admin',
  description: 'Gerenciar anúncios no Facebook Marketplace',
}

export default function AnunciosPage() {
  return (
    <div className="container mx-auto max-w-7xl space-y-4 p-4 sm:space-y-6 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Anúncios Facebook</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:mt-2 sm:text-base">
            Gerencie seus anúncios no Facebook Marketplace
          </p>
        </div>
      </div>

      <AnunciosManager />
    </div>
  )
}
