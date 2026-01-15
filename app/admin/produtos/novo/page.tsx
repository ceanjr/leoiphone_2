import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Header } from '@/components/admin/header'
import { ProductForm } from '@/components/admin/produtos/product-form'
import { getCategorias } from '../actions'

export const metadata = {
  title: 'Novo Produto - Admin Léo iPhone',
  description: 'Adicionar novo produto ao catálogo',
}

export default async function NovoProdutoPage() {
  const { categorias } = await getCategorias()

  return (
    <div className="min-h-screen bg-black">
      <Header
        title="Novo Produto"
        description="Preencha os dados do novo produto"
      />

      <div className="p-4 md:p-6">
        <Link
          href="/admin/produtos"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para Produtos
        </Link>

        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <ProductForm categories={categorias} />
          </div>
        </div>
      </div>
    </div>
  )
}
