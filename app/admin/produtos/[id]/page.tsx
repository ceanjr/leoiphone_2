'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/admin/image-upload'
import { updateProduto, getProdutoById, getCategorias } from '../actions'
import type { ProdutoFormData } from '@/types/produto'

interface EditProdutoPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditProdutoPage({ params }: EditProdutoPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [categorias, setCategorias] = useState<Array<{ id: string; nome: string }>>([])
  const [formData, setFormData] = useState<Partial<ProdutoFormData>>({
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

  useEffect(() => {
    async function loadData() {
      try {
        // Carregar categorias
        const { categorias: cats } = await getCategorias()
        setCategorias(cats)

        // Carregar produto
        const { produto, error } = await getProdutoById(id)

        if (error || !produto) {
          toast.error('Produto não encontrado')
          router.push('/admin/produtos')
          return
        }

        // Preencher formulário
        const prod: any = produto
        setFormData({
          codigo_produto: prod.codigo_produto || undefined,
          nome: prod.nome,
          descricao: prod.descricao || undefined,
          preco: prod.preco,
          nivel_bateria: prod.nivel_bateria || undefined,
          condicao: prod.condicao,
          categoria_id: prod.categoria_id,
          garantia: prod.garantia,
          acessorios: prod.acessorios,
          fotos: prod.fotos,
          foto_principal: prod.foto_principal || undefined,
        })
      } catch (error) {
        toast.error('Erro ao carregar produto')
        router.push('/admin/produtos')
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateProduto(id, formData as ProdutoFormData)

      if (result.success) {
        toast.success('Produto atualizado com sucesso!')
        router.push('/admin/produtos')
      } else {
        toast.error(result.error || 'Erro ao atualizar produto')
      }
    } catch (error) {
      toast.error('Erro inesperado ao atualizar produto')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex h-64 items-center justify-center p-4 md:p-6">
          <div className="text-center">
            <div className="relative mx-auto h-8 w-8 animate-pulse">
              <div className="h-full w-full rounded-full border-4 border-zinc-700 opacity-40 brightness-150 grayscale" />
            </div>
            <p className="mt-4 text-sm text-zinc-400">Carregando produto...</p>
          </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/admin/produtos">
            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white md:text-2xl">{formData.nome || 'Editar Produto'}</h2>
            <p className="text-xs text-zinc-400 md:text-sm">Código: {formData.codigo_produto || 'Sem código'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Informações do Produto</CardTitle>
            <CardDescription>Atualize os dados do iPhone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Código do Produto */}
            <div className="space-y-2">
              <Label htmlFor="codigo_produto" className="text-zinc-200">
                Código do Produto
              </Label>
              <Input
                id="codigo_produto"
                value={formData.codigo_produto || ''}
                onChange={(e) => setFormData({ ...formData, codigo_produto: e.target.value })}
                className="border-zinc-800 bg-zinc-950 text-white"
                placeholder="Ex: IPH15PM256"
              />
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-zinc-200">
                Nome do Produto *
              </Label>
              <Input
                id="nome"
                required
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="border-zinc-800 bg-zinc-950 text-white"
                placeholder="Ex: iPhone 15 Pro Max 256GB"
              />
            </div>

            {/* Preço */}
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
                value={formData.preco || ''}
                onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
                className="border-zinc-800 bg-zinc-950 text-white"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-zinc-200">
                Descrição
              </Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ''}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="border-zinc-800 bg-zinc-950 text-white"
                rows={4}
              />
            </div>

            {/* Condição */}
            <div className="space-y-2">
              <Label className="text-zinc-200">Condição *</Label>
              <Select
                value={formData.condicao}
                onValueChange={(value) => setFormData({ ...formData, condicao: value as 'novo' | 'seminovo' })}
              >
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="seminovo">Seminovo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label className="text-zinc-200">Categoria *</Label>
              <Select
                value={formData.categoria_id}
                onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
              >
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-white">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Garantia */}
            <div className="space-y-2">
              <Label className="text-zinc-200">Garantia</Label>
              <Select
                value={formData.garantia}
                onValueChange={(value) => setFormData({ ...formData, garantia: value as 'nenhuma' | '3_meses' | '6_meses' | '1_ano' })}
              >
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Nenhuma</SelectItem>
                  <SelectItem value="3_meses">3 meses</SelectItem>
                  <SelectItem value="6_meses">6 meses</SelectItem>
                  <SelectItem value="1_ano">1 ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nível de Bateria */}
            <div className="space-y-2">
              <Label htmlFor="bateria" className="text-zinc-200">
                Nível de Bateria (%)
              </Label>
              <Input
                id="bateria"
                type="number"
                min="0"
                max="100"
                value={formData.nivel_bateria || ''}
                onChange={(e) => setFormData({ ...formData, nivel_bateria: parseInt(e.target.value) || undefined })}
                className="border-zinc-800 bg-zinc-950 text-white"
              />
            </div>

            {/* Fotos */}
            <div className="space-y-2">
              <Label className="text-zinc-200">Fotos do Produto</Label>
              <ImageUpload
                images={formData.fotos || []}
                onChange={(images) => {
                  setFormData({
                    ...formData,
                    fotos: images,
                    foto_principal: images[0] || undefined,
                  })
                }}
                maxImages={5}
                disabled={loading}
              />
            </div>

            {/* Acessórios */}
            <div className="space-y-3">
              <Label className="text-zinc-200">Acessórios Inclusos</Label>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {['caixa', 'carregador', 'capinha', 'pelicula'].map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      id={item}
                      checked={formData.acessorios?.[item as keyof typeof formData.acessorios]}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          acessorios: {
                            ...formData.acessorios!,
                            [item]: checked,
                          },
                        })
                      }
                    />
                    <Label htmlFor={item} className="text-sm text-zinc-300 capitalize cursor-pointer md:text-base">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto"
                style={{
                  backgroundColor: 'var(--brand-yellow)',
                  color: 'var(--brand-black)',
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Link href="/admin/produtos" className="w-full sm:w-auto">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
