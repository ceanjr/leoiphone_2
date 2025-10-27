'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTransition } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import dynamic from 'next/dynamic'
import { createProduto, getCategorias, getProdutoById, updateProduto } from '@/app/admin/produtos/actions'

const ImageUpload = dynamic(() => import('@/components/admin/image-upload').then((mod) => mod.ImageUpload), {
  ssr: false,
})
import type { ProdutoFormData } from '@/lib/validations/produto'
import { Plus, Save, Pencil } from 'lucide-react'

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
  acessorios: {
    caixa: false,
    carregador: false,
    capinha: false,
    pelicula: false,
  },
  fotos: [],
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
  const [isSubmitting, startSubmit] = useTransition()

  const isSaving = isLoading || isSubmitting

  useEffect(() => {
    if (!open) {
      setIsInitialised(false)
      setFormData(getEmptyForm())
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

          setFormData({
            codigo_produto: produto.codigo_produto ?? undefined,
            nome: produto.nome,
            descricao: produto.descricao ?? undefined,
            preco: produto.preco,
            nivel_bateria: produto.nivel_bateria ?? undefined,
            condicao: produto.condicao,
            categoria_id: produto.categoria_id,
            garantia: produto.garantia,
            acessorios: produto.acessorios ?? getEmptyForm().acessorios,
            fotos: produto.fotos ?? [],
            foto_principal: produto.foto_principal ?? undefined,
          })
        } else {
          setFormData(getEmptyForm())
        }

        setIsInitialised(true)
      } catch (error) {
        console.error(error)
        toast.error('Não foi possível carregar os dados do produto')
        onClose()
      } finally {
        setIsPrefetching(false)
      }
    }

    prepareForm()
  }, [open, mode, productId, onClose])

  const categoriasDisponiveis = useMemo(() => categorias ?? [], [categorias])
  const modeBadgeText = mode === 'create' ? 'Novo cadastro' : 'Edição ativa'

  function handleClose() {
    if (isSaving) return
    onClose()
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSaving) return

    startSubmit(async () => {
      setIsLoading(true)
      try {
        if (!formData.nome || !formData.preco || !formData.categoria_id || !formData.fotos?.length) {
          toast.error('Preencha os campos obrigatórios.')
          return
        }

        const payload: ProdutoFormData = {
          codigo_produto: formData.codigo_produto?.trim() || undefined,
          nome: formData.nome,
          descricao: formData.descricao?.trim() || undefined,
          preco: formData.preco,
          nivel_bateria: formData.nivel_bateria || undefined,
          condicao: formData.condicao || 'seminovo',
          categoria_id: formData.categoria_id,
          garantia: formData.garantia || 'nenhuma',
          acessorios: formData.acessorios || {
            caixa: false,
            carregador: false,
            capinha: false,
            pelicula: false,
          },
          fotos: formData.fotos || [],
          foto_principal: formData.fotos?.[0] || formData.foto_principal || null,
          ativo: true,
          estoque: 1,
        }

        const result =
          mode === 'create'
            ? await createProduto(payload)
            : await updateProduto(productId as string, payload)

        if (!result?.success) {
          toast.error(result?.error || 'Não foi possível salvar o produto')
          return
        }

        toast.success(mode === 'create' ? 'Produto cadastrado!' : 'Produto atualizado!')
        onCompleted?.()
        onClose()
      } catch (error) {
        console.error(error)
        toast.error('Erro inesperado ao salvar o produto')
      } finally {
        setIsLoading(false)
      }
    })
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
        <DialogContent className="flex max-h-[92vh] w-full flex-col overflow-hidden border border-zinc-800/80 bg-zinc-950/95 p-0 text-white shadow-[0_28px_120px_-40px_rgba(0,0,0,0.85)] backdrop-blur-sm sm:max-w-5xl">
          <div className="relative border-b border-zinc-800/70 bg-zinc-950/80 px-6 py-6 sm:px-8">
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
                  <DialogTitle className="text-2xl font-semibold text-white">{headerTitle}</DialogTitle>
                  <DialogDescription className="text-sm text-zinc-400">
                    {headerDescription}
                  </DialogDescription>
                </div>
              </div>
              <Badge className={`border ${accentStyles.badge}`}>
                {modeBadgeText}
              </Badge>
            </div>
            <p className="relative z-10 mt-4 text-xs uppercase tracking-[0.22em] text-zinc-500">
              Campos marcados com <span className="text-yellow-300">*</span> são obrigatórios
            </p>
          </div>

          {isPrefetching || !isInitialised ? (
            <div className="flex flex-1 items-center justify-center px-8 py-16">
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
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <div className="grid gap-6 px-6 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1.65fr_1fr]">
                  <div className="space-y-6">
                    <section className="rounded-xl border border-zinc-800/70 bg-zinc-950/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-6">
                      <header className="mb-6 flex flex-col gap-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
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
                              setFormData((prev) => ({ ...prev, codigo_produto: event.target.value }))
                            }
                            className="border-zinc-800/70 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                            placeholder="Ex: IPH15PM256"
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
                            className="border-zinc-800/70 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                            placeholder="Ex: iPhone 15 Pro Max 256GB"
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
                                preco: event.target.value ? parseFloat(event.target.value) : undefined,
                              }))
                            }
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
                            className="border-zinc-800/70 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                          />
                        </div>
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
                          className="min-h-[120px] border-zinc-800/70 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                          rows={4}
                          placeholder="Destaque diferenciais, estado de conservação e garantia."
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

                        <div className="space-y-2 sm:col-span-2">
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
                    <section className="rounded-xl border border-zinc-800/70 bg-zinc-950/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-6">
                      <header className="mb-6 flex flex-col gap-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
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
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                          Inclusos na venda
                        </span>
                        <h3 className="text-lg font-semibold text-white">Acessórios</h3>
                        <p className="text-sm text-zinc-400">
                          Marque os itens que acompanham o produto para destacar o valor da oferta.
                        </p>
                      </header>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-2">
                        {(['caixa', 'carregador', 'capinha', 'pelicula'] as const).map((item) => (
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
                            <span className="text-sm font-medium capitalize text-zinc-200">
                              {item}
                            </span>
                          </label>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-800/70 bg-zinc-950/85 px-6 py-4 shadow-[0_-20px_40px_-40px_rgba(0,0,0,0.8)] backdrop-blur sm:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800 sm:w-auto"
                    onClick={handleClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto bg-[var(--brand-yellow)] text-[var(--brand-black)] hover:bg-[var(--brand-yellow)]/90"
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
