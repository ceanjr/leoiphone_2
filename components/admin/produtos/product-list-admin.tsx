'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Edit, Trash2, Eye, EyeOff, Download, Loader2 } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'
import { deleteProduto, toggleProdutoAtivo, updateProdutoPreco } from '@/app/admin/produtos/actions'
import type { ProdutoComCategoria } from '@/types/produto'
import { Badge } from '@/components/ui/badge'
import { BatteryIcon } from '@/components/shared/battery-icon'
import { getCorOficial, getContrastColor } from '@/lib/data/iphone-cores'
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

// Mapeamento de cores com hex (fallback completo)
const COR_HEX_MAP: Record<string, { nome: string; hex: string }> = {
  // Português
  dourado: { nome: 'Dourado', hex: '#F9E5C9' },
  prata: { nome: 'Prata', hex: '#E3E4E5' },
  preto: { nome: 'Preto', hex: '#1F2020' },
  branco: { nome: 'Branco', hex: '#F9F6F2' },
  azul: { nome: 'Azul', hex: '#2B74C7' },
  vermelho: { nome: 'Vermelho', hex: '#BA0C2E' },
  verde: { nome: 'Verde', hex: '#4E5851' },
  roxo: { nome: 'Roxo', hex: '#D1C4E9' },
  amarelo: { nome: 'Amarelo', hex: '#FFD954' },
  rosa: { nome: 'Rosa', hex: '#F9E0EB' },
  cinza: { nome: 'Cinza', hex: '#53565A' },
  coral: { nome: 'Coral', hex: '#FF6A4D' },
  grafite: { nome: 'Grafite', hex: '#54524F' },
  bronze: { nome: 'Bronze', hex: '#C4A77D' },
  titanio: { nome: 'Titânio', hex: '#8A8D8F' },
  'ouro rosa': { nome: 'Ouro Rosa', hex: '#E1CEC1' },
  'preto fosco': { nome: 'Preto Fosco', hex: '#0D0D0D' },
  'meia noite': { nome: 'Meia-Noite', hex: '#1F2020' },
  'meia-noite': { nome: 'Meia-Noite', hex: '#1F2020' },
  estelar: { nome: 'Estelar', hex: '#F9F6F2' },
  'azul pacifico': { nome: 'Azul Pacífico', hex: '#4F6D7A' },
  'azul sierra': { nome: 'Azul Sierra', hex: '#A5C7D3' },
  'verde alpino': { nome: 'Verde Alpino', hex: '#576856' },
  'roxo profundo': { nome: 'Roxo Profundo', hex: '#5E5171' },
  'titanio natural': { nome: 'Titânio Natural', hex: '#8A8D8F' },
  'titanio azul': { nome: 'Titânio Azul', hex: '#3D4654' },
  'titanio branco': { nome: 'Titânio Branco', hex: '#F2F1EB' },
  'titanio preto': { nome: 'Titânio Preto', hex: '#3C3C3D' },
  'titanio deserto': { nome: 'Titânio Deserto', hex: '#C4A77D' },
  // Inglês
  gold: { nome: 'Gold', hex: '#F9E5C9' },
  silver: { nome: 'Silver', hex: '#E3E4E5' },
  black: { nome: 'Black', hex: '#1F2020' },
  white: { nome: 'White', hex: '#F9F6F2' },
  blue: { nome: 'Blue', hex: '#2B74C7' },
  red: { nome: 'Red', hex: '#BA0C2E' },
  green: { nome: 'Green', hex: '#4E5851' },
  purple: { nome: 'Purple', hex: '#D1C4E9' },
  yellow: { nome: 'Yellow', hex: '#FFD954' },
  pink: { nome: 'Pink', hex: '#F9E0EB' },
  gray: { nome: 'Gray', hex: '#53565A' },
  grey: { nome: 'Grey', hex: '#53565A' },
  graphite: { nome: 'Graphite', hex: '#54524F' },
  titanium: { nome: 'Titanium', hex: '#8A8D8F' },
  'rose gold': { nome: 'Rose Gold', hex: '#E1CEC1' },
  rosegold: { nome: 'Rose Gold', hex: '#E1CEC1' },
  'jet black': { nome: 'Jet Black', hex: '#0D0D0D' },
  jetblack: { nome: 'Jet Black', hex: '#0D0D0D' },
  'space gray': { nome: 'Space Gray', hex: '#53565A' },
  spacegray: { nome: 'Space Gray', hex: '#53565A' },
  'space grey': { nome: 'Space Gray', hex: '#53565A' },
  'space black': { nome: 'Space Black', hex: '#1F2020' },
  spaceblack: { nome: 'Space Black', hex: '#1F2020' },
  midnight: { nome: 'Midnight', hex: '#1F2020' },
  starlight: { nome: 'Starlight', hex: '#F9F6F2' },
  'pacific blue': { nome: 'Pacific Blue', hex: '#4F6D7A' },
  pacificblue: { nome: 'Pacific Blue', hex: '#4F6D7A' },
  'sierra blue': { nome: 'Sierra Blue', hex: '#A5C7D3' },
  sierrablue: { nome: 'Sierra Blue', hex: '#A5C7D3' },
  'alpine green': { nome: 'Alpine Green', hex: '#576856' },
  alpinegreen: { nome: 'Alpine Green', hex: '#576856' },
  'deep purple': { nome: 'Deep Purple', hex: '#5E5171' },
  deeppurple: { nome: 'Deep Purple', hex: '#5E5171' },
  'natural titanium': { nome: 'Natural Titanium', hex: '#8A8D8F' },
  naturaltitanium: { nome: 'Natural Titanium', hex: '#8A8D8F' },
  'blue titanium': { nome: 'Blue Titanium', hex: '#3D4654' },
  bluetitanium: { nome: 'Blue Titanium', hex: '#3D4654' },
  'white titanium': { nome: 'White Titanium', hex: '#F2F1EB' },
  whitetitanium: { nome: 'White Titanium', hex: '#F2F1EB' },
  'black titanium': { nome: 'Black Titanium', hex: '#3C3C3D' },
  blacktitanium: { nome: 'Black Titanium', hex: '#3C3C3D' },
  'desert titanium': { nome: 'Desert Titanium', hex: '#C4A77D' },
  deserttitanium: { nome: 'Desert Titanium', hex: '#C4A77D' },
  teal: { nome: 'Teal', hex: '#5AACB3' },
  ultramarine: { nome: 'Ultramarine', hex: '#3F51B5' },
  'midnight green': { nome: 'Midnight Green', hex: '#4E5851' },
  midnightgreen: { nome: 'Midnight Green', hex: '#4E5851' },
  '(product)red': { nome: '(PRODUCT)RED', hex: '#BA0C2E' },
  'product red': { nome: 'PRODUCT RED', hex: '#BA0C2E' },
  productred: { nome: 'PRODUCT RED', hex: '#BA0C2E' },
}

