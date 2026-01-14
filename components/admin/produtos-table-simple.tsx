'use client'

/**
 * Lista de Produtos Admin - Versão Simplificada
 * Baseado no sriphone_2 que funciona perfeitamente
 */

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteProduto, toggleProdutoAtivo } from '@/app/admin/produtos/actions'
import type { ProdutoComCategoria } from '@/types/produto'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

interface ProdutosTableSimpleProps {
  produtos: ProdutoComCategoria[]
  onEditProduto: (produtoId: string) => void
}

export function ProdutosTableSimple({ produtos, onEditProduto }: ProdutosTableSimpleProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [produtoToDelete, setProdutoToDelete] = useState<{ id: string; nome: string } | null>(null)

  const handleDelete = async () => {
    if (!produtoToDelete) return

    setDeleting(produtoToDelete.id)
    try {
      const result = await deleteProduto(produtoToDelete.id)
      if (result.success) {
        toast.success('Produto excluído com sucesso!')
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao excluir produto')
      }
    } catch {
      toast.error('Erro ao excluir produto')
    } finally {
      setDeleting(null)
      setDeleteDialogOpen(false)
      setProdutoToDelete(null)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setToggling(id)
    try {
      const result = await toggleProdutoAtivo(id, !currentStatus)
      if (result.success) {
        toast.success(currentStatus ? 'Produto desativado' : 'Produto ativado')
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao alterar status')
      }
    } catch {
      toast.error('Erro ao alterar status')
    } finally {
      setToggling(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  if (produtos.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
        <p className="text-zinc-400">Nenhum produto encontrado.</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-800 bg-zinc-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Imagem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {produtos.map((produto) => (
                <tr key={produto.id} className="transition-colors hover:bg-zinc-800/50">
                  <td className="px-6 py-4">
                    <div className="relative h-12 w-12 overflow-hidden rounded bg-zinc-950">
                      {produto.foto_principal ? (
                        <Image
                          src={produto.foto_principal}
                          alt={produto.nome}
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                          N/A
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">{produto.nome}</p>
                      <p className="text-xs text-zinc-500">
                        {produto.categoria?.nome || '-'}
                        {produto.codigo_produto && ` • ${produto.codigo_produto}`}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-white">
                      {formatPrice(produto.preco)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(produto.id, produto.ativo)}
                      disabled={toggling === produto.id}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        produto.ativo
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20'
                      }`}
                    >
                      {produto.ativo ? (
                        <>
                          <Eye className="h-3 w-3" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEditProduto(produto.id)}
                        className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-yellow-400"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setProdutoToDelete({ id: produto.id, nome: produto.nome })
                          setDeleteDialogOpen(true)
                        }}
                        disabled={deleting === produto.id}
                        className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="space-y-4 md:hidden">
        {produtos.map((produto) => (
          <div
            key={produto.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >
            {/* Product Header with Image and Info */}
            <div className="flex gap-4">
              {/* Image */}
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-zinc-950">
                {produto.foto_principal ? (
                  <Image
                    src={produto.foto_principal}
                    alt={produto.nome}
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                    N/A
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500">
                  {produto.categoria?.nome || '-'}
                  {produto.codigo_produto && ` • ${produto.codigo_produto}`}
                </p>
                <h3 className="mt-1 font-semibold text-white line-clamp-2">
                  {produto.nome}
                </h3>
                <p className="mt-2 text-xl font-bold text-white">
                  {formatPrice(produto.preco)}
                </p>
              </div>
            </div>

            {/* Actions Row */}
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-800 pt-4">
              {/* Status Button */}
              <button
                onClick={() => handleToggleActive(produto.id, produto.ativo)}
                disabled={toggling === produto.id}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  produto.ativo
                    ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20'
                }`}
              >
                {produto.ativo ? (
                  <>
                    <Eye className="h-4 w-4" />
                    Ativo
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Inativo
                  </>
                )}
              </button>

              {/* Edit and Delete Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditProduto(produto.id)}
                  className="flex items-center gap-1 rounded-md bg-yellow-500/10 px-3 py-2 text-sm font-medium text-yellow-400 transition-colors hover:bg-yellow-500/20"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>

                <button
                  onClick={() => {
                    setProdutoToDelete({ id: produto.id, nome: produto.nome })
                    setDeleteDialogOpen(true)
                  }}
                  disabled={deleting === produto.id}
                  className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir produto"
        description={`Tem certeza que deseja excluir "${produtoToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  )
}
