'use client'

import { logger } from '@/lib/utils/logger'
import { useEffect, useMemo, useState, memo, type ChangeEvent, type KeyboardEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Edit, Eye, EyeOff, MoreVertical, Save, Search, Trash2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { deleteProduto, toggleProdutoAtivo, updateProdutoPreco } from '@/app/admin/produtos/actions'
import type { ProdutoComCategoria } from '@/types/produto'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ExportImagesDialog } from '@/components/admin/produtos/export-images-dialog'
import { Badge } from '@/components/ui/badge'
import { getCorOficial, getContrastColor } from '@/lib/data/iphone-cores'
import { BatteryIcon } from '@/components/shared/battery-icon'

function parsePriceInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  let normalized = trimmed.replace(/\s+/g, '')
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  }

  const price = Number(normalized)
  return Number.isFinite(price) ? price : null
}

interface PriceEditorProps {
  savedPrice: number
  isSaving: boolean
  onSave: (inputValue: string) => Promise<void>
  inputClassName?: string
  containerClassName?: string
  buttonSize?: 'sm' | 'default'
  buttonClassName?: string
  children?: (props: PriceEditorRenderProps) => React.ReactNode
}

interface PriceEditorRenderProps {
  value: string
  setValue: (value: string) => void
  submit: () => void
  isSaving: boolean
  hasPriceChange: boolean
  isActionDisabled: boolean
  inputProps: {
    value: string
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
    inputMode: 'decimal'
    placeholder: string
    disabled: boolean
    className?: string
  }
}

