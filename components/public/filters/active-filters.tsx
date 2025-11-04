'use client'

import { memo } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ColorBadge } from '@/components/shared/color-badge'
import type { ProductFilters } from './filters-drawer'

interface ActiveFiltersProps {
  filters: ProductFilters
  onRemoveFilter: (filterType: keyof ProductFilters, value?: string | number) => void
  onClearAll: () => void
  productCount: number
}

export const ActiveFilters = memo(function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll,
  productCount,
}: ActiveFiltersProps) {
  const hasActiveFilters =
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.batteryMin !== null ||
    filters.colors.length > 0 ||
    filters.storage.length > 0

  if (!hasActiveFilters) return null

  return (
    <div className="mb-6 space-y-3 rounded-xl border border-zinc-800/70 bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Filtros Ativos</h3>
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            {productCount} {productCount === 1 ? 'produto' : 'produtos'}
          </Badge>
        </div>
        <button
          onClick={onClearAll}
          className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
        >
          Limpar tudo
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Preço */}
        {(filters.priceMin !== null || filters.priceMax !== null) && (
          <Badge className="bg-zinc-800 text-white border-zinc-700 pl-3 pr-1 py-1 flex items-center gap-2">
            <span className="text-xs">
              {filters.priceMin !== null && filters.priceMax !== null
                ? `R$ ${filters.priceMin} - R$ ${filters.priceMax}`
                : filters.priceMin !== null
                ? `A partir de R$ ${filters.priceMin}`
                : `Até R$ ${filters.priceMax}`}
            </span>
            <button
              onClick={() => {
                onRemoveFilter('priceMin')
                onRemoveFilter('priceMax')
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-zinc-700"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {/* Bateria */}
        {filters.batteryMin !== null && (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 pl-3 pr-1 py-1 flex items-center gap-2">
            <span className="text-xs">Bateria ≥ {filters.batteryMin}%</span>
            <button
              onClick={() => onRemoveFilter('batteryMin')}
              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-green-500/30"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {/* Cores */}
        {filters.colors.map((color) => (
          <Badge
            key={color}
            className="bg-zinc-800 border-zinc-700 pl-2 pr-1 py-1 flex items-center gap-2"
          >
            <ColorBadge color={color} size="sm" productName="" />
            <button
              onClick={() => onRemoveFilter('colors', color)}
              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-zinc-700"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Armazenamento */}
        {filters.storage.map((storage) => (
          <Badge
            key={storage}
            className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 pl-3 pr-1 py-1 flex items-center gap-2"
          >
            <span className="text-xs font-semibold">{storage}</span>
            <button
              onClick={() => onRemoveFilter('storage', storage)}
              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-yellow-500/30"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
})
