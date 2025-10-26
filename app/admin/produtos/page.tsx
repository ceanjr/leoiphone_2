import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/shared/loading'
import { ProdutosTable } from '@/components/admin/produtos-table'
import { getProdutos } from './actions'

async function ProdutosContent() {
  const { produtos, error } = await getProdutos()

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return <ProdutosTable produtos={produtos} />
}

export default function ProdutosPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white md:text-2xl">Lista de Produtos</h2>
          <p className="text-xs text-zinc-400 md:text-sm">
            Visualize e gerencie todos os produtos do catálogo
          </p>
        </div>

        <Link href="/admin/produtos/novo" className="w-full sm:w-auto">
          <Button
            className="w-full sm:w-auto"
            style={{
              backgroundColor: 'var(--brand-yellow)',
              color: 'var(--brand-black)',
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <Loading size="lg" text="Carregando produtos..." />
          </div>
        }
      >
        <ProdutosContent />
      </Suspense>
    </div>
  )
}
