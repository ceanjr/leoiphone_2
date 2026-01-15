import { Header } from '@/components/admin/header'
import { CategoryForm } from '@/components/admin/categorias/category-form'

export const metadata = {
  title: 'Nova Categoria - Admin Léo iPhone',
  description: 'Adicionar nova categoria de produtos',
}

export default function NovaCategoriaPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header
        title="Nova Categoria"
        description="Adicione uma nova categoria de produtos"
      />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-xl">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <CategoryForm />
          </div>
        </div>
      </div>
    </div>
  )
}
