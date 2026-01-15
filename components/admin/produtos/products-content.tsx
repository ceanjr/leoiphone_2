'use client'

import { useState, useMemo, useEffect } from 'react'
import { Filter } from 'lucide-react'
import type { ProdutoComCategoria } from '@/types/produto'
import { ProductListAdmin } from './product-list-admin'
import { ordenarProdutosPorModelo } from '@/lib/utils/produtos/helpers'

interface Categoria {
  id: string
  nome: string
  ordem?: number
}

interface ProductsContentProps {
  products: ProdutoComCategoria[]
  categories: Categoria[]
}

export function ProductsContent({ products, categories }: ProductsContentProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ativo')
  const [localProducts, setLocalProducts] = useState<ProdutoComCategoria[]>(products)

  // Sincronizar produtos locais com props quando mudarem
  useEffect(() => {
    setLocalProducts(products)
  }, [products])

  // Handler para remoção de produto da lista local
  const handleProductDeleted = (productId: string) => {
    setLocalProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  // Filtrar categorias que têm produtos
  const categoriesWithProducts = useMemo(() => {
    return categories
      .filter((category) => {
        const count = localProducts.filter((p) => p.categoria_id === category.id).length
        return count > 0
      })
      .sort((a, b) => (a.ordem || 9999) - (b.ordem || 9999))
  }, [categories, localProducts])

  // Filtrar produtos com base nos filtros selecionados
  const filteredProducts = useMemo(() => {
    let result = localProducts

    // Filtrar por categoria
    if (selectedCategoryId) {
      result = result.filter((p) => p.categoria_id === selectedCategoryId)
    }

    // Filtrar por status
    if (selectedStatus === 'ativo') {
      result = result.filter((p) => p.ativo)
    } else if (selectedStatus === 'inativo') {
      result = result.filter((p) => !p.ativo)
    }

    // Ordenar por modelo e capacidade (mesma ordenação do catálogo)
    return ordenarProdutosPorModelo([...result])
  }, [localProducts, selectedCategoryId, selectedStatus])

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filtro de Categoria */}
        <div className="max-w-xs flex-1">
          <label className="mb-2 block text-xs font-medium tracking-wider text-zinc-500 uppercase">
            Categoria
          </label>
          <div className="relative w-full">
            <Filter className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pr-10 pl-10 text-sm text-white transition-colors focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none"
            >
              <option value="">Todas as Categorias</option>
              {categoriesWithProducts.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nome}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
              <svg
                className="h-5 w-5 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Toggle Switch de Status */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
            Mostrar:
          </span>
          <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900 p-1">
            <button
              onClick={() => setSelectedStatus('ativo')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                selectedStatus === 'ativo'
                  ? 'bg-green-500/50 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              Ativo
            </button>
            <button
              onClick={() => setSelectedStatus('inativo')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                selectedStatus === 'inativo'
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              Inativo
            </button>
          </div>
        </div>
      </div>

      {/* Contagem de resultados */}
      <div className="text-sm text-zinc-400">
        <span className="font-semibold">{filteredProducts.length}</span>{' '}
        {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
      </div>

      {/* Lista de Produtos */}
      <ProductListAdmin products={filteredProducts} onProductDeleted={handleProductDeleted} />
    </div>
  )
}
