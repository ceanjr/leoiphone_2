'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, Search, X } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { ImageUpload } from '@/components/admin/image-upload'
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
  })
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Produto[]>([])
  const [selectedProdutos, setSelectedProdutos] = useState<
    Array<Produto & { preco_promocional: number }>
  >([])

  useEffect(() => {
    loadBanners()
  }, [])

  async function loadBanners() {
    setLoading(true)
    const { banners: data } = await getBanners()
    setBanners(data)
    setLoading(false)
  }

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
          const produtosComPreco = produtos.map((p) => {
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
        <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? 'Editar Banner' : 'Novo Banner'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editingBanner
                ? 'Atualize as informações do banner'
                : 'Preencha os dados do novo banner'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="border-zinc-800 bg-zinc-950 text-white"
                placeholder="Ex: Promoção de Verão"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitulo">Subtítulo</Label>
              <Input
                id="subtitulo"
                value={formData.subtitulo}
                onChange={(e) => setFormData({ ...formData, subtitulo: e.target.value })}
                className="border-zinc-800 bg-zinc-950 text-white"
                placeholder="Ex: Até 30% de desconto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link (opcional)</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="border-zinc-800 bg-zinc-950 text-white"
                placeholder="Ex: /produtos/iphone-15"
              />
            </div>

            {/* Tipo de Banner */}
            <div className="space-y-3">
              <Label>Tipo de Banner *</Label>
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
                <div className="flex items-start space-x-3 rounded-lg border border-zinc-800 p-3 hover:bg-zinc-800/30">
                  <RadioGroupItem value="banner" id="tipo-banner" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="tipo-banner" className="cursor-pointer font-medium">
                      Banner (Imagem)
                    </Label>
                    <p className="text-xs text-zinc-500">Exibe uma imagem no carrossel</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rounded-lg border border-zinc-800 p-3 hover:bg-zinc-800/30">
                  <RadioGroupItem
                    value="produtos_destaque"
                    id="tipo-produtos"
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="tipo-produtos" className="cursor-pointer font-medium">
                      Produtos em Destaque
                    </Label>
                    <p className="text-xs text-zinc-500">
                      Exibe até 4 produtos com preços promocionais
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Campo de Imagem - apenas para tipo banner */}
            {formData.tipo === 'banner' && (
              <div className="space-y-2">
                <Label>Imagem do Banner *</Label>
                <ImageUpload
                  images={formData.imagem_url ? [formData.imagem_url] : []}
                  onChange={(images) => {
                    setFormData({
                      ...formData,
                      imagem_url: images[0] || '',
                    })
                  }}
                  maxImages={1}
                  disabled={saving}
                />
                <p className="text-xs text-zinc-500">
                  Recomendado: 1920x600px (formato landscape)
                </p>
              </div>
            )}

            {/* Seleção de Produtos - apenas para tipo produtos_destaque */}
            {formData.tipo === 'produtos_destaque' && (
              <div className="space-y-3">
                <Label>Produtos em Destaque (máx. 4) *</Label>

                {/* Busca de Produtos */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      searchProdutos(e.target.value)
                    }}
                    placeholder="Buscar por nome ou código do produto..."
                    className="border-zinc-800 bg-zinc-950 pl-10 text-white"
                    disabled={selectedProdutos.length >= 4}
                  />

                  {/* Resultados da Busca */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 shadow-lg">
                      {searchResults.map((produto) => (
                        <button
                          key={produto.id}
                          onClick={() => handleAddProduto(produto)}
                          className="flex w-full items-center gap-3 border-b border-zinc-800 p-3 text-left hover:bg-zinc-800/50"
                        >
                          <div className="relative h-12 w-12 overflow-hidden rounded bg-zinc-900">
                            <Image
                              src={produto.foto_principal}
                              alt={produto.nome}
                              fill
                              className="object-cover"
                            />
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

                {/* Produtos Selecionados */}
                {selectedProdutos.length > 0 && (
                  <div className="space-y-2">
                    {selectedProdutos.map((produto) => (
                      <div
                        key={produto.id}
                        className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                      >
                        <div className="relative h-16 w-16 overflow-hidden rounded bg-zinc-900">
                          <Image
                            src={produto.foto_principal}
                            alt={produto.nome}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <div className="text-sm font-medium text-white">{produto.nome}</div>
                            <div className="text-xs text-zinc-500">{produto.codigo_produto}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`preco-${produto.id}`} className="text-xs">
                              Preço promocional:
                            </Label>
                            <Input
                              id={`preco-${produto.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={produto.preco_promocional}
                              onChange={(e) =>
                                handleUpdatePrecoPromocional(
                                  produto.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="h-8 w-32 border-zinc-800 bg-zinc-900 text-sm"
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
                )}

                {selectedProdutos.length === 0 && (
                  <p className="text-center text-sm text-zinc-500">
                    Busque e selecione produtos para destacar
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativo: !!checked })
                }
              />
              <Label htmlFor="ativo" className="cursor-pointer text-sm">
                Banner ativo
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                !formData.titulo.trim() ||
                (formData.tipo === 'banner' && !formData.imagem_url) ||
                (formData.tipo === 'produtos_destaque' && selectedProdutos.length === 0)
              }
              style={{
                backgroundColor: 'var(--brand-yellow)',
                color: 'var(--brand-black)',
              }}
            >
              {saving ? 'Salvando...' : editingBanner ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
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
    </div>
  )
}
