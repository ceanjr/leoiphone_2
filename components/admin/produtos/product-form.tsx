'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save, Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUpload } from '@/components/admin/image-upload'
import { CustosManager } from './custos-manager'
import { ColorBadge } from '@/components/shared/color-badge'
import { useIPhoneColors } from '@/hooks/use-iphone-colors'
import { useDebounce } from '@/hooks/use-debounce'
import { createProduto, updateProduto } from '@/app/admin/produtos/actions'
import { getProdutoCustos, substituirProdutoCustos } from '@/app/admin/produtos/custos-actions'
import type { ProdutoFormData } from '@/lib/validations/produto'
import type { ProdutoComCategoria } from '@/types/produto'
import { logger } from '@/lib/utils/logger'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

interface Categoria {
  id: string
  nome: string
}

interface ProductFormProps {
  product?: ProdutoComCategoria
  categories: Categoria[]
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

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCustos, setIsLoadingCustos] = useState(isEditing)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [formData, setFormData] = useState<Partial<ProdutoFormData>>(() => {
    if (product) {
      // Migrar cor_oficial (legado) para cores (novo array) se necessário
      let coresMigradas = product.cores ?? []
      if ((!coresMigradas || coresMigradas.length === 0) && product.cor_oficial) {
        coresMigradas = [product.cor_oficial]
      }

      return {
        codigo_produto: product.codigo_produto ?? undefined,
        nome: product.nome,
        descricao: product.descricao ?? undefined,
        preco: product.preco,
        nivel_bateria: product.nivel_bateria ?? undefined,
        condicao: product.condicao,
        categoria_id: product.categoria_id,
        garantia: product.garantia,
        cores: coresMigradas,
        acessorios: product.acessorios ?? getEmptyForm().acessorios,
        fotos: product.fotos ?? [],
        foto_principal: product.foto_principal ?? undefined,
        ativo: product.ativo ?? true,
        estoque: product.estoque ?? 1,
      }
    }
    return getEmptyForm()
  })
  const [custos, setCustos] = useState<{ custo: number; estoque: number; codigo: string | null }[]>(
    []
  )
  const [customColorInput, setCustomColorInput] = useState('')

  // Track uploaded images for cleanup on cancel
  const uploadedImagesRef = useRef<string[]>([])
  const initialImagesRef = useRef<string[]>(product?.fotos ?? [])
  // Rastrear imagens removidas durante edição (para deletar ao salvar)
  const removedImagesRef = useRef<string[]>([])

  // Debounce do nome do produto para evitar processamento excessivo
  const debouncedNome = useDebounce(formData.nome || '', 500)

  // Hook para detectar iPhone e obter cores disponíveis
  const { isIPhone, detectedModel, availableColors } = useIPhoneColors(debouncedNome)

  // Carregar custos do produto ao editar
  useEffect(() => {
    if (isEditing && product?.id) {
      setIsLoadingCustos(true)
      getProdutoCustos(product.id)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setCustos(
              data.map((c) => ({
                custo: c.custo,
                estoque: c.estoque,
                codigo: c.codigo,
              }))
            )
          }
        })
        .finally(() => setIsLoadingCustos(false))
    }
  }, [isEditing, product?.id])

  // Track newly uploaded images
  useEffect(() => {
    const currentImages = formData.fotos || []
    const newImages = currentImages.filter((img) => !initialImagesRef.current.includes(img))
    uploadedImagesRef.current = newImages
  }, [formData.fotos])

  // Memoizar cores selecionadas
  const selectedColors = useMemo(() => formData.cores || [], [formData.cores])

  // Memoizar cores disponíveis filtradas
  const availableColorsFiltered = useMemo(() => {
    if (!availableColors.length) return []
    return availableColors.filter((color) => !selectedColors.includes(color))
  }, [availableColors, selectedColors])

  // Handlers para cores
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

  // Cleanup uploaded images on cancel
  const handleCancel = async () => {
    setShowCancelDialog(true)
  }

  const confirmCancel = () => {
    setShowCancelDialog(false)
    router.push('/admin/produtos')
  }

  // Função para extrair publicId de uma URL do Cloudinary
  const extractCloudinaryPublicId = (url: string): string | null => {
    try {
      // URL típica: https://res.cloudinary.com/xxx/image/upload/v123/leoiphone/produtos/id/timestamp-random.jpg
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?(?:\?|$)/i)
      if (match && match[1]) {
        return match[1]
      }
      return null
    } catch {
      return null
    }
  }

  // Função para deletar imagem do Cloudinary
  const deleteFromCloudinary = async (imageUrl: string): Promise<boolean> => {
    const publicId = extractCloudinaryPublicId(imageUrl)
    if (!publicId) {
      logger.warn('Não foi possível extrair publicId da URL:', imageUrl)
      return false
    }

    try {
      const response = await fetch(
        `/api/upload-cloudinary?publicId=${encodeURIComponent(publicId)}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const error = await response.json()
        logger.error('Erro ao deletar do Cloudinary:', error)
        return false
      }

      logger.info('Imagem deletada do Cloudinary:', publicId)
      return true
    } catch (error) {
      logger.error('Erro ao deletar do Cloudinary:', error)
      return false
    }
  }

  // Handler para remoção de imagem
  const handleImageRemove = async (imageUrl: string) => {
    if (isEditing) {
      // Modo edição: apenas rastrear para deletar ao salvar
      // Só rastrear se era uma imagem original (não uma nova que ainda não foi salva)
      if (initialImagesRef.current.includes(imageUrl)) {
        removedImagesRef.current.push(imageUrl)
        logger.info('Imagem marcada para remoção ao salvar:', imageUrl)
      } else {
        // Imagem nova (ainda não salva no produto): deletar imediatamente
        await deleteFromCloudinary(imageUrl)
      }
    } else {
      // Modo criação: deletar imediatamente do Cloudinary
      await deleteFromCloudinary(imageUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    try {
      // Validação básica
      if (!formData.nome || !formData.preco || !formData.categoria_id || !formData.fotos?.length) {
        toast.error('Preencha os campos obrigatórios (nome, preço, categoria e pelo menos 1 foto)')
        setIsLoading(false)
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
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

      const result = isEditing
        ? await updateProduto(product!.id, payload)
        : await createProduto(payload)

      if (!result?.success) {
        toast.error(result?.error || 'Não foi possível salvar o produto')
        setIsLoading(false)
        return
      }

      // Salvar custos do produto
      const produtoIdFinal = isEditing ? product!.id : result.produto?.id
      if (produtoIdFinal) {
        const custosValidos = custos.filter((c) => c.custo >= 0 && c.estoque > 0)

        const { error: custosError } = await substituirProdutoCustos(produtoIdFinal, custosValidos)

        if (custosError) {
          logger.error('Erro ao salvar custos:', custosError)
          toast.error(`Produto salvo, mas erro ao salvar custos: ${custosError}`)
          // Não retornar aqui - produto foi salvo, apenas custos falharam
        }
      }

      toast.success(isEditing ? 'Produto atualizado!' : 'Produto cadastrado!')

      // Se editando, deletar imagens removidas do Cloudinary após salvar com sucesso
      if (isEditing && removedImagesRef.current.length > 0) {
        logger.info('Deletando imagens removidas do Cloudinary:', removedImagesRef.current.length)
        // Deletar em background, não bloquear a navegação
        Promise.all(removedImagesRef.current.map((url) => deleteFromCloudinary(url)))
          .then((results) => {
            const deletedCount = results.filter(Boolean).length
            logger.info(
              `Imagens deletadas do Cloudinary: ${deletedCount}/${removedImagesRef.current.length}`
            )
          })
          .catch((error) => {
            logger.error('Erro ao deletar imagens do Cloudinary:', error)
          })
        removedImagesRef.current = []
      }

      // Redirecionar para a lista de produtos
      router.push('/admin/produtos')
    } catch (error) {
      logger.error('Erro ao salvar produto:', error)
      toast.error('Erro inesperado ao salvar o produto')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Seção de Imagens */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Fotos do Produto *</h3>
          <p className="text-sm text-zinc-400">A primeira imagem será usada como foto principal.</p>
        </div>

        <ImageUpload
          images={formData.fotos ?? []}
          onChange={(images) =>
            setFormData((prev) => ({
              ...prev,
              fotos: images,
              foto_principal: images[0] || undefined,
            }))
          }
          onImageRemove={handleImageRemove}
          maxImages={5}
          disabled={isLoading}
        />
      </section>

      {/* Seção de Informações Básicas */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Informações Básicas</h3>
          <p className="text-sm text-zinc-400">Dados exibidos no catálogo e página do produto.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="codigo_produto" className="text-zinc-200">
              Código do Produto
            </Label>
            <Input
              id="codigo_produto"
              value={formData.codigo_produto ?? ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, codigo_produto: e.target.value }))}
              disabled={isLoading}
              className="border-zinc-800 bg-zinc-950 text-white"
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
              onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
              disabled={isLoading}
              className="border-zinc-800 bg-zinc-950 text-white"
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
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  preco: e.target.value ? parseFloat(e.target.value) : undefined,
                }))
              }
              disabled={isLoading}
              className="border-zinc-800 bg-zinc-950 text-white"
            />
          </div>

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
              <SelectTrigger className="border-zinc-800 bg-zinc-950 text-white">
                <SelectValue placeholder="Selecione a condição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="seminovo">Seminovo</SelectItem>
              </SelectContent>
            </Select>
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
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  nivel_bateria: e.target.value
                    ? Math.min(100, Math.max(0, parseInt(e.target.value, 10)))
                    : undefined,
                }))
              }
              disabled={isLoading}
              className="border-zinc-800 bg-zinc-950 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-200">Categoria *</Label>
            <Select
              value={formData.categoria_id ?? ''}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, categoria_id: value }))}
            >
              <SelectTrigger className="border-zinc-800 bg-zinc-950 text-white">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <SelectItem value="" disabled>
                    Nenhuma categoria disponível
                  </SelectItem>
                ) : (
                  categories.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
              <SelectTrigger className="border-zinc-800 bg-zinc-950 text-white">
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

        {/* Campo de Cores */}
        <div className="space-y-2">
          <Label className="text-zinc-200">
            Cor{formData.cores && formData.cores.length > 1 ? 'es' : ''}
            {detectedModel && (
              <span className="ml-2 text-xs font-normal text-zinc-500">
                {detectedModel} detectado
              </span>
            )}
          </Label>

          {/* Cores já selecionadas */}
          {selectedColors.length > 0 && (
            <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              {selectedColors.map((color) => (
                <div key={color} className="flex items-center gap-1">
                  <ColorBadge color={color} productName={formData.nome} size="md" />
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(color)}
                    disabled={isLoading}
                    className="rounded-full p-0.5 text-zinc-400 transition hover:bg-red-500/20 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input de cores */}
          {!debouncedNome ? (
            <p className="text-sm text-zinc-500">
              Preencha o nome do produto para habilitar este campo
            </p>
          ) : isIPhone && availableColors.length > 0 && availableColorsFiltered.length === 0 ? (
            <p className="text-sm text-zinc-400">✓ Todas as cores oficiais já foram adicionadas</p>
          ) : isIPhone && availableColorsFiltered.length > 0 ? (
            <Select value="" onValueChange={handleAddColor} disabled={isLoading}>
              <SelectTrigger className="border-zinc-800 bg-zinc-950 text-white">
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
            <div className="flex gap-2">
              <Input
                value={customColorInput}
                onChange={(e) => setCustomColorInput(e.target.value)}
                onKeyDown={handleCustomColorKeyDown}
                placeholder="Digite a cor e pressione Enter"
                disabled={isLoading}
                className="border-zinc-800 bg-zinc-950 text-white"
              />
              <Button
                type="button"
                onClick={handleAddCustomColor}
                disabled={!customColorInput.trim() || isLoading}
                variant="outline"
                className="border-zinc-700 bg-zinc-900 text-white hover:border-zinc-600 hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="descricao" className="text-zinc-200">
            Descrição
          </Label>
          <Textarea
            id="descricao"
            value={formData.descricao ?? ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
            disabled={isLoading}
            className="min-h-[100px] border-zinc-800 bg-zinc-950 text-white"
            rows={4}
          />
        </div>

        {/* Checkbox Ativo */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="ativo"
            checked={formData.ativo ?? true}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, ativo: checked === true }))
            }
            disabled={isLoading}
          />
          <Label htmlFor="ativo" className="text-zinc-200">
            Produto ativo (visível no catálogo)
          </Label>
        </div>
      </section>

      {/* Seção de Acessórios */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Acessórios Inclusos</h3>
          <p className="text-sm text-zinc-400">Marque os itens que acompanham o produto.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {(['caixa', 'carregador', 'cabo', 'capinha', 'pelicula'] as const).map((item) => (
            <label
              key={item}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 transition hover:border-zinc-700"
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
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-zinc-200 capitalize">
                {item === 'pelicula' ? 'Película' : item}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Seção de Custos */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Custos de Aquisição</h3>
          <p className="text-sm text-zinc-400">
            Registre os custos de compra para controle de margem.
          </p>
        </div>

        {isLoadingCustos ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando custos...
          </div>
        ) : (
          <CustosManager custos={custos} onChange={setCustos} disabled={isLoading} />
        )}
      </section>

      {/* Botões de Ação */}
      <div className="flex flex-col gap-3 border-t border-zinc-800 pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          className="min-h-[44px] border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="min-h-[44px] bg-[var(--brand-yellow)] text-[var(--brand-black)] hover:bg-[var(--brand-yellow)]/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Atualizar' : 'Cadastrar'} Produto
            </>
          )}
        </Button>
      </div>

      {/* Dialog de confirmação de cancelamento */}
      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={confirmCancel}
        title="Cancelar edição?"
        description="Tem certeza que deseja cancelar? Todas as alterações não salvas serão perdidas."
        confirmText="Sim, cancelar"
        cancelText="Continuar editando"
        variant="destructive"
      />
    </form>
  )
}
