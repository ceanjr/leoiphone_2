'use client'

import { logger } from '@/lib/utils/logger'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import dynamic from 'next/dynamic'
import {
  createProduto,
  getCategorias,
  getProdutoById,
  updateProduto,
} from '@/app/admin/produtos/actions'
import {
  getProdutoCustos,
  substituirProdutoCustos,
} from '@/app/admin/produtos/custos-actions'

const ImageUpload = dynamic(
  () => import('@/components/admin/image-upload').then((mod) => mod.ImageUpload),
  {
    ssr: false,
  }
)
import type { ProdutoFormData, ProdutoCustoFormData } from '@/lib/validations/produto'
import { Plus, Save, Pencil, X } from 'lucide-react'
import { useIPhoneColors } from '@/hooks/use-iphone-colors'
import { ColorBadge } from '@/components/shared/color-badge'
import { useDebounce } from '@/hooks/use-debounce'
import { CustosManager } from './custos-manager'

interface ProductFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  productId?: string | null
  onClose: () => void
  onCompleted?: () => void
}

interface Categoria {
  id: string
  nome: string
}

const getEmptyForm = (): Partial<ProdutoFormData> => ({
  condicao: 'seminovo',
  garantia: 'nenhuma',
  cores: [],
  acessorios: {
    caixa: false,
    carregador: false,
    cabo: false,
    capinha: false,
    pelicula: false,
  },
  fotos: [],
  ativo: true,
  estoque: 1,
})

