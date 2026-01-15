import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Header } from '@/components/admin/header'
import { ProductForm } from '@/components/admin/produtos/product-form'
import { getProdutoById, getCategorias } from '../../actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const { produto } = await getProdutoById(id)

  return {
    title: produto ? `Editar ${produto.nome} - Admin Léo iPhone` : 'Editar Produto',
    description: 'Editar produto do catálogo',
  }
}

export default async function EditarProdutoPage({ params }: PageProps) {
  const { id } = await params
  const [{ produto, error }, { categorias }] = await Promise.all([
    getProdutoById(id),
    getCategorias(),
  ])

  if (error || !produto) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-black">
      <Header
        title="Editar Produto"
        description={`Editando: ${produto.nome}`}
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
            <ProductForm product={produto} categories={categorias} />
          </div>
        </div>
      </div>
    </div>
  )
}
