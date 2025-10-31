'use client'

import { useState, useEffect } from 'react'
import { Search, Package, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { buscarProdutosDisponiveis, criarAnuncio } from '@/app/admin/anuncios/actions'
import { toast } from 'sonner'
import Image from 'next/image'

interface Produto {
  id: string
  codigo_produto: string
  nome: string
  slug: string
  preco: number
  foto_principal: string | null
  estoque: number
  ativo: boolean
}

interface CriarAnuncioDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CriarAnuncioDialog({ open, onClose, onSuccess }: CriarAnuncioDialogProps) {
  const [etapa, setEtapa] = useState<'buscar' | 'detalhes'>('buscar')
  const [busca, setBusca] = useState('')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [loading, setLoading] = useState(false)
  const [criando, setCriando] = useState(false)

  // Dados do anúncio
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')

  useEffect(() => {
    if (open && etapa === 'buscar') {
      carregarProdutos()
    }
  }, [open, etapa])

  useEffect(() => {
    if (produtoSelecionado) {
      setTitulo(produtoSelecionado.nome)
      setDescricao(`${produtoSelecionado.nome} - Disponível na Léo iPhone`)
    }
  }, [produtoSelecionado])

  async function carregarProdutos(termoBusca?: string) {
    setLoading(true)
    const result = await buscarProdutosDisponiveis(termoBusca)

    if (result.success && result.data) {
      setProdutos(result.data)
    } else {
      toast.error('Erro ao buscar produtos')
    }

    setLoading(false)
  }

  function handleBuscar() {
    carregarProdutos(busca)
  }

  function handleSelecionarProduto(produto: Produto) {
    setProdutoSelecionado(produto)
    setEtapa('detalhes')
  }

  function handleVoltar() {
    setEtapa('buscar')
    setProdutoSelecionado(null)
    setTitulo('')
    setDescricao('')
  }

  async function handleCriar() {
    if (!produtoSelecionado) return

    setCriando(true)

    const result = await criarAnuncio({
      produto_id: produtoSelecionado.id,
      titulo,
      descricao,
    })

    setCriando(false)

    if (result.success) {
      toast.success(result.message || 'Anúncio criado com sucesso!')
      onSuccess()
      onClose()
      handleVoltar()
    } else {
      toast.error(result.error || 'Erro ao criar anúncio')
    }
  }

  function handleClose() {
    onClose()
    setTimeout(() => {
      handleVoltar()
      setBusca('')
      setProdutos([])
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col max-h-[90vh] p-0 sm:max-w-2xl sm:p-6">
        <DialogHeader className="px-6 pt-6 pb-4 sm:p-0 sm:pb-4">
          <DialogTitle>
            {etapa === 'buscar' ? 'Selecionar Produto' : 'Detalhes do Anúncio'}
          </DialogTitle>
          <DialogDescription>
            {etapa === 'buscar'
              ? 'Busque e selecione o produto que deseja anunciar'
              : 'Configure os detalhes do anúncio no Facebook Marketplace'}
          </DialogDescription>
        </DialogHeader>

        {etapa === 'buscar' && (
          <div className="flex-1 overflow-hidden px-6 pb-6 sm:px-0 sm:pb-0">
            <div className="space-y-4">
              {/* Busca */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou código do produto..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={handleBuscar} disabled={loading}>
                  Buscar
                </Button>
              </div>

              {/* Lista de produtos */}
              <ScrollArea className="h-[50vh] sm:h-[400px] rounded-lg border">
              {loading ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  Carregando produtos...
                </div>
              ) : produtos.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Package className="mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {busca
                      ? 'Nenhum produto encontrado'
                      : 'Nenhum produto disponível para anunciar'}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {produtos.map((produto) => (
                    <button
                      key={produto.id}
                      onClick={() => handleSelecionarProduto(produto)}
                      className="flex w-full items-center gap-4 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
                    >
                      {/* Imagem */}
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                        {produto.foto_principal ? (
                          <Image
                            src={produto.foto_principal}
                            alt={produto.nome}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{produto.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {produto.codigo_produto}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-primary">
                          R$ {produto.preco.toFixed(2)}
                        </p>
                      </div>

                      {/* Estoque */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-muted-foreground">Estoque</p>
                        <p className="text-sm font-medium">{produto.estoque}</p>
                      </div>

                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
            </div>
          </div>
        )}

        {etapa === 'detalhes' && produtoSelecionado && (
          <div className="flex-1 overflow-y-auto px-6 pb-6 sm:px-0 sm:pb-0">
            <div className="space-y-4">
              {/* Preview do produto */}
              <div className="flex items-center gap-4 rounded-lg border bg-muted/50 p-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                {produtoSelecionado.foto_principal ? (
                  <Image
                    src={produtoSelecionado.foto_principal}
                    alt={produtoSelecionado.nome}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className="font-medium">{produtoSelecionado.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {produtoSelecionado.codigo_produto}
                </p>
                <p className="mt-1 text-lg font-semibold text-primary">
                  R$ {produtoSelecionado.preco.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Formulário */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Anúncio</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: iPhone 15 Pro Max 256GB Preto"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {titulo.length}/100 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o produto..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {descricao.length}/500 caracteres
                </p>
              </div>
            </div>

              {/* Ações */}
              <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={handleVoltar}
                  disabled={criando}
                  className="w-full sm:w-auto"
                >
                  Voltar
                </Button>
                <Button onClick={handleCriar} disabled={criando} className="flex-1">
                  {criando ? 'Criando anúncio...' : 'Anunciar Produto'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
