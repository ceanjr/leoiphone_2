/**
 * Loading Skeleton para produtos
 * Usado enquanto os produtos estão carregando
 */

interface LoadingSkeletonProps {
  count?: number
  view?: 'grid' | 'list'
}

export function LoadingSkeleton({ count = 4, view = 'grid' }: LoadingSkeletonProps) {
  return (
    <div
      className={
        view === 'grid'
          ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'space-y-4'
      }
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} view={view} />
      ))}
    </div>
  )
}

function ProductCardSkeleton({ view }: { view: 'grid' | 'list' }) {
  if (view === 'list') {
    return (
      <div className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 animate-pulse">
        {/* Imagem */}
        <div className="h-32 w-32 flex-shrink-0 rounded-lg bg-zinc-800" />
        
        {/* Conteúdo */}
        <div className="flex-1 space-y-3">
          {/* Título */}
          <div className="h-6 w-3/4 rounded bg-zinc-800" />
          
          {/* Descrição */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-zinc-800" />
            <div className="h-4 w-5/6 rounded bg-zinc-800" />
          </div>
          
          {/* Preço e badges */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 rounded bg-zinc-800" />
            <div className="h-6 w-16 rounded-full bg-zinc-800" />
            <div className="h-6 w-16 rounded-full bg-zinc-800" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 transition-all hover:border-zinc-700 animate-pulse">
      {/* Imagem */}
      <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-zinc-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-zinc-700" />
        </div>
      </div>

      {/* Badges */}
      <div className="mb-3 flex gap-2">
        <div className="h-5 w-16 rounded-full bg-zinc-800" />
        <div className="h-5 w-20 rounded-full bg-zinc-800" />
      </div>

      {/* Título */}
      <div className="mb-2 h-6 w-full rounded bg-zinc-800" />

      {/* Descrição */}
      <div className="mb-4 space-y-2">
        <div className="h-4 w-full rounded bg-zinc-800" />
        <div className="h-4 w-3/4 rounded bg-zinc-800" />
      </div>

      {/* Preço */}
      <div className="mb-4 h-8 w-32 rounded bg-zinc-800" />

      {/* Botões */}
      <div className="flex gap-2">
        <div className="h-10 flex-1 rounded-lg bg-zinc-800" />
        <div className="h-10 w-10 rounded-lg bg-zinc-800" />
      </div>
    </div>
  )
}

/**
 * Skeleton para lista de produtos (categorias)
 */
export function ProductsByCategorySkeleton() {
  return (
    <div className="space-y-12">
      {Array.from({ length: 2 }).map((_, i) => (
        <section key={i} className="space-y-6 animate-pulse">
          {/* Título da categoria */}
          <div className="border-b border-zinc-800 pb-3">
            <div className="mb-2 h-8 w-48 rounded bg-zinc-800" />
            <div className="h-4 w-32 rounded bg-zinc-800" />
          </div>

          {/* Grid de produtos */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <ProductCardSkeleton key={j} view="grid" />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/**
 * Skeleton para tabelas (admin)
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Header */}
      <div className="flex gap-4 border-b border-zinc-800 pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-5 flex-1 rounded bg-zinc-800" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-12 flex-1 rounded bg-zinc-800" />
          ))}
        </div>
      ))}
    </div>
  )
}
