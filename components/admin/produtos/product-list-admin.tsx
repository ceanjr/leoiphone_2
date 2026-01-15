'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { deleteProduto, toggleProdutoAtivo, updateProduto } from '@/app/admin/produtos/actions'
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

export function ProductListAdmin({ products, onProductDeleted }: ProductListAdminProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; nome: string }>({
    open: false,
    id: '',
    nome: '',
  })

  // Estado para edição inline (desktop e mobile)
  const [editingPriceMobile, setEditingPriceMobile] = useState<string | null>(null)
  const [mobilePriceValue, setMobilePriceValue] = useState('')
  const [updatingPrice, setUpdatingPrice] = useState(false)

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

  // Iniciar edição inline (desktop e mobile)
  const startMobilePriceEdit = (id: string, currentPrice: number) => {
    setEditingPriceMobile(id)
    setMobilePriceValue(currentPrice.toString())
  }

  // Cancelar edição inline
  const cancelMobilePriceEdit = () => {
    setEditingPriceMobile(null)
    setMobilePriceValue('')
  }

  // Salvar preço editado inline
  const saveMobilePrice = async (productId: string) => {
    const price = parseFloat(mobilePriceValue)

    if (isNaN(price) || price <= 0) {
      toast.error('Digite um preço válido')
      return
    }

    setUpdatingPrice(true)
    try {
      const product = products.find((p) => p.id === productId)
      if (!product) {
        toast.error('Produto não encontrado')
        return
      }

      const result = await updateProduto(productId, {
        ...product,
        preco: price,
        descricao: product.descricao === null ? undefined : product.descricao,
      })

      if (result.success) {
        toast.success('Preço atualizado!')
        setEditingPriceMobile(null)
        setMobilePriceValue('')
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao atualizar preço')
      }
    } catch {
      toast.error('Erro ao atualizar preço')
    } finally {
      setUpdatingPrice(false)
    }
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
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-zinc-400 uppercase">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-zinc-400 uppercase">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-zinc-400 uppercase">
                  Preço{' '}
                  <span className="text-[10px] text-zinc-500 normal-case">
                    (clique para editar)
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-zinc-400 uppercase">
                  Custo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-zinc-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-zinc-400 uppercase">
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
                      </Link>
                      <p className="text-xs text-zinc-500">{product.categoria?.nome || '-'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {/* Edição inline de preço no desktop */}
                    {editingPriceMobile === product.id ? (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute top-1/2 left-2 -translate-y-1/2 text-xs text-zinc-400">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={mobilePriceValue}
                            onChange={(e) => setMobilePriceValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveMobilePrice(product.id)
                              } else if (e.key === 'Escape') {
                                cancelMobilePriceEdit()
                              }
                            }}
                            className="w-32 rounded border border-zinc-700 bg-zinc-800 py-1 pr-2 pl-8 text-sm font-semibold text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
                            disabled={updatingPrice}
                            autoFocus
                          />
                        </div>
                        <button
                          onClick={() => saveMobilePrice(product.id)}
                          disabled={updatingPrice}
                          className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {updatingPrice ? '...' : '✓'}
                        </button>
                        <button
                          onClick={cancelMobilePriceEdit}
                          disabled={updatingPrice}
                          className="rounded bg-zinc-700 px-2 py-1 text-xs text-white hover:bg-zinc-600 disabled:opacity-50"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startMobilePriceEdit(product.id, product.preco)}
                        className="cursor-pointer font-semibold text-[var(--brand-yellow)]"
                      >
                        {formatPrice(product.preco)}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-zinc-400">
                      {(product as any).preco_custo
                        ? formatPrice((product as any).preco_custo)
                        : '-'}
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
          <div key={product.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
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
                className="mt-1 flex items-center gap-1 text-lg font-semibold text-white hover:text-yellow-400"
              >
                <span className="line-clamp-2">{product.nome}</span>
              </Link>
              <div className="mt-2 flex items-baseline gap-2">
                {/* Edição inline de preço no mobile */}
                {editingPriceMobile === product.id ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={mobilePriceValue}
                        onChange={(e) => setMobilePriceValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveMobilePrice(product.id)
                          } else if (e.key === 'Escape') {
                            cancelMobilePriceEdit()
                          }
                        }}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 py-1.5 pr-3 pl-10 text-lg font-bold text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
                        disabled={updatingPrice}
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={() => saveMobilePrice(product.id)}
                      disabled={updatingPrice}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {updatingPrice ? '...' : '✓'}
                    </button>
                    <button
                      onClick={cancelMobilePriceEdit}
                      disabled={updatingPrice}
                      className="rounded-md bg-zinc-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-600 disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startMobilePriceEdit(product.id, product.preco)}
                    className="cursor-pointer text-xl font-bold text-[var(--brand-yellow)]"
                  >
                    {formatPrice(product.preco)}
                  </button>
                )}
                {(product as any).preco_custo && (
                  <p className="text-sm text-zinc-500">
                    Custo: {formatPrice((product as any).preco_custo)}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Row */}
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-800 pt-4">
              {/* Status Button */}
              <button
                onClick={() => handleToggleActive(product.id, product.ativo)}
                disabled={toggling === product.id}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
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
                  className="flex items-center gap-1 rounded-md bg-red-500/10 p-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                  Apagar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: '', nome: '' })}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja excluir{' '}
              <strong className="text-white">&quot;{deleteDialog.nome}&quot;</strong>? Esta ação não
              pode ser desfeita.
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