// Helper para normalizar o nome da cor para busca
function normalizarCor(cor: string): string {
  return cor
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
}

// Helper para obter cores do produto (oficiais ou personalizadas)
function getCoresFromProduct(product: ProdutoComCategoria) {
  // Obter lista de cores - priorizar array 'cores', fallback para 'cor_oficial' legado
  let listaCores: string[] = []

  if (product.cores && product.cores.length > 0) {
    listaCores = product.cores
  } else if (product.cor_oficial) {
    // Fallback para campo legado cor_oficial
    listaCores = [product.cor_oficial]
  }

  if (listaCores.length === 0) {
    return []
  }

  return listaCores.map((corNome) => {
    // Tentar obter cor oficial primeiro
    const corOficial = getCorOficial(product.nome, corNome)
    if (corOficial) {
      return corOficial
    }

    // Fallback: tentar encontrar no mapeamento direto (case insensitive, sem acentos)
    const corNormalizada = normalizarCor(corNome)
    const corMapeada = COR_HEX_MAP[corNormalizada]

    if (corMapeada) {
      return {
        nome: corMapeada.nome, // Usa o nome formatado do mapeamento
        hex: corMapeada.hex,
      }
    }

    // Cor totalmente personalizada: usa fundo cinza
    return {
      nome: corNome,
      hex: '#52525b', // zinc-600
    }
  })
}

