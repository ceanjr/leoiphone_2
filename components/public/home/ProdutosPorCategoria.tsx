import { ProdutoCard } from '@/components/public/produto-card'
import type { Produto, ProdutoCusto } from '@/types/produto'

interface Categoria {
  id: string
  nome: string
}

interface ProdutosAgrupados {
  categoria: Categoria
  produtos: Produto[]
}

interface ProdutosPorCategoriaProps {
  produtosAgrupados: ProdutosAgrupados[]
  viewMode: 'grid' | 'list'
  returnParams: string
  custosPorProduto: Record<string, ProdutoCusto[]>
  isAuthenticated: boolean
}

export function ProdutosPorCategoria({
  produtosAgrupados,
  viewMode,
  returnParams,
  custosPorProduto,
  isAuthenticated,
}: ProdutosPorCategoriaProps) {
  if (produtosAgrupados.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/50 p-8 text-center">
        <div>
          <p className="text-lg font-semibold text-white">Nenhum produto encontrado</p>
          <p className="mt-2 text-sm text-zinc-400">
            Tente ajustar os filtros ou buscar por outro termo
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {produtosAgrupados.map((grupo) => (
        <section key={grupo.categoria.id} className="space-y-6">
          <div className="border-b border-zinc-800 pb-3">
            <h2 className="text-2xl font-bold text-(--brand-yellow)">{grupo.categoria.nome}</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {grupo.produtos.length} {grupo.produtos.length === 1 ? 'produto' : 'produtos'}
            </p>
          </div>

          <div
            className={
              viewMode === 'grid'
                ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'space-y-4'
            }
          >
            {grupo.produtos.map((produto, index) => (
              <ProdutoCard
                key={produto.id}
                produto={produto}
                view={viewMode}
                priority={index < 4}
                returnParams={returnParams}
                custos={custosPorProduto[produto.id]}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
