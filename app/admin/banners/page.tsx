'use client'
import { logger } from '@/lib/utils/logger'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, Search, X, Download } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { ImageUpload } from '@/components/admin/image-upload'
import { Badge } from '@/components/ui/badge'
import { ExportCardDialog } from '@/components/admin/export-card-dialog'
import type { ProductCardData } from '@/components/admin/product-card-renderer'
import { createClient } from '@/lib/supabase/client'
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  updateOrdemBanner,
  toggleBannerAtivo,
} from './actions'

interface Banner {
  id: string
  titulo: string
  subtitulo: string | null
  link: string | null
  imagem_url: string
  ativo: boolean
  ordem: number
  tipo: 'banner' | 'produtos_destaque'
  produtos_destaque: Array<{ produto_id: string; preco_promocional: number }>
  countdown_ends_at: string | null
}

interface Produto {
  id: string
  nome: string
  codigo_produto: string
  preco: number
  foto_principal: string
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    subtitulo: '',
    link: '',
    imagem_url: '',
    ativo: true,
    tipo: 'banner' as 'banner' | 'produtos_destaque',
    produtos_destaque: [] as Array<{ produto_id: string; preco_promocional: number }>,
    countdown_ends_at: null as string | null,
  })
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Produto[]>([])
  const [selectedProdutos, setSelectedProdutos] = useState<
    Array<Produto & { preco_promocional: number }>
  >([])
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportProdutos, setExportProdutos] = useState<ProductCardData[]>([])

  const loadBanners = useCallback(async () => {
    setLoading(true)
    const { banners: data } = await getBanners()
    setBanners(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadBanners()
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [loadBanners])

  async function handleOpenDialog(banner?: Banner) {
    if (banner) {
      setEditingBanner(banner)
      setFormData({
        titulo: banner.titulo,
        subtitulo: banner.subtitulo || '',
        link: banner.link || '',
        imagem_url: banner.imagem_url,
        ativo: banner.ativo,
        tipo: banner.tipo || 'banner',
        produtos_destaque: banner.produtos_destaque || [],
        countdown_ends_at: banner.countdown_ends_at || null,
      })

      // Se for produtos_destaque, carregar os produtos selecionados
      if (banner.tipo === 'produtos_destaque' && banner.produtos_destaque.length > 0) {
        const supabase = createClient()
        const produtoIds = banner.produtos_destaque.map((p) => p.produto_id)
        const { data: produtos } = await supabase
          .from('produtos')
          .select('id, nome, codigo_produto, preco, foto_principal')
          .in('id', produtoIds)

        if (produtos) {
          const produtosComPreco = produtos.map((p: any) => {
            // @ts-ignore
            const produtoDestaque = banner.produtos_destaque.find(
              (pd) => pd.produto_id === p.id
            )
            return {
              ...p,
              preco_promocional: produtoDestaque?.preco_promocional || p.preco,
            }
          })
          setSelectedProdutos(produtosComPreco)
        }
      }
    } else {
      setEditingBanner(null)
      setFormData({
        titulo: '',
        subtitulo: '',
        link: '',
        imagem_url: '',
        ativo: true,
        tipo: 'banner',
        produtos_destaque: [],
        countdown_ends_at: null,
      })
      setSelectedProdutos([])
    }
    setSearchTerm('')
    setSearchResults([])
    setDialogOpen(true)
  }

  async function searchProdutos(term: string) {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    const supabase = createClient()
    const { data } = await supabase
      .from('produtos')
      .select('id, nome, codigo_produto, preco, foto_principal')
      .or(`nome.ilike.%${term}%,codigo_produto.ilike.%${term}%`)
      .is('deleted_at', null)
      .limit(10)

    setSearchResults(data || [])
  }

  function handleAddProduto(produto: Produto) {
    if (selectedProdutos.length >= 4) {
      toast.error('Máximo de 4 produtos permitidos')
      return
    }

    if (selectedProdutos.find((p) => p.id === produto.id)) {
      toast.error('Produto já adicionado')
      return
    }

    setSelectedProdutos([...selectedProdutos, { ...produto, preco_promocional: produto.preco }])
    setSearchTerm('')
    setSearchResults([])
  }

  function handleRemoveProduto(produtoId: string) {
    setSelectedProdutos(selectedProdutos.filter((p) => p.id !== produtoId))
  }

  function handleUpdatePrecoPromocional(produtoId: string, preco: number) {
    setSelectedProdutos(
      selectedProdutos.map((p) => (p.id === produtoId ? { ...p, preco_promocional: preco } : p))
    )
  }

  async function handleSave() {
    setSaving(true)

    // Preparar produtos_destaque
    const produtos_destaque = selectedProdutos.map((p) => ({
      produto_id: p.id,
      preco_promocional: p.preco_promocional,
    }))

    const dataToSave = {
      ...formData,
      produtos_destaque,
    }

    if (editingBanner) {
      const result = await updateBanner(editingBanner.id, dataToSave)
      if (result.success) {
        toast.success('Banner atualizado com sucesso!')
        setDialogOpen(false)
        setSelectedProdutos([])
        loadBanners()
      } else {
        toast.error(result.error || 'Erro ao atualizar banner')
      }
    } else {
      const result = await createBanner(dataToSave)
      if (result.success) {
        toast.success('Banner criado com sucesso!')
        setDialogOpen(false)
        setSelectedProdutos([])
        loadBanners()
      } else {
        toast.error(result.error || 'Erro ao criar banner')
      }
    }

    setSaving(false)
  }

  async function handleDelete() {
    if (!bannerToDelete) return

    const result = await deleteBanner(bannerToDelete)
    if (result.success) {
      toast.success('Banner excluído com sucesso!')
      setDeleteDialogOpen(false)
      setBannerToDelete(null)
      loadBanners()
    } else {
      toast.error(result.error || 'Erro ao excluir banner')
    }
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    const result = await toggleBannerAtivo(id, !ativo)
    if (result.success) {
      toast.success(ativo ? 'Banner desativado' : 'Banner ativado')
      loadBanners()
    } else {
      toast.error(result.error || 'Erro ao alterar status')
    }
  }

  async function moveBanner(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === banners.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newBanners = [...banners]
    const temp = newBanners[index]
    newBanners[index] = newBanners[newIndex]
    newBanners[newIndex] = temp

    setBanners(newBanners)

    await updateOrdemBanner(newBanners[index].id, index + 1)
    await updateOrdemBanner(newBanners[newIndex].id, newIndex + 1)

    toast.success('Ordem atualizada')
  }

  async function handleOpenExportDialog(banner: Banner) {
    if (banner.tipo !== 'produtos_destaque' || !banner.produtos_destaque.length) {
      toast.error('Nenhum produto encontrado neste banner')
      return
    }

    // Buscar dados completos dos produtos
    const supabase = createClient()
    const produtoIds = banner.produtos_destaque.map((p) => p.produto_id)
    const { data: produtos, error } = await supabase
      .from('produtos')
      .select('id, nome, codigo_produto, preco, foto_principal, condicao, garantia, nivel_bateria, cores')
      .in('id', produtoIds)
      .filter('deleted_at', 'is', null)

    if (error) {
      logger.error('Erro ao carregar produtos:', error)
      toast.error('Erro ao carregar produtos: ' + error.message)
      return
    }

    if (!produtos || produtos.length === 0) {
      toast.error('Não foi possível carregar os produtos')
      return
    }

    // Mapear para ProductCardData
    const produtosParaExportar: ProductCardData[] = produtos.map((p: any) => {
      const produtoDestaque = banner.produtos_destaque.find((pd) => pd.produto_id === p.id)
      return {
        id: p.id,
        nome: p.nome,
        codigo_produto: p.codigo_produto,
        preco: p.preco,
        preco_promocional: produtoDestaque?.preco_promocional || p.preco,
        foto_principal: p.foto_principal,
        condicao: p.condicao,
        garantia: p.garantia,
        nivel_bateria: p.nivel_bateria,
        cores: p.cores || [],
      }
    })

    setExportProdutos(produtosParaExportar)
    setExportDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <div className="text-center">
          <div className="relative mx-auto h-8 w-8 animate-pulse">
            <div className="h-full w-full rounded-full border-4 border-zinc-700 opacity-40 brightness-150 grayscale" />
          </div>
          <p className="mt-4 text-sm text-zinc-400">Carregando banners...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white md:text-2xl">Banners</h2>
          <p className="text-xs text-zinc-400 md:text-sm">
            Gerencie os banners do carrossel da home
          </p>
        </div>

        <Button
          onClick={() => handleOpenDialog()}
          className="w-full sm:w-auto"
          style={{
            backgroundColor: 'var(--brand-yellow)',
            color: 'var(--brand-black)',
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center md:p-12">
          <p className="text-zinc-400">Nenhum banner cadastrado ainda.</p>
          <p className="mt-2 text-sm text-zinc-500">
            Clique em &quot;Novo Banner&quot; para adicionar o primeiro banner.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Ordem</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Preview</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Título</th>
                  <th className="hidden px-4 py-3 text-left text-sm font-medium text-zinc-400 md:table-cell">
                    Subtítulo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner, index) => (
                  <tr key={banner.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-zinc-600" />
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveBanner(index, 'up')}
                            disabled={index === 0}
                            className="text-zinc-500 hover:text-white disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveBanner(index, 'down')}
                            disabled={index === banners.length - 1}
                            className="text-zinc-500 hover:text-white disabled:opacity-30"
                          >
                            ↓
                          </button>
                        </div>
                        <span className="text-sm text-zinc-500">{banner.ordem}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {banner.tipo === 'produtos_destaque' ? (
                        <div className="flex h-16 w-28 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950">
                          <div className="text-center">
                            <span className="text-2xl">🔥</span>
                            <div className="text-[10px] text-zinc-500">
                              {banner.produtos_destaque?.length || 0} produtos
                            </div>
                          </div>
                        </div>
                      ) : banner.imagem_url ? (
                        <div className="relative h-16 w-28 overflow-hidden rounded-md bg-zinc-950">
                          <Image
                            src={banner.imagem_url}
                            alt={banner.titulo}
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-28 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950">
                          <span className="text-xs text-zinc-600">Sem imagem</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{banner.titulo}</div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <p className="max-w-xs truncate text-sm text-zinc-400">
                        {banner.subtitulo || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleAtivo(banner.id, banner.ativo)}
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
                          banner.ativo
                            ? 'bg-green-900/30 text-green-400 hover:bg-green-900/40'
                            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                        }`}
                      >
                        {banner.ativo ? (
                          <>
                            <Eye className="mr-1 h-3 w-3" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <EyeOff className="mr-1 h-3 w-3" />
                            Inativo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {banner.tipo === 'produtos_destaque' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenExportDialog(banner)}
                            className="h-8 w-8 text-zinc-400 hover:text-yellow-400"
                            title="Exportar Cards"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(banner)}
                          className="h-8 w-8 text-zinc-400 hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setBannerToDelete(banner.id)
                            setDeleteDialogOpen(true)
                          }}
                          className="h-8 w-8 text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-5xl p-0 text-white border-zinc-800/80 bg-zinc-950/95 shadow-[0_28px_120px_-40px_rgba(0,0,0,0.85)]">
          <div className="flex h-full flex-col overflow-hidden">
            {(() => {
              const isEditing = Boolean(editingBanner)
              const accentStyles = isEditing
                ? {
                    circle: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
                    badge: 'border-blue-500/30 bg-blue-500/15 text-blue-200/90',
                    glow: 'shadow-[0_0_35px_-10px_rgba(59,130,246,0.35)]',
                  }
                : {
                    circle: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
                    badge: 'border-yellow-500/30 bg-yellow-500/15 text-yellow-200/90',
                    glow: 'shadow-[0_0_35px_-10px_rgba(250,204,21,0.35)]',
                  }
              const HeaderIcon = isEditing ? Edit : Plus
              const modeBadgeText = isEditing ? 'Edição ativa' : 'Novo cadastro'
              return (
                <div className="relative border-b border-zinc-800/70 bg-zinc-950/80 px-5 py-5 sm:px-6 sm:py-6 md:px-8">
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
                          {isEditing ? 'Editar Banner' : 'Novo Banner'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-zinc-400">
                          {isEditing
                            ? 'Atualize as informações do banner selecionado.'
                            : 'Preencha os dados para destacar uma nova campanha.'}
                        </DialogDescription>
                      </div>
                    </div>
                    <Badge className={`border ${accentStyles.badge}`}>{modeBadgeText}</Badge>
                  </div>
                  <p className="relative z-10 mt-4 text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Campos marcados com <span className="text-yellow-300">*</span> são obrigatórios
                  </p>
                </div>
              )
            })()}

            <form
              onSubmit={(event) => {
                event.preventDefault()
                void handleSave()
              }}
              className="flex flex-1 min-h-0 flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                  <section className="space-y-6">
                    <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-6">
                      <header className="mb-6 flex flex-col gap-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                          Informações básicas
                        </span>
                        <h3 className="text-lg font-semibold text-white">Conteúdo do banner</h3>
                        <p className="text-sm text-zinc-400">
                          Defina os textos e o link exibidos para o usuário.
                        </p>
                      </header>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="titulo">Título *</Label>
                          <Input
                            id="titulo"
                            value={formData.titulo}
                            onChange={(event) =>
                              setFormData({ ...formData, titulo: event.target.value })
                            }
                            className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                            placeholder="Ex: Promoção de Verão"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subtitulo">Subtítulo</Label>
                          <Input
                            id="subtitulo"
                            value={formData.subtitulo}
                            onChange={(event) =>
                              setFormData({ ...formData, subtitulo: event.target.value })
                            }
                            className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                            placeholder="Ex: Até 30% de desconto"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="link">Link (opcional)</Label>
                          <Input
                            id="link"
                            value={formData.link}
                            onChange={(event) =>
                              setFormData({ ...formData, link: event.target.value })
                            }
                            className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                            placeholder="Ex: /produtos/iphone-15"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-6">
                      <header className="mb-6 flex flex-col gap-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                          Tipo de banner *
                        </span>
                        <h3 className="text-lg font-semibold text-white">Formato de destaque</h3>
                        <p className="text-sm text-zinc-400">
                          Escolha entre uma imagem única ou um bloco de produtos.
                        </p>
                      </header>

                      <RadioGroup
                        value={formData.tipo}
                        onValueChange={(value) => {
                          setFormData({ ...formData, tipo: value as 'banner' | 'produtos_destaque' })
                          if (value === 'produtos_destaque') {
                            setFormData((prev) => ({ ...prev, imagem_url: '' }))
                          }
                        }}
                        className="flex flex-col gap-3"
                      >
                        <div className="flex items-start gap-3 rounded-lg border border-zinc-800 p-3 transition hover:border-zinc-700 hover:bg-zinc-900/20">
                          <RadioGroupItem value="banner" id="tipo-banner" className="mt-0.5" />
                          <div className="flex-1">
                            <Label htmlFor="tipo-banner" className="cursor-pointer font-medium text-white">
                              Banner (Imagem)
                            </Label>
                            <p className="text-xs text-zinc-500">Exibe uma peça visual no carrossel.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-lg border border-zinc-800 p-3 transition hover:border-zinc-700 hover:bg-zinc-900/20">
                          <RadioGroupItem value="produtos_destaque" id="tipo-produtos" className="mt-0.5" />
                          <div className="flex-1">
                            <Label htmlFor="tipo-produtos" className="cursor-pointer font-medium text-white">
                              Produtos em Destaque
                            </Label>
                            <p className="text-xs text-zinc-500">Mostra até 4 produtos com preços especiais.</p>
                          </div>
                        </div>
                      </RadioGroup>

                      <div className="mt-6 flex items-center gap-2 rounded-lg border border-zinc-800/70 bg-zinc-950/80 p-3">
                        <Checkbox
                          id="ativo"
                          checked={formData.ativo}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, ativo: !!checked })
                          }
                        />
                        <Label htmlFor="ativo" className="cursor-pointer text-sm text-zinc-200">
                          Banner ativo
                        </Label>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    {formData.tipo === 'banner' ? (
                      <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-6">
                        <header className="mb-6 flex flex-col gap-1">
                          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                            Imagem do banner
                          </span>
                          <h3 className="text-lg font-semibold text-white">Upload</h3>
                          <p className="text-sm text-zinc-400">
                            Recomendamos imagens no formato 1920x600 (landscape).
                          </p>
                        </header>
                        <ImageUpload
                          images={formData.imagem_url ? [formData.imagem_url] : []}
                          onChange={(images) =>
                            setFormData({
                              ...formData,
                              imagem_url: images[0] || '',
                            })
                          }
                          maxImages={1}
                          disabled={saving}
                        />
                        {formData.imagem_url ? (
                          <p className="mt-3 text-xs text-zinc-500">
                            URL atual: <span className="break-all text-zinc-300">{formData.imagem_url}</span>
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-6">
                        <header className="mb-6 flex flex-col gap-1">
                          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                            Produtos em destaque
                          </span>
                          <h3 className="text-lg font-semibold text-white">Seleção e promoções</h3>
                          <p className="text-sm text-zinc-400">
                            Busque produtos para adicionar ao banner e defina preços promocionais.
                          </p>
                        </header>

                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                            <Input
                              value={searchTerm}
                              onChange={(event) => {
                                const value = event.target.value
                                setSearchTerm(value)
                                void searchProdutos(value)
                              }}
                              placeholder="Buscar por nome ou código..."
                              className="border-zinc-800 bg-zinc-950 pl-10 text-white placeholder:text-zinc-500"
                              disabled={selectedProdutos.length >= 4}
                            />
                            {searchResults.length > 0 && (
                              <div className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/95 shadow-xl">
                                {searchResults.map((produto) => (
                                  <button
                                    key={produto.id}
                                    type="button"
                                    onClick={() => handleAddProduto(produto)}
                                    className="flex w-full items-center gap-3 border-b border-zinc-800/70 p-3 text-left transition hover:bg-zinc-900/70"
                                  >
                                    <div className="relative h-12 w-12 overflow-hidden rounded bg-zinc-900">
                                      {produto.foto_principal ? (
                                        <Image
                                          src={produto.foto_principal}
                                          alt={produto.nome}
                                          fill
                                          className="object-cover"
                                          sizes="48px"
                                        />
                                      ) : (
                                        <div className="flex h-full items-center justify-center text-[10px] text-zinc-500">
                                          Sem foto
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-white">{produto.nome}</div>
                                      <div className="text-xs text-zinc-500">{produto.codigo_produto}</div>
                                    </div>
                                    <div className="text-sm text-zinc-400">
                                      R$ {produto.preco.toFixed(2)}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {selectedProdutos.length > 0 ? (
                            <div className="space-y-3">
                              {selectedProdutos.map((produto) => (
                                <div
                                  key={produto.id}
                                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/90 p-3"
                                >
                                  <div className="relative h-16 w-16 overflow-hidden rounded bg-zinc-900">
                                    {produto.foto_principal ? (
                                      <Image
                                        src={produto.foto_principal}
                                        alt={produto.nome}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                      />
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                                        Sem foto
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-2">
                                    <div>
                                      <div className="text-sm font-medium text-white truncate">{produto.nome}</div>
                                      <div className="text-xs text-zinc-500 truncate">{produto.codigo_produto}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Label htmlFor={`preco-${produto.id}`} className="text-xs text-zinc-400 whitespace-nowrap">
                                        Preço promocional:
                                      </Label>
                                      <Input
                                        id={`preco-${produto.id}`}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={produto.preco_promocional}
                                        onChange={(event) =>
                                          handleUpdatePrecoPromocional(
                                            produto.id,
                                            parseFloat(event.target.value) || 0
                                          )
                                        }
                                        className="h-8 w-20 sm:w-28 border-zinc-800 bg-zinc-900 text-right text-sm text-white"
                                      />
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveProduto(produto.id)}
                                    className="h-8 w-8 text-zinc-400 hover:text-red-400"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-sm text-zinc-500">
                              Busque e selecione produtos para destacar.
                            </p>
                          )}

                          {/* Campo de Countdown Timer - Melhorado */}
                          <div className="mt-6 space-y-3 rounded-lg border border-zinc-800/70 bg-zinc-950/80 p-4">
                            <div>
                              <Label className="text-sm font-medium text-zinc-200">
                                Prazo da Promoção (opcional)
                              </Label>
                              <p className="mt-1 text-xs text-zinc-500">
                                Defina quando a promoção termina para exibir contagem regressiva
                              </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              {/* Dias */}
                              <div className="space-y-2">
                                <Label htmlFor="countdown_days" className="text-xs text-zinc-400">
                                  Dias a partir de agora
                                </Label>
                                <Input
                                  id="countdown_days"
                                  type="number"
                                  min="0"
                                  max="365"
                                  placeholder="Ex: 7"
                                  value={
                                    (() => {
                                      if (!formData.countdown_ends_at) return ''
                                      const diff = new Date(formData.countdown_ends_at).getTime() - Date.now()
                                      return Math.floor(diff / (1000 * 60 * 60 * 24)).toString()
                                    })()
                                  }
                                  onChange={(event) => {
                                    const days = parseInt(event.target.value) || 0
                                    const now = new Date()
                                    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
                                    
                                    // Preservar hora se já existe
                                    if (formData.countdown_ends_at) {
                                      const currentDate = new Date(formData.countdown_ends_at)
                                      endDate.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0)
                                    } else {
                                      endDate.setHours(23, 59, 0, 0)
                                    }
                                    
                                    setFormData({
                                      ...formData,
                                      countdown_ends_at: event.target.value ? endDate.toISOString() : null,
                                    })
                                  }}
                                  className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                                  disabled={saving}
                                />
                                <p className="text-[10px] text-zinc-600">
                                  Quantos dias a partir de agora
                                </p>
                              </div>

                              {/* Hora */}
                              <div className="space-y-2">
                                <Label htmlFor="countdown_time" className="text-xs text-zinc-400">
                                  Hora do dia
                                </Label>
                                <Input
                                  id="countdown_time"
                                  type="time"
                                  placeholder="23:59"
                                  value={
                                    formData.countdown_ends_at
                                      ? new Date(formData.countdown_ends_at)
                                          .toLocaleTimeString('pt-BR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false,
                                          })
                                      : ''
                                  }
                                  onChange={(event) => {
                                    const timeValue = event.target.value // "HH:MM"
                                    if (!timeValue) return

                                    const [hours, minutes] = timeValue.split(':').map(Number)
                                    
                                    // Usar data existente ou criar nova para amanhã 23:59
                                    let endDate = formData.countdown_ends_at
                                      ? new Date(formData.countdown_ends_at)
                                      : new Date(Date.now() + 24 * 60 * 60 * 1000)
                                    
                                    endDate.setHours(hours, minutes, 0, 0)
                                    
                                    setFormData({
                                      ...formData,
                                      countdown_ends_at: endDate.toISOString(),
                                    })
                                  }}
                                  className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                                  disabled={saving}
                                />
                                <p className="text-[10px] text-zinc-600">
                                  Hora que a promoção termina
                                </p>
                              </div>
                            </div>

                            {/* Preview da data final */}
                            {formData.countdown_ends_at && (
                              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                                <div className="text-xs">
                                  <span className="text-zinc-500">Termina em: </span>
                                  <span className="font-medium text-white">
                                    {new Date(formData.countdown_ends_at).toLocaleString('pt-BR', {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    })}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData({ ...formData, countdown_ends_at: null })
                                  }
                                  className="text-xs text-red-500 hover:text-red-400"
                                >
                                  Limpar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              </div>

              <div className="border-t border-zinc-800/70 bg-zinc-950/85 px-5 py-4 shadow-[0_-20px_40px_-40px_rgba(0,0,0,0.8)] sm:px-6 md:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800 sm:w-auto min-h-[48px]"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      saving ||
                      !formData.titulo.trim() ||
                      (formData.tipo === 'banner' && !formData.imagem_url)
                    }
                    className="w-full bg-[var(--brand-yellow)] text-[var(--brand-black)] hover:bg-[var(--brand-yellow)]/90 sm:w-auto min-h-[48px]"
                  >
                    {saving ? 'Salvando...' : editingBanner ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog Confirmar Exclusão */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir banner"
        description="Tem certeza que deseja excluir este banner? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />

      {/* Dialog de Exportação de Cards */}
      <ExportCardDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        produtos={exportProdutos}
      />
    </div>
  )
}
