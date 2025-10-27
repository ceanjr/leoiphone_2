'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import type { ProdutoComCategoria } from '@/types/produto'

const ProdutosTable = dynamic(() =>
  import('@/components/admin/produtos-table').then((mod) => mod.ProdutosTable),
  {
    loading: () => (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
        Carregando tabela...
      </div>
    ),
    ssr: false,
  }
)

const ProductFormDialog = dynamic(() =>
  import('@/components/admin/produtos/product-form-dialog').then((mod) => mod.ProductFormDialog),
  {
    loading: () => null,
    ssr: false,
  }
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
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white md:text-2xl">Lista de Produtos</h2>
          <p className="text-xs text-zinc-400 md:text-sm">
            Visualize e gerencie todos os produtos do catálogo
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
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-8 text-center">
          <p className="text-red-400">{errorMessage}</p>
        </div>
      ) : (
        <ProdutosTable produtos={produtos} onEditProduto={openEditModal} />
      )}

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
