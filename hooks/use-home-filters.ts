/**
 * Hook para gerenciar filtros e parâmetros de URL
 */

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { ProductFilters } from '@/components/public/filters/filters-drawer'

export function useHomeFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Inicializar estados dos filtros
  const initialBusca = searchParams?.get('busca') ?? ''
  const initialCategoria = searchParams?.get('categoria') ?? 'todas'
  const initialViewMode = (searchParams?.get('view') ?? 'list') as 'grid' | 'list'

  const [busca, setBusca] = useState(initialBusca)
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>(initialCategoria)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)
  const [advancedFilters, setAdvancedFilters] = useState<ProductFilters>({
    priceMin: null,
    priceMax: null,
    batteryMin: null,
    colors: [],
    storage: [],
  })

  // Sincronizar filtros quando searchParams mudar
  useEffect(() => {
    if (!searchParams) return
    const paramBusca = searchParams.get('busca') ?? ''
    const paramCategoria = searchParams.get('categoria') ?? 'todas'
    const paramViewMode = searchParams.get('view') ?? 'list'

    setBusca(paramBusca)
    setCategoriaFiltro(paramCategoria)
    setViewMode(paramViewMode as 'grid' | 'list')
  }, [searchParams])

  // Carregar filtros salvos
  useEffect(() => {
    const savedFilters = localStorage.getItem('product-filters')
    if (savedFilters) {
      try {
        setAdvancedFilters(JSON.parse(savedFilters))
      } catch (e) {
        // Ignorar erro
      }
    }
  }, [])

  // Atualizar URL com filtros
  const updateURL = (newBusca?: string, newCategoria?: string, newViewMode?: 'grid' | 'list') => {
    const params = new URLSearchParams(searchParams?.toString())
    
    const finalBusca = newBusca !== undefined ? newBusca : busca
    const finalCategoria = newCategoria !== undefined ? newCategoria : categoriaFiltro
    const finalViewMode = newViewMode !== undefined ? newViewMode : viewMode

    if (finalBusca.trim()) {
      params.set('busca', finalBusca.trim())
    } else {
      params.delete('busca')
    }

    if (finalCategoria !== 'todas') {
      params.set('categoria', finalCategoria)
    } else {
      params.delete('categoria')
    }

    if (finalViewMode !== 'list') {
      params.set('view', finalViewMode)
    } else {
      params.delete('view')
    }

    const query = params.toString()
    const target = query ? `/?${query}` : '/'
    const currentQuery = searchParams?.toString() ?? ''
    
    if (pathname === '/' && query !== currentQuery) {
      router.replace(target)
    }
  }

  const handleCategoriaChange = (value: string) => {
    setCategoriaFiltro(value)
    updateURL(undefined, value)
  }

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    updateURL(undefined, undefined, mode)
  }

  const limparFiltros = () => {
    setBusca('')
    setCategoriaFiltro('todas')
    setAdvancedFilters({
      priceMin: null,
      priceMax: null,
      batteryMin: null,
      colors: [],
      storage: [],
    })
    router.replace('/')
  }

  return {
    busca,
    setBusca,
    categoriaFiltro,
    setCategoriaFiltro,
    viewMode,
    setViewMode,
    advancedFilters,
    setAdvancedFilters,
    handleCategoriaChange,
    handleViewModeChange,
    limparFiltros,
    updateURL,
  }
}
