import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Header } from '@/components/admin/header'
import { ProductsContent } from '@/components/admin/produtos/products-content'
import { getProdutos, getCategorias } from './actions'

export const metadata = {
  title: 'Produtos - Admin Léo iPhone',
  description: 'Gerenciar produtos do catálogo',
}

export default async function ProdutosPage() {
  const [{ produtos }, { categorias }] = await Promise.all([getProdutos(), getCategorias()])

  return (
    <div className="min-h-screen bg-black">
      <Header title="Produtos" description="Gerencie o catálogo de produtos" />

      {/* Barra fixa com contador e botão (sticky apenas em mobile) */}
      <div className="sticky top-[64px] z-20 border-b border-zinc-800 bg-black px-4 py-4 backdrop-blur-sm md:static md:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-400">
            {produtos.length} produto{produtos.length !== 1 ? 's' : ''} cadastrado
            {produtos.length !== 1 ? 's' : ''}
          </p>

          <Link
            href="/admin/produtos/novo"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--brand-yellow)',
              color: 'var(--brand-black)',
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Link>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <ProductsContent products={produtos} categories={categorias} />
      </div>
    </div>
  )
}