export function ProductListAdmin({ products, onProductDeleted }: ProductListAdminProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [downloadingPhotos, setDownloadingPhotos] = useState<string | null>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  // Gerar URL de edição preservando filtros atuais
  const getEditUrl = (productId: string) => {
    const categoria = searchParams?.get('categoria')
    const status = searchParams?.get('status')
    const params = new URLSearchParams()
    if (categoria) params.set('categoria', categoria)
    if (status) params.set('status', status)
    const query = params.toString()
    return `/admin/produtos/${productId}/editar${query ? `?${query}` : ''}`
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
      const result = await updateProdutoPreco(productId, price)

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

  // Função para baixar fotos do produto
  const handleDownloadPhotos = async (product: ProdutoComCategoria) => {
    const fotos = product.fotos || []

    if (fotos.length === 0) {
      toast.error('Este produto não possui fotos')
      return
    }

    setDownloadingPhotos(product.id)

    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const slugName = product.slug || product.nome.toLowerCase().replace(/\s+/g, '-')

      // Baixar todas as imagens como blobs
      const imageFiles: File[] = await Promise.all(
        fotos.map(async (fotoUrl, index) => {
          const response = await fetch(fotoUrl)
          const blob = await response.blob()
          const extension = blob.type.split('/')[1] || 'jpg'
          const fileName = `${slugName}-${index + 1}.${extension}`
          return new File([blob], fileName, { type: blob.type })
        })
      )

      if (isMobile && navigator.share && navigator.canShare?.({ files: imageFiles })) {
        // Mobile: usar Web Share API para compartilhar/salvar na galeria
        await navigator.share({
          files: imageFiles,
          title: `Fotos - ${product.nome}`,
        })
        toast.success(`${fotos.length} foto(s) compartilhada(s)`)
      } else {
        // Desktop ou fallback: criar ZIP com todas as fotos
        const zip = new JSZip()
        const folder = zip.folder(slugName)

        if (!folder) {
          throw new Error('Erro ao criar pasta no ZIP')
        }

        imageFiles.forEach((file) => {
          folder.file(file.name, file)
        })

        // Gerar e baixar o ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        saveAs(zipBlob, `${slugName}-fotos.zip`)
        toast.success(`ZIP com ${fotos.length} foto(s) baixado`)
      }
    } catch (error) {
      // Se o usuário cancelar o share, não mostrar erro
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      console.error('Erro ao baixar fotos:', error)
      toast.error('Erro ao baixar fotos')
    } finally {
      setDownloadingPhotos(null)
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
                  Descrição
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-zinc-400 uppercase">
                  Cor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-zinc-400 uppercase">
                  Bateria
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-zinc-400 uppercase">
                  Estado
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
                    {product.descricao ? (
                      <p className="max-w-[200px] truncate text-sm text-zinc-400" title={product.descricao}>
                        {product.descricao}
                      </p>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const cores = getCoresFromProduct(product)
                      if (cores.length === 0) return <span className="text-zinc-500">-</span>
                      return (
                        <div className="flex flex-wrap gap-1">
                          {cores.map((cor, index) => (
                            <Badge
                              key={index}
                              className="px-2 py-0.5 text-xs"
                              style={{
                                backgroundColor: cor.hex,
                                color: getContrastColor(cor.hex),
                              }}
                            >
                              {cor.nome}
                            </Badge>
                          ))}
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    {product.nivel_bateria ? (
                      <div className="flex items-center gap-1.5">
                        <BatteryIcon level={product.nivel_bateria} />
                        <span className="text-sm text-zinc-300">{product.nivel_bateria}%</span>
                      </div>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {product.condicao === 'novo' ? (
                      <Badge className="bg-green-600 px-2 py-0.5 text-xs text-white">Novo</Badge>
                    ) : product.condicao === 'seminovo' ? (
                      <Badge className="bg-amber-600 px-2 py-0.5 text-xs text-white">
                        Seminovo
                      </Badge>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
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
                        href={getEditUrl(product.id)}
                        className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-yellow-400"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDownloadPhotos(product)}
                        disabled={downloadingPhotos === product.id || !product.fotos?.length}
                        className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-blue-500/10 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Baixar Fotos"
                      >
                        {downloadingPhotos === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </button>
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
            {/* Header com código em destaque */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-zinc-500">{product.categoria?.nome || '-'}</p>
              {product.codigo_produto && (
                <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-sm font-semibold text-yellow-400">
                  {product.codigo_produto}
                </span>
              )}
            </div>

            {/* Product Info */}
            <div>
              <Link
                href={`/produto/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-lg font-semibold text-white hover:text-yellow-400"
              >
                <span className="line-clamp-2">{product.nome}</span>
              </Link>

              {/* Descrição do produto */}
              {product.descricao && (
                <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{product.descricao}</p>
              )}

              {/* Badges de Cor, Bateria e Condição */}
              {(() => {
                const cores = getCoresFromProduct(product)
                return (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {cores.map((cor, index) => (
                      <Badge
                        key={index}
                        className="px-2 py-0.5 text-xs"
                        style={{
                          backgroundColor: cor.hex,
                          color: getContrastColor(cor.hex),
                        }}
                      >
                        {cor.nome}
                      </Badge>
                    ))}
                    {product.nivel_bateria ? (
                      <Badge className="flex items-center gap-1.5 bg-zinc-700 px-2 py-0.5 text-xs text-white">
                        <BatteryIcon level={product.nivel_bateria} />
                        <span>{product.nivel_bateria}%</span>
                      </Badge>
                    ) : product.condicao === 'novo' ? (
                      <Badge className="bg-green-600 px-2 py-0.5 text-xs text-white">Novo</Badge>
                    ) : (
                      <Badge className="bg-amber-600 px-2 py-0.5 text-xs text-white">
                        Seminovo
                      </Badge>
                    )}
                  </div>
                )
              })()}

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

              <button
                onClick={() => handleDownloadPhotos(product)}
                disabled={downloadingPhotos === product.id || !product.fotos?.length}
                className="flex items-center gap-1 rounded-md bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                title="Baixar Fotos"
              >
                {downloadingPhotos === product.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </button>

              {/* Edit, Photos and Delete Buttons */}
              <div className="flex items-center gap-2">
                <Link
                  href={getEditUrl(product.id)}
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
