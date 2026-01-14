'use client'

/**
 * Products Manager - Versão Simplificada
 * Baseado no sriphone_2 que funciona perfeitamente
 */

import { useCallback, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import type { ProdutoComCategoria } from '@/types/produto'
import { ordenarProdutosPorModelo } from '@/lib/utils/produtos/helpers'

// Componente simplificado de tabela (importação direta, sem dynamic)
import { ProdutosTableSimple } from '@/components/admin/produtos-table-simple'

// Apenas o form dialog é carregado dinamicamente (pois é pesado e só abre quando necessário)
const ProductFormDialog = dynamic(
  () => import('@/components/admin/produtos/product-form-dialog').then((mod) => mod.ProductFormDialog),
  { ssr: false }
)

interface ProdutosManagerProps {
  produtos: ProdutoComCategoria[]
  errorMessage?: string | null
  initialModalMode?: 'create' | 'edit'
  initialProductId?: string | null
}

export function ProdutosManager({
  produtos,
  errorMessage,
  initialModalMode,
  initialProductId,
}: ProdutosManagerProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  // Extrair categorias únicas dos produtos
  const categories = useMemo(() => {
    const cats = new Map<string, { id: string; nome: string; ordem: number }>()
    produtos.forEach(p => {
      if (p.categoria && !cats.has(p.categoria.id)) {
        cats.set(p.categoria.id, {
          id: p.categoria.id,
          nome: p.categoria.nome,
          ordem: p.categoria.ordem || 9999
        })
      }
    })
    return Array.from(cats.values()).sort((a, b) => a.ordem - b.ordem)
  }, [produtos])

  // Filtrar e ordenar produtos
  const filteredProdutos = useMemo(() => {
    let result = produtos

    // Filtrar por categoria se selecionada
    if (selectedCategoryId) {
      result = result.filter(p => p.categoria?.id === selectedCategoryId)
    }

    // Ordenar por modelo e capacidade (mesma ordenação do catálogo)
    return ordenarProdutosPorModelo([...result])
  }, [produtos, selectedCategoryId])

  // Abrir modal de edição se vier da URL
  useEffect(() => {
    if (!initialModalMode) return
    const handle = window.setTimeout(() => {
      setModalMode(initialModalMode)
      setEditingId(initialModalMode === 'edit' ? initialProductId ?? null : null)
      setModalOpen(true)
      router.replace('/admin/produtos')
    }, 0)
    return () => window.clearTimeout(handle)
  }, [initialModalMode, initialProductId, router])

  const openCreateModal = useCallback(() => {
    setModalMode('create')
    setEditingId(null)
    setModalOpen(true)
  }, [])

  const openEditModal = useCallback((id: string) => {
    setModalMode('edit')
    setEditingId(id)
    setModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
  }, [])

  const handleCompleted = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Produtos</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gerencie o catálogo de produtos
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="w-full sm:w-auto"
          style={{
            backgroundColor: 'var(--brand-yellow)',
            color: 'var(--brand-black)',
          }}
        >
          <Plus className="mr-2 h-5 w-5" />
          Adicionar
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-col gap-2">
        <div className="relative w-full max-w-xs">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pl-10 pr-10 text-sm text-white transition-colors focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
          >
            <option value="">Todas as Categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nome}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-zinc-400">
          <span className="font-semibold">{filteredProdutos.length}</span>{' '}
          {filteredProdutos.length === 1 ? 'produto' : 'produtos'}
        </p>
      </div>

      {/* Products List */}
      {errorMessage ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-8 text-center">
          <p className="text-red-400">{errorMessage}</p>
        </div>
      ) : (
        <ProdutosTableSimple produtos={filteredProdutos} onEditProduto={openEditModal} />
      )}

      {/* Form Dialog */}
      <ProductFormDialog
        open={modalOpen}
        mode={modalMode}
        productId={editingId}
        onClose={handleCloseModal}
        onCompleted={handleCompleted}
      />
    </div>
  )
}
