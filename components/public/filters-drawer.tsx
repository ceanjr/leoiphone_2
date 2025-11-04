'use client'

import { useState, useEffect } from 'react'
import { X, SlidersHorizontal, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ColorBadge } from '@/components/shared/color-badge'

export interface ProductFilters {
  priceMin: number | null
  priceMax: number | null
  batteryMin: number | null
  colors: string[]
  storage: string[]
}

interface FiltersDrawerProps {
  open: boolean
  onClose: () => void
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
  availableColors: string[]
  availableStorage: string[]
  priceRange: { min: number; max: number }
}

const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB']
const BATTERY_OPTIONS = [80, 85, 90, 95, 100]

export function FiltersDrawer({
  open,
  onClose,
  filters,
  onFiltersChange,
  availableColors,
  availableStorage,
  priceRange,
}: FiltersDrawerProps) {
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleApply = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  const handleClear = () => {
    const cleared: ProductFilters = {
      priceMin: null,
      priceMax: null,
      batteryMin: null,
      colors: [],
      storage: [],
    }
    setLocalFilters(cleared)
    onFiltersChange(cleared)
  }

  const toggleColor = (color: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }))
  }

  const toggleStorage = (storage: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      storage: prev.storage.includes(storage)
        ? prev.storage.filter((s) => s !== storage)
        : [...prev.storage, storage],
    }))
  }

  const activeFiltersCount =
    (localFilters.priceMin !== null || localFilters.priceMax !== null ? 1 : 0) +
    (localFilters.batteryMin !== null ? 1 : 0) +
    localFilters.colors.length +
    localFilters.storage.length

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-3xl border-t border-zinc-800 bg-zinc-950 shadow-2xl animate-in slide-in-from-bottom duration-300 md:left-auto md:right-4 md:top-20 md:bottom-auto md:w-96 md:max-h-[calc(100vh-6rem)] md:rounded-2xl md:border">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <SlidersHorizontal className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Filtros</h2>
              {activeFiltersCount > 0 && (
                <p className="text-xs text-zinc-500">{activeFiltersCount} ativos</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 pb-28 md:pb-6" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          <div className="space-y-6">
            {/* Faixa de Preço */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-white">Faixa de Preço</Label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="price-min" className="text-xs text-zinc-400">
                      Mínimo
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                        R$
                      </span>
                      <input
                        id="price-min"
                        type="number"
                        min={priceRange.min}
                        max={priceRange.max}
                        value={localFilters.priceMin ?? ''}
                        onChange={(e) =>
                          setLocalFilters({
                            ...localFilters,
                            priceMin: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        placeholder={priceRange.min.toFixed(0)}
                        className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="price-max" className="text-xs text-zinc-400">
                      Máximo
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                        R$
                      </span>
                      <input
                        id="price-max"
                        type="number"
                        min={priceRange.min}
                        max={priceRange.max}
                        value={localFilters.priceMax ?? ''}
                        onChange={(e) =>
                          setLocalFilters({
                            ...localFilters,
                            priceMax: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        placeholder={priceRange.max.toFixed(0)}
                        className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>R$ {priceRange.min.toFixed(0)}</span>
                  <span>R$ {priceRange.max.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Nível de Bateria */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-white">Bateria Mínima</Label>
              <div className="grid grid-cols-5 gap-2">
                {BATTERY_OPTIONS.map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setLocalFilters({
                        ...localFilters,
                        batteryMin: localFilters.batteryMin === level ? null : level,
                      })
                    }
                    className={`flex h-12 flex-col items-center justify-center rounded-lg border transition-all ${
                      localFilters.batteryMin === level
                        ? 'border-green-500 bg-green-500/20 text-green-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-base font-bold">{level}</span>
                    <span className="text-[9px]">%</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cores */}
            {availableColors.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-white">
                  Cores ({availableColors.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => toggleColor(color)}
                      className={`group relative overflow-hidden rounded-lg border transition-all ${
                        localFilters.colors.includes(color)
                          ? 'border-yellow-500 bg-yellow-500/10'
                          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 px-3 py-2">
                        <ColorBadge color={color} size="sm" productName="" />
                        {localFilters.colors.includes(color) && (
                          <Check className="h-3.5 w-3.5 text-yellow-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Armazenamento */}
            {availableStorage.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-white">Armazenamento</Label>
                <div className="grid grid-cols-3 gap-2">
                  {STORAGE_OPTIONS.filter((s) => availableStorage.includes(s)).map((storage) => (
                    <button
                      key={storage}
                      onClick={() => toggleStorage(storage)}
                      className={`flex h-11 items-center justify-center rounded-lg border text-sm font-semibold transition-all ${
                        localFilters.storage.includes(storage)
                          ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {storage}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur-sm md:relative">
          <div className="flex gap-3">
            <Button
              onClick={handleClear}
              variant="outline"
              className="flex-1 border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800"
            >
              Limpar
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 font-semibold text-black hover:from-yellow-600 hover:to-orange-600"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
