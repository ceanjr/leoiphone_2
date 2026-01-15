import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Header } from '@/components/admin/header'
import { CategoryList } from '@/components/admin/categorias/category-list'
import { getCategorias } from './actions'

export const metadata = {
  title: 'Categorias - Admin Léo iPhone',
  description: 'Gerenciar categorias de produtos',
}

export default async function CategoriasPage() {
  const { categorias } = await getCategorias()

  return (
    <div className="min-h-screen bg-black">
      <Header
        title="Categorias"
        description="Gerencie as categorias de produtos. Arraste para reordenar."
      />

      <div className="p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-400">
            {categorias.length} categoria{categorias.length !== 1 ? 's' : ''} cadastrada{categorias.length !== 1 ? 's' : ''}
          </p>

          <Link
            href="/admin/categorias/nova"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--brand-yellow)',
              color: 'var(--brand-black)',
            }}
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </Link>
        </div>

        <CategoryList categories={categorias} />
      </div>
    </div>
  )
}
