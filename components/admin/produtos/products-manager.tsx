'use client'

import { logger } from '@/lib/utils/logger'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import type { ProdutoComCategoria } from '@/types/produto'
import { ordenarProdutosPorModelo } from '@/lib/utils/produtos/helpers'

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Filtrar e ordenar produtos baseado no status
  // Usa a mesma ordenação do catálogo (por modelo e capacidade)
  const filteredProdutos = useMemo(() => {
    const filtered = produtos.filter((produto) => {
      if (statusFilter === 'active') return produto.ativo === true
      if (statusFilter === 'inactive') return produto.ativo === false
      return true // 'all'
    })
    return ordenarProdutosPorModelo(filtered)
  }, [produtos, statusFilter])

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

  const exportarParaCSV = useCallback(() => {
    try {
      // Cabeçalhos do CSV
      const headers = [
        'ID',
        'Código',
        'Nome',
        'Descrição',
        'Preço',
        'Nível Bateria',
        'Condição',
        'Categoria',
        'Garantia',
        'Cores',
        'Acessórios',
        'Ativo',
        'Estoque',
        'Criado em',
        'Atualizado em',
      ]

      // Converter produtos para linhas CSV
      const rows = produtos.map((produto) => {
        // Formatar acessórios
        const acessoriosAtivos = Object.entries(produto.acessorios || {})
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join('; ')

        return [
          produto.id,
          produto.codigo_produto || '',
          produto.nome,
          produto.descricao || '',
          produto.preco.toFixed(2),
          produto.nivel_bateria || '',
          produto.condicao,
          produto.categoria?.nome || '',
          produto.garantia,
          produto.cores?.join('; ') || '',
          acessoriosAtivos || 'Nenhum',
          produto.ativo ? 'Sim' : 'Não',
          produto.estoque || 0,
          new Date(produto.created_at).toLocaleString('pt-BR'),
          new Date(produto.updated_at).toLocaleString('pt-BR'),
        ]
      })

      // Criar conteúdo CSV
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => {
            // Escapar células que contêm vírgula, aspas ou quebra de linha
            const cellStr = String(cell)
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`
            }
            return cellStr
          }).join(',')
        ),
      ].join('\n')

      // Adicionar BOM para UTF-8 (para Excel abrir corretamente)
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

      // Criar link de download
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `produtos_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`${produtos.length} produtos exportados com sucesso!`)
    } catch (error) {
      logger.error('Erro ao exportar CSV:', error)
      toast.error('Erro ao exportar produtos para CSV')
    }
  }, [produtos])

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white md:text-2xl">Lista de Produtos</h2>
          <p className="text-xs text-zinc-400 md:text-sm">
            Visualize e gerencie todos os produtos do catálogo
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            onClick={exportarParaCSV}
            variant="outline"
            className="w-full border-zinc-700 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800 sm:w-auto"
            disabled={produtos.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>

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
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Filtrar por status:</span>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-[180px] border-zinc-700 bg-zinc-900 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900">
              <SelectItem value="all" className="text-white">
                Todos ({produtos.length})
              </SelectItem>
              <SelectItem value="active" className="text-green-400">
                Ativos ({produtos.filter(p => p.ativo).length})
              </SelectItem>
              <SelectItem value="inactive" className="text-red-400">
                Inativos ({produtos.filter(p => !p.ativo).length})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-zinc-400">
          Exibindo {filteredProdutos.length} de {produtos.length} produtos
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-8 text-center">
          <p className="text-red-400">{errorMessage}</p>
        </div>
      ) : (
        <ProdutosTable produtos={filteredProdutos} onEditProduto={openEditModal} />
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
