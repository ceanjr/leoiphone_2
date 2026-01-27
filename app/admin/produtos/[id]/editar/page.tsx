import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Header } from '@/components/admin/header'
import { ProductForm } from '@/components/admin/produtos/product-form'
import { getProdutoById, getCategorias } from '../../actions'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ categoria?: string; status?: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const { produto } = await getProdutoById(id)

  return {
    title: produto ? `Editar ${produto.nome} - Admin Léo iPhone` : 'Editar Produto',
    description: 'Editar produto do catálogo',
  }
}

export default async function EditarProdutoPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { categoria, status } = await searchParams
  const [{ produto, error }, { categorias }] = await Promise.all([
    getProdutoById(id),
    getCategorias(),
  ])

  if (error || !produto) {
    notFound()
  }

  // Construir URL de retorno preservando filtros
  const returnParams = new URLSearchParams()
  if (categoria) returnParams.set('categoria', categoria)
  if (status) returnParams.set('status', status)
  const returnQuery = returnParams.toString()
  const returnUrl = `/admin/produtos${returnQuery ? `?${returnQuery}` : ''}`

  return (
    <div className="min-h-screen bg-black">
      <Header
        title="Editar Produto"
        description={`Editando: ${produto.nome}`}
      />

      <div className="p-4 md:p-6">
        <Link
          href={returnUrl}
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para Produtos
        </Link>

        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <ProductForm product={produto} categories={categorias} returnUrl={returnUrl} />
          </div>
        </div>
      </div>
    </div>
  )
}