export function ProductFormDialog({
  open,
  mode,
  productId,
  onClose,
  onCompleted,
}: ProductFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPrefetching, setIsPrefetching] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [formData, setFormData] = useState<Partial<ProdutoFormData>>(getEmptyForm)
  const [isInitialised, setIsInitialised] = useState(false)
  const [customColorInput, setCustomColorInput] = useState('')
  const [custos, setCustos] = useState<{ custo: number; estoque: number; codigo: string | null }[]>([])

  const isSaving = isLoading

  // Debounce do nome do produto para evitar processamento excessivo
  const debouncedNome = useDebounce(formData.nome || '', 500)

  // Hook para detectar iPhone e obter cores disponíveis (só executa após debounce)
  const { isIPhone, detectedModel, availableColors } = useIPhoneColors(debouncedNome)

  useEffect(() => {
    if (!open) {
      setIsInitialised(false)
      setFormData(getEmptyForm())
      setCustos([])
      setIsLoading(false)
      setIsPrefetching(false)
      return
    }

    async function prepareForm() {
      setIsPrefetching(true)

      try {
        const [{ categorias: cats }, produtoResult] = await Promise.all([
          getCategorias(),
          mode === 'edit' && productId ? getProdutoById(productId) : Promise.resolve(null),
        ])

        if (cats) {
          setCategorias(cats)
        } else {
          setCategorias([])
        }

        if (mode === 'edit') {
          if (!productId) {
            toast.error('Produto não informado para edição')
            onClose()
            return
          }

          const produto = produtoResult?.produto as any

          if (!produto) {
            toast.error(produtoResult?.error || 'Produto não encontrado')
            onClose()
            return
          }

          // Migrar cor_oficial (legado) para cores (novo array) se necessário
          let coresMigradas = produto.cores ?? []
          if ((!coresMigradas || coresMigradas.length === 0) && produto.cor_oficial) {
            // Produto antigo com cor_oficial, migrar para array cores
            coresMigradas = [produto.cor_oficial]
            logger.info(`Migrando cor_oficial "${produto.cor_oficial}" para array cores`)
          }

          setFormData({
            codigo_produto: produto.codigo_produto ?? undefined,
            nome: produto.nome,
            descricao: produto.descricao ?? undefined,
            preco: produto.preco,
            nivel_bateria: produto.nivel_bateria ?? undefined,
            condicao: produto.condicao,
            categoria_id: produto.categoria_id,
            garantia: produto.garantia,
            cores: coresMigradas,
            acessorios: produto.acessorios ?? getEmptyForm().acessorios,
            fotos: produto.fotos ?? [],
            foto_principal: produto.foto_principal ?? undefined,
            ativo: produto.ativo ?? true,
            estoque: produto.estoque ?? 1,
          })

          // Buscar custos do produto
          const { data: custosData } = await getProdutoCustos(productId)
          if (custosData && custosData.length > 0) {
            setCustos(
              custosData.map((c) => ({
                custo: c.custo,
                estoque: c.estoque,
                codigo: c.codigo,
              }))
            )
          } else {
            setCustos([])
          }
        } else {
          setFormData(getEmptyForm())
          setCustos([])
        }

        setIsInitialised(true)
      } catch (error) {
        logger.error(error)
        toast.error('Não foi possível carregar os dados do produto')
        onClose()
      } finally {
        setIsPrefetching(false)
      }
    }

    prepareForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, productId])

  const categoriasDisponiveis = useMemo(() => categorias ?? [], [categorias])
  const modeBadgeText = mode === 'create' ? 'Novo cadastro' : 'Edição ativa'

  // Memoizar cores selecionadas para evitar recálculos
  const selectedColors = useMemo(() => formData.cores || [], [formData.cores])

  // Memoizar cores disponíveis filtradas (remove já selecionadas)
  const availableColorsFiltered = useMemo(() => {
    if (!availableColors.length) return []
    return availableColors.filter((color) => !selectedColors.includes(color))
  }, [availableColors, selectedColors])

  function handleClose() {
    if (isSaving) return
    onClose()
  }

  // Funções para manipular cores (memoizadas com useCallback)
  const handleAddColor = useCallback((color: string) => {
    if (!color.trim()) return

    setFormData((prev) => {
      const currentColors = prev.cores || []
      if (currentColors.includes(color.trim())) return prev

      return {
        ...prev,
        cores: [...currentColors, color.trim()],
      }
    })
    setCustomColorInput('')
  }, [])

  const handleRemoveColor = useCallback((colorToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      cores: (prev.cores || []).filter((c) => c !== colorToRemove),
    }))
  }, [])

  const handleAddCustomColor = useCallback(() => {
    if (customColorInput.trim()) {
      handleAddColor(customColorInput)
    }
  }, [customColorInput, handleAddColor])

  const handleCustomColorKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddCustomColor()
      }
    },
    [handleAddCustomColor]
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSaving) return

    setIsLoading(true)
    try {
      if (
        !formData.nome ||
        !formData.preco ||
        !formData.categoria_id ||
        !formData.fotos?.length
      ) {
        toast.error('Preencha os campos obrigatórios.')
        setIsLoading(false)
        return
      }

      const payload: ProdutoFormData = {
        codigo_produto: formData.codigo_produto?.trim() || null,
        nome: formData.nome,
        descricao: formData.descricao?.trim() || null,
        preco: formData.preco,
        nivel_bateria: formData.nivel_bateria || null,
        condicao: formData.condicao || 'seminovo',
        categoria_id: formData.categoria_id,
        garantia: formData.garantia || 'nenhuma',
        cores: formData.cores && formData.cores.length > 0 ? formData.cores : null,
        acessorios: formData.acessorios || {
          caixa: false,
          carregador: false,
          cabo: false,
          capinha: false,
          pelicula: false,
        },
        fotos: formData.fotos || [],
        foto_principal: formData.fotos?.[0] || null,
        ativo: formData.ativo ?? true,
        estoque: formData.estoque ?? 1,
      }

      // Debug: ver o que está sendo enviado
      if (process.env.NODE_ENV === 'development') {
        logger.info('[ProductForm] Salvando produto:', {
          nome: payload.nome,
          descricao: payload.descricao,
          cores: payload.cores,
          mode,
        })
      }

      const result =
        mode === 'create'
          ? await createProduto(payload as any)
          : await updateProduto(productId as string, payload as any)

      if (!result?.success) {
        toast.error(result?.error || 'Não foi possível salvar o produto')
        setIsLoading(false)
        return
      }

      // Salvar custos do produto
      const produtoIdFinal = mode === 'create' ? result.produto?.id : productId
      if (produtoIdFinal) {
        // Filtrar custos válidos (custo >= 0 e estoque > 0)
        const custosValidos = custos.filter(
          (c) => c.custo >= 0 && c.estoque > 0
        )

        if (process.env.NODE_ENV === 'development') {
          logger.info('[ProductForm] Salvando custos:', {
            produtoId: produtoIdFinal,
            totalCustos: custos.length,
            custosValidos: custosValidos.length,
            custos: custosValidos,
          })
        }

        // Sempre chamar substituirProdutoCustos, mesmo com array vazio
        // Isso garante que custos removidos sejam deletados
        const { error: custosError, data: custosSalvos } = await substituirProdutoCustos(
          produtoIdFinal,
          custosValidos
        )

        if (custosError) {
          logger.error('❌ Erro ao salvar custos:', custosError)
          toast.error(`Produto salvo, mas erro ao salvar custos: ${custosError}`)
          setIsLoading(false)
          return
        }

        if (process.env.NODE_ENV === 'development') {
          logger.info('✅ Custos salvos com sucesso:', custosSalvos)
        }
      }

      toast.success(mode === 'create' ? 'Produto cadastrado!' : 'Produto atualizado!')
      setIsLoading(false)
      onCompleted?.()
      onClose()
    } catch (error) {
      logger.error(error)
      toast.error('Erro inesperado ao salvar o produto')
      setIsLoading(false)
    }
  }

  const accentStyles =
    mode === 'create'
      ? {
          circle: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
          badge: 'border-yellow-500/30 bg-yellow-500/15 text-yellow-200/90',
          glow: 'shadow-[0_0_35px_-10px_rgba(250,204,21,0.35)]',
        }
      : {
          circle: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
          badge: 'border-blue-500/30 bg-blue-500/15 text-blue-200/90',
          glow: 'shadow-[0_0_35px_-10px_rgba(59,130,246,0.35)]',
        }

  const headerTitle = mode === 'create' ? 'Cadastrar Produto' : 'Editar Produto'
  const headerDescription =
    mode === 'create'
      ? 'Complete os campos abaixo para adicionar um novo item ao catálogo.'
      : 'Revise e atualize as informações do produto selecionado.'

  const HeaderIcon = mode === 'create' ? Plus : Pencil

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose()
        }
      }}
    >
      {open ? (
        <DialogContent className="flex flex-col overflow-hidden border border-zinc-800/80 bg-zinc-950/95 p-0 text-white shadow-[0_28px_120px_-40px_rgba(0,0,0,0.85)] backdrop-blur-sm sm:max-w-[1400px] sm:h-[95vh] sm:w-[95vw]">
          <div className="relative flex-shrink-0 border-b border-zinc-800/70 bg-zinc-950/80 px-5 py-5 sm:px-6 sm:py-6 md:px-8">
            <div
              className={`pointer-events-none absolute inset-0 opacity-70 blur-3xl ${accentStyles.glow}`}
              aria-hidden
            />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full border ${accentStyles.circle}`}
                >
                  <HeaderIcon className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-semibold text-white">
                    {headerTitle}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-zinc-400">
                    {headerDescription}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </div>

          {isPrefetching || !isInitialised ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-16">
              <div className="text-center">
                <div className="relative mx-auto h-12 w-12">
                  <div className="absolute inset-0 rounded-full border border-zinc-800" />
                  <div className="absolute inset-[4px] animate-spin rounded-full border-b-2 border-l-2 border-yellow-500/80" />
                </div>
                <p className="mt-4 text-sm text-zinc-400">
                  {mode === 'create'
                    ? 'Carregando formulário...'
                    : 'Carregando dados do produto...'}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-track]:bg-zinc-900">
                <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
                  <div className="space-y-6">
                    <section className="rounded-xl border border-zinc-800/70 bg-zinc-950/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-6">
                      <header className="mb-6 flex flex-col gap-1">
                        <span className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
                          Imagens
                        </span>
                        <h3 className="text-lg font-semibold text-white">Fotos do produto *</h3>
                        <p className="text-sm text-zinc-400">
                          A primeira imagem enviada será usada como foto principal.
                        </p>
                      </header>

                      <ImageUpload
                        images={formData.fotos ?? []}
                        onChange={(images) =>
                          setFormData((prev) => ({
                            ...prev,
                            fotos: images,
                            foto_principal: images[0] || undefined,
                          }))
                        }
                        maxImages={5}
                        disabled={isSaving}
                      />
                    </section>

                    <section className="rounded-xl border border-zinc-800/70 bg-zinc-950/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-6">
                      <header className="mb-6 flex flex-col gap-1">
                        <span className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
                          Informações básicas
                        </span>
                        <h3 className="text-lg font-semibold text-white">Detalhes do produto</h3>
                        <p className="text-sm text-zinc-400">
                          Esses dados são exibidos na vitrine e nos canais de venda.
                        </p>
                      </header>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="codigo_produto" className="text-zinc-200">
                            Código do Produto
                          </Label>
                          <Input
                            id="codigo_produto"
                            value={formData.codigo_produto ?? ''}
                            onChange={(event) =>
                              setFormData((prev) => ({
                                ...prev,
                                codigo_produto: event.target.value,
                              }))
                            }
                            disabled={isSaving}
                            className="border-zinc-800/70 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nome" className="text-zinc-200">
                            Nome do Produto *
                          </Label>
                          <Input
                            id="nome"
                            required
                            value={formData.nome ?? ''}
                            onChange={(event) =>
                              setFormData((prev) => ({ ...prev, nome: event.target.value }))
                            }
                            disabled={isSaving}
                            className="border-zinc-800/70 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preco" className="text-zinc-200">
                            Preço (R$) *
                          </Label>
                          <Input
                            id="preco"
                            type="number"
                            required
                            step="0.01"
                            min="0"
                            value={formData.preco ?? ''}
                            onChange={(event) =>
                              setFormData((prev) => ({
                                ...prev,
                                preco: event.target.value
                                  ? parseFloat(event.target.value)
                                  : undefined,
                              }))
                            }
                            disabled={isSaving}
                            className="border-zinc-800/70 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nivel_bateria" className="text-zinc-200">
                            Nível de Bateria (%)
                          </Label>
                          <Input
                            id="nivel_bateria"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.nivel_bateria ?? ''}
                            onChange={(event) =>
                              setFormData((prev) => ({
                                ...prev,
                                nivel_bateria: event.target.value
                                  ? Math.min(100, Math.max(0, parseInt(event.target.value, 10)))
                                  : undefined,
                              }))
                            }
                            disabled={isSaving}
                            className="border-zinc-800/70 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                          />
                        </div>
                      </div>

                      {/* Campo de Cores */}
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="cores" className="text-zinc-200">
                          Cor{formData.cores && formData.cores.length > 1 ? 'es' : ''}
                          {detectedModel && (
                            <span className="ml-2 text-xs font-normal text-zinc-500">
                              {detectedModel} detectado
                            </span>
                          )}
                        </Label>

                        {/* Cores já selecionadas */}
                        {selectedColors.length > 0 && (
                          <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-800/70 bg-zinc-950 p-3">
                            {selectedColors.map((color) => (
                              <div key={color} className="flex items-center gap-1">
                                <ColorBadge color={color} productName={formData.nome} size="md" />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColor(color)}
                                  disabled={isSaving}
                                  className="rounded-full p-0.5 text-zinc-400 transition hover:bg-red-500/20 hover:text-red-400"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Input baseado no tipo de produto */}
                        {!debouncedNome ? (
                          <p className="text-sm text-zinc-500">
                            Preencha o nome do produto para habilitar este campo
                          </p>
                        ) : isIPhone &&
                          availableColors.length > 0 &&
                          availableColorsFiltered.length === 0 ? (
                          <p className="text-sm text-zinc-400">
                            ✓ Todas as cores oficiais já foram adicionadas
                          </p>
                        ) : isIPhone && availableColorsFiltered.length > 0 ? (
                          // Dropdown para iPhone com cores conhecidas
                          <Select value="" onValueChange={handleAddColor} disabled={isSaving}>
                            <SelectTrigger className="border-zinc-800/70 bg-zinc-950 text-white">
                              <SelectValue placeholder="Selecione uma cor oficial" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableColorsFiltered.map((color) => (
                                <SelectItem key={color} value={color}>
                                  <div className="flex items-center gap-2">
                                    <ColorBadge color={color} productName={formData.nome} size="sm" />
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          // Input texto livre para não-iPhone ou iPhone sem cores conhecidas
                          <div className="flex gap-2">
                            <Input
                              id="cores"
                              value={customColorInput}
                              onChange={(e) => setCustomColorInput(e.target.value)}
                              onKeyDown={handleCustomColorKeyDown}
                              placeholder="Digite a cor e pressione Enter"
                              disabled={isSaving}
                              className="border-zinc-800/70 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                            />
                            <Button
                              type="button"
                              onClick={handleAddCustomColor}
                              disabled={!customColorInput.trim() || isSaving}
                              variant="outline"
                              className="border-zinc-700 bg-zinc-900 text-white hover:border-zinc-600 hover:bg-zinc-800"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label htmlFor="descricao" className="text-zinc-200">
                          Descrição
                        </Label>
                        <Textarea
                          id="descricao"
                          value={formData.descricao ?? ''}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, descricao: event.target.value }))
                          }
                          disabled={isSaving}
                          className="min-h-[120px] border-zinc-800/70 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                          rows={4}
                        />
                      </div>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-zinc-200">Condição *</Label>
                          <Select
                            value={formData.condicao ?? 'seminovo'}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                condicao: value as 'novo' | 'seminovo',
                              }))
                            }
                          >
                            <SelectTrigger className="border-zinc-800/70 bg-zinc-950 text-white">
                              <SelectValue placeholder="Selecione a condição" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="novo">Novo</SelectItem>
                              <SelectItem value="seminovo">Seminovo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-zinc-200">Categoria *</Label>
                          <Select
                            value={formData.categoria_id ?? ''}
                            onValueChange={(value) =>
                              setFormData((prev) => ({ ...prev, categoria_id: value }))
                            }
                          >
                            <SelectTrigger className="border-zinc-800/70 bg-zinc-950 text-white">
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoriasDisponiveis.length === 0 ? (
                                <SelectItem value="" disabled>
                                  Nenhuma categoria disponível
                                </SelectItem>
                              ) : (
                                categoriasDisponiveis.map((categoria) => (
                                  <SelectItem key={categoria.id} value={categoria.id}>
                                    {categoria.nome}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="estoque" className="text-zinc-200">
                            Estoque Total (un.)
                          </Label>
                          <Input
                            id="estoque"
                            type="number"
                            min="0"
                            value={formData.estoque ?? 1}
                            onChange={(event) =>
                              setFormData((prev) => ({
                                ...prev,
                                estoque: event.target.value
                                  ? parseInt(event.target.value, 10)
                                  : 1,
                              }))
                            }
                            disabled={isSaving}
                            className="border-zinc-800/70 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                          />
                          <p className="text-xs text-zinc-500">
                            Estoque geral do produto (independente dos custos)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-zinc-200">Garantia</Label>
                          <Select
                            value={formData.garantia ?? 'nenhuma'}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                garantia: value as 'nenhuma' | '3_meses' | '6_meses' | '1_ano',
                              }))
                            }
                          >
                            <SelectTrigger className="border-zinc-800/70 bg-zinc-950 text-white">
                              <SelectValue placeholder="Selecione a garantia" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nenhuma">Nenhuma</SelectItem>
                              <SelectItem value="3_meses">3 meses</SelectItem>
                              <SelectItem value="6_meses">6 meses</SelectItem>
                              <SelectItem value="1_ano">1 ano</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    {/* Seção de Custos */}
                    <CustosManager
                      custos={custos}
                      onChange={setCustos}
                      disabled={isSaving}
                    />

                    <section className="rounded-xl border border-zinc-800/70 bg-zinc-950/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-6">
                      <header className="mb-6 flex flex-col gap-1">
                        <span className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
                          Inclusos na venda
                        </span>
                        <h3 className="text-lg font-semibold text-white">Acessórios</h3>
                        <p className="text-sm text-zinc-400">
                          Marque os itens que acompanham o produto para destacar o valor da oferta.
                        </p>
                      </header>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-2">
                        {(['caixa', 'carregador', 'cabo', 'capinha', 'pelicula'] as const).map(
                          (item) => (
                            <label
                              key={item}
                              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800/70 bg-zinc-950/80 px-3 py-2.5 transition hover:border-zinc-700"
                            >
                              <Checkbox
                                id={item}
                                checked={!!formData.acessorios?.[item]}
                                onCheckedChange={(checked) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    acessorios: {
                                      ...(prev.acessorios ?? getEmptyForm().acessorios!),
                                      [item]: checked === true,
                                    },
                                  }))
                                }
                              />
                              <span className="text-sm font-medium text-zinc-200 capitalize">
                                {item}
                              </span>
                            </label>
                          )
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 border-t border-zinc-800/70 bg-zinc-950/85 px-5 py-4 shadow-[0_-20px_40px_-40px_rgba(0,0,0,0.8)] backdrop-blur sm:px-6 md:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-[48px] w-full border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800 sm:w-auto"
                    onClick={handleClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="min-h-[48px] w-full bg-[var(--brand-yellow)] text-[var(--brand-black)] hover:bg-[var(--brand-yellow)]/90 sm:w-auto"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Salvando...' : 'Salvar Produto'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
