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
import { Badge } from '@/components/ui/badge'
import { BatteryIcon } from '@/components/shared/battery-icon'
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
  nivel_bateria?: number
  condicao?: string
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
      <DialogContent className="flex max-h-[95vh] w-[95vw] flex-col gap-0 p-0 sm:max-h-[90vh] sm:max-w-2xl sm:gap-6 sm:p-6">
        <DialogHeader className="border-b border-zinc-800 px-4 pb-3 pt-4 sm:border-none sm:p-0 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg">
            {etapa === 'buscar' ? 'Selecionar Produto' : 'Detalhes do Anúncio'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {etapa === 'buscar'
              ? 'Busque e selecione o produto que deseja anunciar'
              : 'Configure os detalhes do anúncio no Facebook Marketplace'}
          </DialogDescription>
        </DialogHeader>

        {etapa === 'buscar' && (
          <div className="flex-1 overflow-hidden px-4 pb-4 sm:px-0 sm:pb-0">
            <div className="space-y-3 sm:space-y-4">
              {/* Busca */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou código do produto..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                    className="h-10 pl-9"
                  />
                </div>
                <Button onClick={handleBuscar} disabled={loading} className="h-10 bg-blue-600 hover:bg-blue-700">
                  Buscar
                </Button>
              </div>

              {/* Lista de produtos */}
              <ScrollArea className="h-[50vh] rounded-lg border border-zinc-800 sm:h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center p-8 text-xs text-muted-foreground sm:text-sm">
                  Carregando produtos...
                </div>
              ) : produtos.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Package className="mb-2 h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {busca
                      ? 'Nenhum produto encontrado'
                      : 'Nenhum produto disponível para anunciar'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-2 sm:p-3">
                  {produtos.map((produto) => (
                    <button
                      key={produto.id}
                      onClick={() => handleSelecionarProduto(produto)}
                      className="group flex w-full items-center gap-3 rounded-lg border-2 border-transparent bg-zinc-950/50 p-2.5 text-left transition-all hover:border-blue-500 hover:bg-blue-500/5 active:scale-[0.98] sm:gap-4 sm:p-3"
                    >
                      {/* Imagem */}
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted sm:h-16 sm:w-16">
                        {produto.foto_principal ? (
                          <Image
                            src={produto.foto_principal}
                            alt={produto.nome}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground sm:h-8 sm:w-8" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold group-hover:text-blue-500 sm:text-sm">
                          {produto.nome}
                        </p>
                        <p className="text-[11px] text-muted-foreground sm:text-xs">
                          {produto.codigo_produto}
                        </p>
                        {produto.nivel_bateria && (
                          <Badge className="mt-1 flex w-fit items-center gap-1 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-white hover:bg-zinc-700 sm:text-xs">
                            <BatteryIcon level={produto.nivel_bateria} />
                            <span>{produto.nivel_bateria}%</span>
                          </Badge>
                        )}
                        <p className="mt-1 text-xs font-bold text-green-500 sm:text-sm">
                          R$ {produto.preco.toFixed(2)}
                        </p>
                      </div>

                      {/* Estoque */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-[10px] text-muted-foreground sm:text-xs">Estoque</p>
                        <p className="text-xs font-semibold sm:text-sm">{produto.estoque}</p>
                      </div>

                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-blue-500 sm:h-5 sm:w-5" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
            </div>
          </div>
        )}

        {etapa === 'detalhes' && produtoSelecionado && (
          <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-0 sm:pb-0">
            <div className="space-y-3 sm:space-y-4">
              {/* Preview do produto */}
              <div className="flex items-center gap-3 rounded-lg border-2 border-blue-500/30 bg-blue-500/5 p-3 sm:gap-4 sm:p-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md sm:h-20 sm:w-20">
                {produtoSelecionado.foto_principal ? (
                  <Image
                    src={produtoSelecionado.foto_principal}
                    alt={produtoSelecionado.nome}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <Package className="h-6 w-6 text-muted-foreground sm:h-8 sm:w-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold sm:text-base">{produtoSelecionado.nome}</p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {produtoSelecionado.codigo_produto}
                </p>
                {produtoSelecionado.nivel_bateria && (
                  <Badge className="mt-1 flex w-fit items-center gap-1 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-white hover:bg-zinc-700 sm:px-2 sm:text-xs">
                    <BatteryIcon level={produtoSelecionado.nivel_bateria} />
                    <span>{produtoSelecionado.nivel_bateria}%</span>
                  </Badge>
                )}
                <p className="mt-1 text-base font-bold text-green-500 sm:text-lg">
                  R$ {produtoSelecionado.preco.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Formulário */}
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo" className="text-xs sm:text-sm">Título do Anúncio</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: iPhone 15 Pro Max 256GB Preto"
                  maxLength={100}
                  className="h-10"
                />
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  {titulo.length}/100 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-xs sm:text-sm">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o produto..."
                  rows={4}
                  maxLength={500}
                  className="resize-none text-xs sm:text-sm"
                />
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  {descricao.length}/500 caracteres
                </p>
              </div>
            </div>

              {/* Ações */}
              <div className="flex flex-col gap-2 border-t border-zinc-800 bg-zinc-950/50 px-4 py-3 sm:flex-row sm:border-none sm:bg-transparent sm:px-0 sm:py-0">
                <Button
                  variant="outline"
                  onClick={handleVoltar}
                  disabled={criando}
                  className="h-10 w-full sm:w-auto"
                >
                  Voltar
                </Button>
                <Button onClick={handleCriar} disabled={criando} className="h-10 flex-1 bg-blue-600 hover:bg-blue-700">
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