function PriceEditor({
  savedPrice,
  isSaving,
  onSave,
  inputClassName,
  containerClassName,
  buttonSize = 'sm',
  buttonClassName,
  children,
}: PriceEditorProps) {
  const [value, setValue] = useState<string>(() => savedPrice.toFixed(2))

  useEffect(() => {
    setValue(savedPrice.toFixed(2))
  }, [savedPrice])

  const parsedValue = parsePriceInput(value)
  const hasPriceChange =
    parsedValue !== null && Math.abs(parsedValue - savedPrice) >= 0.005
  const isValidValue = parsedValue !== null && parsedValue > 0
  const isActionDisabled = isSaving || !isValidValue || !hasPriceChange

  async function handleSubmit() {
    if (isActionDisabled) return
    await onSave(value)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handleSubmit()
    }
  }

  const inputProps = {
    value,
    onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value),
    onKeyDown: handleKeyDown,
    inputMode: 'decimal' as const,
    placeholder: '0,00',
    disabled: isSaving,
    className: `h-9 border-zinc-700 bg-zinc-950 text-right text-white ${inputClassName ?? ''}`,
  }

  if (children) {
    return (
      <>
        {children({
          value,
          setValue,
          submit: () => void handleSubmit(),
          isSaving,
          hasPriceChange,
          isActionDisabled,
          inputProps,
        })}
      </>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${containerClassName ?? ''}`}>
      <span className="text-sm text-zinc-400">R$</span>
      <Input {...inputProps} />
      <Button
        size={buttonSize}
        className={`gap-1 ${buttonClassName ?? ''}`}
        onClick={() => void handleSubmit()}
        disabled={isActionDisabled}
      >
        {isSaving ? (
          'Salvando...'
        ) : (
          <>
            <Save className="h-4 w-4" />
            Salvar
          </>
        )}
      </Button>
    </div>
  )
}

interface ProdutosTableProps {
  produtos: ProdutoComCategoria[]
  onEditProduto: (produtoId: string) => void
}

const ProdutosTableComponent = ({ produtos, onEditProduto }: ProdutosTableProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [produtoToDelete, setProdutoToDelete] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null)
  const [exportImagesOpen, setExportImagesOpen] = useState(false)
  const [produtoToExport, setProdutoToExport] = useState<ProdutoComCategoria | null>(null)
  const [savedPrices, setSavedPrices] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    produtos.forEach((produto) => {
      initial[produto.id] = produto.preco
    })
    return initial
  })

  useEffect(() => {
    setSavedPrices((prev) => {
      const next = { ...prev }
      let hasChanges = false

      produtos.forEach((produto) => {
        if (!(produto.id in next) || next[produto.id] !== produto.preco) {
          next[produto.id] = produto.preco
          hasChanges = true
        }
      })

      // Remove produtos que não estão mais na lista
      Object.keys(next).forEach((id) => {
        if (!produtos.some((produto) => produto.id === id)) {
          delete next[id]
          hasChanges = true
        }
      })

      return hasChanges ? next : prev
    })
  }, [produtos])

  // Extrair categorias únicas e ordenar pela ordem definida em admin/categorias
  const categorias = useMemo(() => {
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

  // Função para extrair capacidade de armazenamento em GB
  const extrairArmazenamento = (nome: string): number => {
    // Procurar por padrões como "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"
    const matchGB = nome.match(/(\d+)\s*GB/i)
    if (matchGB) return parseInt(matchGB[1])

    const matchTB = nome.match(/(\d+)\s*TB/i)
    if (matchTB) return parseInt(matchTB[1]) * 1024 // Converter TB para GB

    return 0 // Sem armazenamento especificado
  }

  // Função para extrair número do modelo iPhone
  const extrairNumeroModelo = (nome: string): number => {
    // Casos especiais
    if (nome.toLowerCase().includes('iphone x') && !nome.toLowerCase().includes('xr') && !nome.toLowerCase().includes('xs')) return 10 // iPhone X = 10
    if (nome.toLowerCase().includes('iphone xr')) return 10.3 // iPhone XR entre X e 11
    if (nome.toLowerCase().includes('iphone xs')) return 10.5 // iPhone XS

    // Extrair número padrão (8, 11, 12, 13, 14, 15, 16)
    const match = nome.match(/iphone\s+(\d+)/i)
    if (match) return parseInt(match[1])

    // Se não for iPhone, retornar número alto
    return 9999
  }

  // Filtrar e ordenar produtos
  const produtosFiltrados = useMemo(() => {
    let resultado = [...produtos]

    // Aplicar busca por nome ou código
    if (busca.trim()) {
      const buscaLower = busca.toLowerCase()
      resultado = resultado.filter(
        (p) =>
          p.nome.toLowerCase().includes(buscaLower) ||
          p.codigo_produto?.toLowerCase().includes(buscaLower)
      )
    }

    // Aplicar filtro de categoria
    if (categoriaFiltro !== 'todas') {
      resultado = resultado.filter(p => p.categoria?.id === categoriaFiltro)
    }

    // Ordenar: iPhones em ordem crescente (8, X, XR, XS, 11, 12...), depois outras categorias alfabéticas
    resultado.sort((a, b) => {
      const nomeA = a.nome.toLowerCase()
      const nomeB = b.nome.toLowerCase()

      const isIphoneA = nomeA.includes('iphone')
      const isIphoneB = nomeB.includes('iphone')

      // Se ambos são iPhone, ordenar por modelo
      if (isIphoneA && isIphoneB) {
        const numA = extrairNumeroModelo(a.nome)
        const numB = extrairNumeroModelo(b.nome)

        if (numA !== numB) {
          return numA - numB
        }

        // Mesmo modelo, ordenar por armazenamento (crescente)
        const armazenamentoA = extrairArmazenamento(a.nome)
        const armazenamentoB = extrairArmazenamento(b.nome)
        if (armazenamentoA !== armazenamentoB) {
          return armazenamentoA - armazenamentoB
        }

        // Mesmo modelo e armazenamento, ordenar alfabeticamente
        return a.nome.localeCompare(b.nome)
      }

      // iPhones sempre vêm primeiro
      if (isIphoneA && !isIphoneB) return -1
      if (!isIphoneA && isIphoneB) return 1

      // Ambos não são iPhone: ordenar por categoria e depois alfabético
      const ordemA = a.categoria?.ordem ?? 9999
      const ordemB = b.categoria?.ordem ?? 9999

      if (ordemA !== ordemB) {
        return ordemA - ordemB
      }

      return a.nome.localeCompare(b.nome)
    })

    return resultado
  }, [produtos, busca, categoriaFiltro])

  async function handleSavePrice(produto: ProdutoComCategoria, rawValue: string) {
    const currentSavedPrice = savedPrices[produto.id] ?? produto.preco
    const currentValue = rawValue || currentSavedPrice.toFixed(2)
    const parsedPrice = parsePriceInput(currentValue)

    if (parsedPrice === null) {
      toast.error('Informe um preço válido')
      return
    }

    if (Math.abs(parsedPrice - currentSavedPrice) < 0.005) {
      toast('O preço permanece o mesmo')
      return
    }

    setSavingPriceId(produto.id)
    try {
      const result = await updateProdutoPreco(produto.id, parsedPrice)

      if (!result.success) {
        toast.error(result.error || 'Não foi possível atualizar o preço')
        return
      }

      toast.success('Preço atualizado!')
      setSavedPrices((prev) => ({
        ...prev,
        [produto.id]: parsedPrice,
      }))
    } catch (error) {
      logger.error(error)
      toast.error('Erro inesperado ao atualizar preço')
    } finally {
      setSavingPriceId(null)
    }
  }

  async function handleDelete() {
    if (!produtoToDelete) return

    const result = await deleteProduto(produtoToDelete)

    if (result.success) {
      toast.success('Produto excluído com sucesso!')
      setDeleteDialogOpen(false)
      setProdutoToDelete(null)
    } else {
      toast.error(result.error || 'Erro ao excluir produto')
    }
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    const result = await toggleProdutoAtivo(id, !ativo)

    if (result.success) {
      toast.success(ativo ? 'Produto desativado' : 'Produto ativado')
    } else {
      toast.error(result.error || 'Erro ao alterar status')
    }
  }

  function handleOpenExportImages(produto: ProdutoComCategoria) {
    setProdutoToExport(produto)
    setExportImagesOpen(true)
  }

  function handleCloseExportImages() {
    setExportImagesOpen(false)
    setProdutoToExport(null)
  }

  if (produtos.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center md:p-12">
        <p className="text-zinc-400">Nenhum produto cadastrado ainda.</p>
        <p className="mt-2 text-sm text-zinc-500">
          Clique em &quot;Novo Produto&quot; para adicionar o primeiro produto.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Filtros */}
      <div className="sticky top-16 z-40 mb-4 space-y-3 bg-black pb-4 pt-4 -mt-4 lg:top-0">
        <div className="grid gap-3 md:grid-cols-2">
          {/* Barra de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              type="search"
              placeholder="Buscar por nome ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="border-zinc-800 bg-zinc-900 pl-10 text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Filtro de Categoria */}
          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="border-zinc-800 bg-zinc-900 text-white">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900">
              <SelectItem value="todas">Todas as Categorias</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(busca || categoriaFiltro !== 'todas') && (
          <p className="text-sm text-zinc-400">
            {produtosFiltrados.length} produto(s) encontrado(s)
          </p>
        )}
      </div>

      {produtosFiltrados.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center md:p-12">
          <p className="text-zinc-400">Nenhum produto encontrado.</p>
          <Button
            variant="outline"
            onClick={() => {
              setBusca('')
              setCategoriaFiltro('todas')
            }}
            className="mt-4"
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <>
          {/* VIEW MOBILE: Cards */}
          <div className="flex flex-col gap-4 md:hidden" suppressHydrationWarning>
            {produtosFiltrados.map((produto) => {
              const currentSavedPrice = savedPrices[produto.id] ?? produto.preco
              const isSaving = savingPriceId === produto.id

              return (
                <div
                  key={produto.id}
                  className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
                  suppressHydrationWarning
                >
                  {/* Header do Card */}
                  <div className="flex items-start gap-3 border-b border-zinc-800 bg-zinc-900/50 p-3" suppressHydrationWarning>
                    {/* Foto */}
                    <div
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-950 ring-1 ring-zinc-800"
                      suppressHydrationWarning
                    >
                      {produto.foto_principal ? (
                        <Image
                          src={produto.foto_principal}
                          alt={produto.nome}
                          fill
                          sizes="80px"
                          className="object-cover"
                          suppressHydrationWarning
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                          Sem foto
                        </div>
                      )}
                    </div>

                    {/* Info Principal */}
                    <div className="min-w-0 flex-1" suppressHydrationWarning>
                      <Link href={`/produto/${produto.slug}`} target="_blank" rel="noopener noreferrer">
                        <h3 className="line-clamp-2 text-base font-semibold leading-tight text-white hover:text-[var(--brand-yellow)] transition-colors cursor-pointer">
                          {produto.nome}
                        </h3>
                      </Link>
                      {produto.codigo_produto && (
                        <p className="mt-1 text-xs text-zinc-500">
                          Cód: {produto.codigo_produto}
                        </p>
                      )}
                      {produto.descricao && (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                          {produto.descricao}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {/* Só mostrar badge seminovo se NÃO tiver bateria */}
                        {!produto.nivel_bateria && (
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${
                              produto.condicao === 'novo'
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-amber-600 text-white border-amber-600'
                            }`}
                          >
                            {produto.condicao === 'novo' ? 'Novo' : 'Seminovo'}
                          </span>
                        )}
                        {/* Badge de bateria */}
                        {produto.nivel_bateria && (
                          <Badge className="flex items-center gap-1.5 bg-zinc-700 px-2 py-0.5 text-xs text-white hover:bg-zinc-600">
                            <BatteryIcon level={produto.nivel_bateria} />
                            <span>{produto.nivel_bateria}%</span>
                          </Badge>
                        )}
                        {/* Badge de cores */}
                        {(() => {
                          // Obter cores (novo array ou legado cor_oficial)
                          const cores: string[] = produto.cores && produto.cores.length > 0
                            ? produto.cores
                            : produto.cor_oficial
                              ? [produto.cor_oficial]
                              : []

                          return cores.map((corNome, idx) => {
                            const cor = getCorOficial(produto.nome, corNome)
                            if (cor) {
                              return (
                                <Badge
                                  key={idx}
                                  className="px-2 py-0.5 text-xs"
                                  style={{
                                    backgroundColor: cor.hex,
                                    color: getContrastColor(cor.hex),
                                    border: 'none',
                                  }}
                                >
                                  {cor.nome}
                                </Badge>
                              )
                            }
                            // Fallback: mostrar badge padrão se cor não for mapeada
                            return (
                              <Badge
                                key={idx}
                                className="bg-blue-600 px-2 py-0.5 text-xs text-white"
                              >
                                {corNome}
                              </Badge>
                            )
                          })
                        })()}
                        {produto.categoria && (
                          <span className="inline-flex rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                            {produto.categoria.nome}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Menu de Ações */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 shrink-0 text-zinc-400 hover:text-white"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault()
                            onEditProduto(produto.id)
                          }}
                          className="flex items-center"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(event) => {
                            event.preventDefault()
                            handleOpenExportImages(produto)
                          }}
                          className="flex items-center"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Exportar Imagens
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleAtivo(produto.id, produto.ativo)}>
                          {produto.ativo ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setProdutoToDelete(produto.id)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-red-400 focus:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Seção de Preço */}
                  <div className="p-4" suppressHydrationWarning>
                    <PriceEditor
                      savedPrice={currentSavedPrice}
                      isSaving={isSaving}
                      onSave={(value) => handleSavePrice(produto, value)}
                    >
                      {({ inputProps, submit, isSaving: saving, isActionDisabled }) => (
                        <div className="space-y-3">
                          {/* Campo de Preço */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Preço
                              </label>
                              <Input
                                {...inputProps}
                                className="h-10 flex-1 border-zinc-700 bg-zinc-950 text-base text-white"
                                placeholder="0,00"
                              />
                            </div>
                          </div>

                          {/* Botão Salvar */}
                          <Button
                            size="sm"
                            className="w-full justify-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/15 text-yellow-200 transition hover:border-yellow-500/40 hover:bg-yellow-500/20"
                            onClick={submit}
                            disabled={isActionDisabled}
                          >
                            {saving ? (
                              'Salvando...'
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                Salvar Preço
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </PriceEditor>
                  </div>
                </div>
              )
            })}
          </div>

      {/* VIEW DESKTOP: Tabela */}
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900 md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400">Foto</TableHead>
              <TableHead className="text-zinc-400">Nome</TableHead>
              <TableHead className="text-zinc-400">Categoria</TableHead>
              <TableHead className="text-zinc-400">Preço</TableHead>
              <TableHead className="text-zinc-400">Condição</TableHead>
              <TableHead className="text-right text-zinc-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtosFiltrados.map((produto) => {
              const currentSavedPrice = savedPrices[produto.id] ?? produto.preco
              const isSaving = savingPriceId === produto.id

              return (
                <TableRow key={produto.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell>
                    <div className="relative h-12 w-12 overflow-hidden rounded-md bg-zinc-950">
                      {produto.foto_principal ? (
                        <Image
                          src={produto.foto_principal}
                          alt={produto.nome}
                          fill
                          sizes="48px"
                          className="object-cover"
                          suppressHydrationWarning
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                          Sem foto
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[250px] font-medium text-white">
                    <div>
                      <Link href={`/produto/${produto.slug}`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand-yellow)] transition-colors">
                        {produto.nome}
                      </Link>
                      {produto.codigo_produto && (
                        <span className="ml-2 text-xs text-zinc-500">
                          ({produto.codigo_produto})
                        </span>
                      )}
                      {produto.descricao && (
                        <p className="mt-1 line-clamp-1 text-xs text-zinc-400">
                          {produto.descricao}
                        </p>
                      )}
                      {/* Badges de cor e bateria */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {produto.nivel_bateria && (
                          <Badge className="flex items-center gap-1.5 bg-zinc-700 px-1.5 py-0.5 text-xs text-white hover:bg-zinc-600">
                            <BatteryIcon level={produto.nivel_bateria} />
                            <span>{produto.nivel_bateria}%</span>
                          </Badge>
                        )}
                        {(() => {
                          // Obter cores (novo array ou legado cor_oficial)
                          const cores: string[] = produto.cores && produto.cores.length > 0
                            ? produto.cores
                            : produto.cor_oficial
                              ? [produto.cor_oficial]
                              : []

                          return cores.map((corNome, idx) => {
                            const cor = getCorOficial(produto.nome, corNome)
                            if (cor) {
                              return (
                                <Badge
                                  key={idx}
                                  className="px-1.5 py-0.5 text-xs"
                                  style={{
                                    backgroundColor: cor.hex,
                                    color: getContrastColor(cor.hex),
                                    border: 'none',
                                  }}
                                >
                                  {cor.nome}
                                </Badge>
                              )
                            }
                            // Fallback: mostrar badge padrão se cor não for mapeada
                            return (
                              <Badge
                                key={idx}
                                className="bg-blue-600 px-1.5 py-0.5 text-xs text-white"
                              >
                                {corNome}
                              </Badge>
                            )
                          })
                        })()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {produto.categoria?.nome || '-'}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    <PriceEditor
                      savedPrice={currentSavedPrice}
                      isSaving={isSaving}
                      onSave={(value) => handleSavePrice(produto, value)}
                      inputClassName="w-24"
                      containerClassName="justify-start"
                      buttonClassName="inline-flex"
                    />
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {/* Só mostrar badge seminovo se NÃO tiver bateria */}
                    {!produto.nivel_bateria && (
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold border ${
                          produto.condicao === 'novo'
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-amber-600 text-white border-amber-600'
                        }`}
                      >
                        {produto.condicao === 'novo' ? 'Novo' : 'Seminovo'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenExportImages(produto)}
                        className="h-8 w-8 text-zinc-400 hover:text-[var(--brand-yellow)]"
                        title="Exportar Imagens"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditProduto(produto.id)}
                        className="h-8 w-8 text-zinc-400 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setProdutoToDelete(produto.id)
                          setDeleteDialogOpen(true)
                        }}
                        className="h-8 w-8 text-zinc-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
        </>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir produto"
        description="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />

      <ExportImagesDialog
        open={exportImagesOpen}
        onClose={handleCloseExportImages}
        produto={produtoToExport}
      />
    </>
  )
}

const ProdutosTable = memo(ProdutosTableComponent)

export { ProdutosTable }
