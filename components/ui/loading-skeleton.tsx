import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variante do skeleton
   */
  variant?: 'default' | 'text' | 'circular' | 'rectangular'
  /**
   * Largura do skeleton (pode ser número em px ou string com unidade)
   */
  width?: number | string
  /**
   * Altura do skeleton (pode ser número em px ou string com unidade)
   */
  height?: number | string
  /**
   * Se deve animar o skeleton
   */
  animate?: boolean
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  animate = true,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    default: 'rounded-md',
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  }

  const style: React.CSSProperties = {}
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width
  }
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height
  }

  return (
    <div
      className={cn(
        'bg-muted',
        animate && 'animate-pulse',
        variantClasses[variant],
        className
      )}
      style={style}
      {...props}
    />
  )
}

/**
 * Skeleton para card de produto
 */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <Skeleton variant="rectangular" className="w-full aspect-square" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton variant="text" className="w-20 h-6" />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
    </div>
  )
}

/**
 * Skeleton para lista de produtos
 */
export function ProductListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton para página de produto
 */
export function ProductPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Galeria */}
        <div className="space-y-4">
          <Skeleton variant="rectangular" className="w-full aspect-square" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="aspect-square" />
            ))}
          </div>
        </div>

        {/* Informações */}
        <div className="space-y-6">
          <Skeleton variant="text" className="w-full h-8" />
          <Skeleton variant="text" className="w-2/3 h-6" />
          <div className="space-y-2">
            <Skeleton variant="text" className="w-full" />
            <Skeleton variant="text" className="w-full" />
            <Skeleton variant="text" className="w-3/4" />
          </div>
          <Skeleton variant="rectangular" className="w-full h-12" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton variant="rectangular" className="h-10" />
            <Skeleton variant="rectangular" className="h-10" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton para tabela
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" className="h-5" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="grid gap-4 py-2 border-b"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={`cell-${rowIdx}-${colIdx}`} variant="text" className="h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton para dashboard card
 */
export function DashboardCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton variant="text" className="w-32 h-5" />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      <Skeleton variant="text" className="w-24 h-8" />
      <Skeleton variant="text" className="w-40 h-4" />
    </div>
  )
}

/**
 * Skeleton para form
 */
export function FormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" className="w-32 h-4" />
          <Skeleton variant="rectangular" className="w-full h-10" />
        </div>
      ))}
      <Skeleton variant="rectangular" className="w-full h-10 mt-6" />
    </div>
  )
}
