import { notFound } from 'next/navigation'
import { Header } from '@/components/admin/header'
import { CategoryForm } from '@/components/admin/categorias/category-form'
import { getCategoriaById } from '../../actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const { categoria } = await getCategoriaById(id)

  return {
    title: categoria ? `Editar ${categoria.nome} - Admin Léo iPhone` : 'Editar Categoria',
    description: 'Editar categoria de produtos',
  }
}

export default async function EditarCategoriaPage({ params }: PageProps) {
  const { id } = await params
  const { categoria, error } = await getCategoriaById(id)

  if (error || !categoria) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-black">
      <Header
        title="Editar Categoria"
        description={`Editando: ${categoria.nome}`}
      />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-xl">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <CategoryForm category={categoria} />
          </div>
        </div>
      </div>
    </div>
  )
}
