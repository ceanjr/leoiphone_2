'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { deleteProduto, toggleProdutoAtivo } from '@/app/admin/produtos/actions'
import type { ProdutoComCategoria } from '@/types/produto'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ProductListAdminProps {
  products: ProdutoComCategoria[]
  onProductDeleted?: (productId: string) => void
}

export function ProductListAdmin({
  products,
  onProductDeleted,
}: ProductListAdminProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; nome: string }>({
    open: false,
    id: '',
    nome: '',
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const handleDelete = async () => {
    const { id, nome } = deleteDialog
    setDeleteDialog({ open: false, id: '', nome: '' })
    setDeleting(id)

    try {
      const result = await deleteProduto(id)
      if (result.success) {
        toast.success(`"${nome}" excluído com sucesso!`)
        onProductDeleted?.(id)
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao excluir produto')
      }
    } catch {
      toast.error('Erro ao excluir produto')
    } finally {
      setDeleting(null)
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

  const openDeleteDialog = (id: string, nome: string) => {
    setDeleteDialog({ open: true, id, nome })
  }

  if (products.length === 0) {
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
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Preço
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {products.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-zinc-400">
                      {product.codigo_produto || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <Link
                        href={`/produto/${product.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-1 font-medium text-white hover:text-yellow-400"
                      >
                        {product.nome}
                        <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                      <p className="text-xs text-zinc-500">
                        {product.categoria?.nome || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-white">
                      {formatPrice(product.preco)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(product.id, product.ativo)}
                      disabled={toggling === product.id}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        product.ativo
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20'
                      }`}
                    >
                      {product.ativo ? (
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
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/produtos/${product.id}/editar`}
                        className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-yellow-400"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => openDeleteDialog(product.id, product.nome)}
                        disabled={deleting === product.id}
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
        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >
            {/* Product Info */}
            <div>
              <p className="text-xs text-zinc-500">
                {product.categoria?.nome || '-'}
                {product.codigo_produto && ` • ${product.codigo_produto}`}
              </p>
              <Link
                href={`/produto/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 font-semibold text-white hover:text-yellow-400"
              >
                <span className="line-clamp-2">{product.nome}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </Link>
              <p className="mt-2 text-xl font-bold text-white">
                {formatPrice(product.preco)}
              </p>
            </div>

            {/* Actions Row */}
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-800 pt-4">
              {/* Status Button */}
              <button
                onClick={() => handleToggleActive(product.id, product.ativo)}
                disabled={toggling === product.id}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  product.ativo
                    ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20'
                }`}
              >
                {product.ativo ? (
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
                <Link
                  href={`/admin/produtos/${product.id}/editar`}
                  className="flex items-center gap-1 rounded-md bg-yellow-500/10 px-3 py-2 text-sm font-medium text-yellow-400 transition-colors hover:bg-yellow-500/20"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Link>

                <button
                  onClick={() => openDeleteDialog(product.id, product.nome)}
                  disabled={deleting === product.id}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: '', nome: '' })}>
        <AlertDialogContent className="border-zinc-800 bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja excluir <strong className="text-white">&quot;{deleteDialog.nome}&quot;</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
