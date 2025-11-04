'use client'
import { logger } from '@/lib/utils/logger'

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { notFound, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Share2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { WhatsAppContactButton } from '@/components/shared/whatsapp-contact-button'
import { CalculadoraParcelas } from '@/components/public/calculadora/calculadora-parcelas'
import { ProdutosRelacionados } from '@/components/public/produtos-relacionados'
import { ImageGalleryWithZoom } from '@/components/public/image-gallery-zoom'
import { ProductStructuredData } from '@/components/seo/product-structured-data'
import { createClient } from '@/lib/supabase/client'
import { usePollingTaxas } from '@/hooks/use-polling-taxas'
import type { ProdutoComCategoria } from '@/types/produto'
import type { TaxasConfig } from '@/lib/validations/taxas'
import type { TrocaFormData } from '@/lib/validations/troca'
import { estadoConservacaoLabels } from '@/lib/validations/troca'

// Lazy load heavy modals
const CompraOuTrocaModal = lazy(() => 
  import('@/components/public/compra-troca-modal').then(mod => ({ default: mod.CompraOuTrocaModal }))
)
const TrocaModal = lazy(() =>
  import('@/components/public/troca-modal').then(mod => ({ default: mod.TrocaModal }))
)

export function ProdutoPageClient({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  const [produto, setProduto] = useState<ProdutoComCategoria | null>(null)
  const [loading, setLoading] = useState(true)
  const [fotoSelecionada, setFotoSelecionada] = useState(0)
  const [calculadoraAtiva, setCalculadoraAtiva] = useState(false)
  const [taxas, setTaxas] = useState<TaxasConfig | null>(null)
  const [produtosRelacionadosSelecionados, setProdutosRelacionadosSelecionados] = useState<
    string[]
  >([])
  const [produtosRelacionadosInfo, setProdutosRelacionadosInfo] = useState<
    Array<{ id: string; nome: string; slug: string; preco: number }>
  >([])

  // Estados dos modais
  const [modalCompraOuTroca, setModalCompraOuTroca] = useState(false)
  const [modalTroca, setModalTroca] = useState(false)
  const [dadosTroca, setDadosTroca] = useState<TrocaFormData | null>(null)
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false)

  // Obter parâmetros de retorno
  const returnParams = searchParams?.get('return') || ''
  const backUrl = returnParams ? `/?${returnParams}` : '/'
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Obter preço promocional (se vier do banner de produtos em destaque)
  const precoPromo = searchParams?.get('preco_promo')
  const precoPromocional = precoPromo ? parseFloat(precoPromo) : null

  // Usar preço promocional se disponível, senão usar preço normal
  const precoAtual =
    produto && precoPromocional && precoPromocional < produto.preco
      ? precoPromocional
      : produto?.preco

  // Ler produtos relacionados da URL ao carregar
  useEffect(() => {
    if (!searchParams) return

    const relacionadosParam = searchParams.get('relacionados')
    if (relacionadosParam) {
      const ids = relacionadosParam.split(',').filter(Boolean)
      setProdutosRelacionadosSelecionados(ids)
    }
  }, [searchParams])

  // Buscar informações dos produtos relacionados selecionados
  useEffect(() => {
    async function loadProdutosRelacionadosInfo() {
      if (produtosRelacionadosSelecionados.length === 0) {
        setProdutosRelacionadosInfo([])
        return
      }

      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('produtos')
          .select('id, nome, slug, preco')
          .in('id', produtosRelacionadosSelecionados)

        if (data) {
          setProdutosRelacionadosInfo(data)
        }
      } catch (error) {
        logger.error('Erro ao buscar informações dos produtos relacionados:', error)
      }
    }

    loadProdutosRelacionadosInfo()
  }, [produtosRelacionadosSelecionados])

  // Polling: callback para atualizar taxas quando mudar no admin
  const handleTaxasUpdate = useCallback((config: { ativo: boolean; taxas: TaxasConfig }) => {
    logger.log('[ProdutoPage] Taxas atualizadas via polling:', config)
    setCalculadoraAtiva(config.ativo)
    setTaxas(config.taxas)
  }, [])

  // Ativar polling para taxas
  usePollingTaxas({
    enabled: true,
    onUpdate: handleTaxasUpdate,
  })

  // Polling manual para o produto atual
  useEffect(() => {
    if (!produto?.id) return

    const supabase = createClient()

    const checkProdutoUpdate = async () => {
      try {
        const { data, error } = await supabase
          .from('produtos')
          .select(
            `
            *,
            categoria:categorias(id, nome, slug)
          `
          )
          .eq('slug', slug)
          .single()

        if (error || !data) {
          // Produto não encontrado ou erro, redirecionar
          logger.log('[ProdutoPage] Produto não encontrado, redirecionando...')
          window.location.href = backUrl
          return
        }

        const produtoAtualizado = data as ProdutoComCategoria

        // Se foi desativado ou deletado, redirecionar
        if (!produtoAtualizado.ativo || produtoAtualizado.deleted_at) {
          logger.log('[ProdutoPage] Produto desativado/deletado, redirecionando...')
          window.location.href = backUrl
          return
        }

        // Verificar se houve mudança (comparar updated_at)
        if (produto.updated_at !== produtoAtualizado.updated_at) {
          logger.log('[ProdutoPage] Produto atualizado via polling')
          setProduto(produtoAtualizado)
        }
      } catch (error) {
        logger.error('[ProdutoPage] Erro no polling do produto:', error)
      }
    }

    // Verificar a cada 10 segundos
    pollingIntervalRef.current = setInterval(checkProdutoUpdate, 10000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [produto?.id, produto?.updated_at, slug, backUrl])

  useEffect(() => {
    async function loadProduto() {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('produtos')
        .select(
          `
          *,
          categoria:categorias(id, nome, slug)
        `
        )
        .eq('slug', slug)
        .eq('ativo', true)
        .is('deleted_at', null)
        .single()

      if (error || !data) {
        notFound()
      }

      const produtoData = data as ProdutoComCategoria
      setProduto(produtoData)
      setLoading(false)

      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData.session
        if (!session?.user) {
          const payload: { produto_id: string } = { produto_id: produtoData.id }
          await supabase.rpc('increment_visualizacoes', payload as any)
        }
      } catch (incrementError) {
        logger.warn('Não foi possível contabilizar a visualização do produto:', incrementError)
      }

      // Preload de TODAS as imagens para garantir transições instantâneas
      if (produtoData.fotos && produtoData.fotos.length > 0) {
        // Primeira imagem: preload de alta prioridade
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = produtoData.fotos[0]
        document.head.appendChild(link)

        // Todas as outras imagens: preload em background
        // Isso garante que ao trocar de foto não há delay
        if (produtoData.fotos.length > 1) {
          produtoData.fotos.slice(1).forEach((fotoUrl, index) => {
            const img = new Image()
            img.src = fotoUrl
            // Opcional: adicionar onload para debug
            if (process.env.NODE_ENV === 'development') {
              img.onload = () => logger.log(`[Performance] Imagem ${index + 2} carregada`)
            }
          })
          logger.log(
            `[Performance] Preload de ${produtoData.fotos.length - 1} imagens adicionais iniciado`
          )
        }
      }

      // Buscar configuração da calculadora de parcelas
      try {
        const { data: configData } = (await supabase
          .from('configuracoes_taxas')
          .select('ativo, taxas')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()) as { data: { ativo: boolean; taxas: unknown } | null }

        if (configData && configData.ativo) {
          setCalculadoraAtiva(true)
          setTaxas(configData.taxas as TaxasConfig)
        }
      } catch (error) {
        logger.warn('Não foi possível carregar configuração de taxas:', error)
      }
    }

    loadProduto()
  }, [slug])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto h-8 w-8 animate-pulse">
              <div className="h-full w-full rounded-full border-4 border-zinc-700 opacity-40 brightness-150 grayscale" />
            </div>
            <p className="mt-4 text-sm text-zinc-400">Carregando produto...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!produto) {
    notFound()
  }

  const formatPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco)
  }

  const garantiaTexto = {
    nenhuma: 'Sem garantia',
    '3_meses': '3 meses de garantia',
    '6_meses': '6 meses de garantia',
    '1_ano': '1 ano de garantia',
  }

  // Construir mensagem do WhatsApp com todas as informações
  const productUrl = typeof window !== 'undefined' ? window.location.href : ''
  const codigoProduto = produto.codigo_produto ? `, código ${produto.codigo_produto}` : ''

  // Criar URL com produtos relacionados selecionados
  const urlComProdutosRelacionados = (() => {
    if (typeof window === 'undefined' || produtosRelacionadosSelecionados.length === 0) {
      return productUrl
    }
    const url = new URL(window.location.href)
    url.searchParams.set('relacionados', produtosRelacionadosSelecionados.join(','))
    return url.toString()
  })()

  // Construir lista de produtos relacionados para a mensagem
  const produtosRelacionadosTexto =
    produtosRelacionadosInfo.length > 0
      ? `

Produtos adicionais selecionados:
${produtosRelacionadosInfo.map((p) => `• ${p.nome} - ${formatPreco(p.preco)}`).join('\n')}`
      : ''

  // Construir mensagem base do WhatsApp
  const buildWhatsappMessage = () => {
    let message = `Tenho interesse no ${produto.nome}${codigoProduto}, ${formatPreco(precoAtual || produto.preco)}`

    // Se houver dados de troca, adicionar
    if (dadosTroca) {
      message += `\n\n🔄 TROCA DO MEU APARELHO:\n\n📱 Modelo: ${dadosTroca.modelo}\n💾 Armazenamento: ${dadosTroca.armazenamento}\n⭐ Estado: ${estadoConservacaoLabels[dadosTroca.estadoConservacao]}\n🔧 Peças Trocadas: ${dadosTroca.pecasTrocadas ? 'Sim' : 'Não'}`

      if (dadosTroca.pecasTrocadas && dadosTroca.descricaoPecas) {
        message += `\nQuais: ${dadosTroca.descricaoPecas}`
      }

      message += `\n\n[Fotos: Enviarei em seguida]`
    }

    message += `${produtosRelacionadosTexto}\n\nLink: ${urlComProdutosRelacionados}`

    return message
  }

  const whatsappMessage = buildWhatsappMessage()

  // Handlers dos modais
  const handleWhatsAppClick = () => {
    setModalCompraOuTroca(true)
  }

  const handleComprar = () => {
    setDadosTroca(null)
    setWhatsappModalOpen(true)
  }

  const handleTrocar = () => {
    setModalTroca(true)
  }

  const handleTrocaSubmit = (data: TrocaFormData) => {
    setDadosTroca(data)
    setWhatsappModalOpen(true)
  }

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: produto.nome,
          text: `Confira: ${produto.nome} - ${formatPreco(precoAtual || produto.preco)}`,
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled or error occurred
        logger.log('Share cancelled or failed', error)
      }
    }
  }

  const showShareButton = typeof navigator !== 'undefined' && navigator.share

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Schema.org JSON-LD para SEO */}
      <ProductStructuredData produto={produto} />

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Link href={backUrl} className="hover:text-white">
            Início
          </Link>
          <span>/</span>
          <span className="text-white">{produto.nome}</span>
        </div>

        {/* Mobile Share Button */}
        {showShareButton && (
          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-white lg:hidden"
            aria-label="Compartilhar produto"
          >
            <Share2 className="h-4 w-4" />
            <span>Compartilhar</span>
          </button>
        )}
      </div>

      {/* Botão Voltar */}
      <Link href={backUrl} className="mb-6 inline-flex items-center text-zinc-400 hover:text-white">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para catálogo
      </Link>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Galeria de Imagens com Zoom */}
        <ImageGalleryWithZoom
          images={produto.fotos}
          productName={produto.nome}
          selectedIndex={fotoSelecionada}
          onIndexChange={setFotoSelecionada}
        />

        {/* Informações */}
        <div>
          {/* Badges */}
          <div className="mb-4 flex flex-wrap gap-2">
            {produto.condicao === 'novo' && <Badge className="bg-green-600 text-white">Novo</Badge>}
            {produto.condicao === 'seminovo' && (
              <Badge className="bg-amber-600 text-white">Seminovo</Badge>
            )}
            {produto.garantia !== 'nenhuma' && (
              <Badge className="bg-purple-600 text-white">Com Garantia</Badge>
            )}
            {produto.estoque > 0 && <Badge className="bg-zinc-700 text-white">Em Estoque</Badge>}
          </div>

          {/* Título e Código */}
          <h1 className="mb-2 text-3xl font-bold text-white">{produto.nome}</h1>
          {produto.codigo_produto && (
            <p className="mb-4 text-sm text-zinc-500">Código: {produto.codigo_produto}</p>
          )}

          {/* Preço */}
          <div className="mb-6">
            {precoPromocional && precoPromocional < produto.preco ? (
              <div className="flex justify-between sm:flex-row sm:items-center sm:gap-12">
                <div>
                  <p className="mb-1 text-sm text-zinc-500 line-through">
                    {formatPreco(produto.preco)}
                  </p>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-orange-500">🔥</span>
                    <p className="text-4xl font-bold" style={{ color: 'var(--brand-yellow)' }}>
                      {formatPreco(precoPromocional)}
                    </p>
                  </div>
                  <p className="mb-3 text-xs text-orange-500">
                    Oferta Especial - Economize {formatPreco(produto.preco - precoPromocional)}!
                  </p>
                </div>
                <button
                  onClick={handleWhatsAppClick}
                  style={{
                    background: 'var(--brand-yellow)',
                    border: '1.5px solid var(--brand-black)',
                    padding: '10px 10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    letterSpacing: '0.01em',
                    color: 'var(--brand-black)',
                    boxShadow: '0 0 0 0 rgba(255, 204, 0, 0.3)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  className="w-34 rounded-lg opacity-90 hover:scale-[1.02] hover:bg-[var(--brand-yellow)] hover:text-[var(--brand-black)] hover:shadow-[0_0_20px_rgba(255,204,0,0.4)] active:scale-[0.98] sm:w-auto sm:opacity-100"
                >
                  Tenho Interesse
                </button>
              </div>
            ) : (
              <div className="flex justify-between sm:flex-row sm:items-center sm:gap-12">
                <p className="text-4xl font-bold" style={{ color: 'var(--brand-yellow)' }}>
                  {formatPreco(produto.preco)}
                </p>
                <button
                  onClick={handleWhatsAppClick}
                  style={{
                    background: 'var(--brand-yellow)',
                    border: '1.5px solid var(--brand-black)',
                    padding: '10px 10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    letterSpacing: '0.01em',
                    color: 'var(--brand-black)',
                    boxShadow: '0 0 0 0 rgba(255, 204, 0, 0.3)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  className="w-34 rounded-lg opacity-90 hover:scale-[1.02] hover:bg-[var(--brand-yellow)] hover:text-[var(--brand-black)] hover:shadow-[0_0_20px_rgba(255,204,0,0.4)] active:scale-[0.98] sm:w-auto sm:opacity-100"
                >
                  Tenho Interesse
                </button>
              </div>
            )}
          </div>

          {/* Calculadora de Parcelas */}
          {calculadoraAtiva && taxas && (
            <div className="mb-6">
              <CalculadoraParcelas preco={precoAtual || produto.preco} taxas={taxas} />
            </div>
          )}

          {/* Descrição */}
          {produto.descricao && (
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold text-white">Descrição</h2>
              <p className="whitespace-pre-line text-zinc-400">{produto.descricao}</p>
            </div>
          )}

          {/* Produtos Relacionados */}
          {produto.categoria?.id && (
            <ProdutosRelacionados
              produtoId={produto.id}
              categoriaId={produto.categoria.id}
              produtosSelecionados={produtosRelacionadosSelecionados}
              onSelectionChange={setProdutosRelacionadosSelecionados}
            />
          )}

          {/* Especificações */}
          <Card className="mb-6 border-zinc-800 bg-zinc-900">
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">Especificações</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Condição:</span>
                  <span className="font-medium text-white capitalize">{produto.condicao}</span>
                </div>
                {produto.nivel_bateria && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Bateria:</span>
                    <span className="font-medium text-white">{produto.nivel_bateria}%</span>
                  </div>
                )}
                {produto.garantia !== 'nenhuma' && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Garantia:</span>
                    <span className="font-medium text-white">
                      {garantiaTexto[produto.garantia]}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Acessórios Inclusos */}
          <Card className="mb-6 border-zinc-800 bg-zinc-900">
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">Acessórios Inclusos</h2>
              <div className="grid grid-cols-2 gap-3">
                {produto.acessorios.caixa && (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" style={{ color: 'var(--brand-yellow)' }} />
                    <span className="text-zinc-300">Caixa Original</span>
                  </div>
                )}
                {produto.acessorios.carregador && (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" style={{ color: 'var(--brand-yellow)' }} />
                    <span className="text-zinc-300">Carregador</span>
                  </div>
                )}
                {produto.acessorios.capinha && (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" style={{ color: 'var(--brand-yellow)' }} />
                    <span className="text-zinc-300">Capinha</span>
                  </div>
                )}
                {produto.acessorios.pelicula && (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" style={{ color: 'var(--brand-yellow)' }} />
                    <span className="text-zinc-300">Película</span>
                  </div>
                )}
              </div>
              {!produto.acessorios.caixa &&
                !produto.acessorios.carregador &&
                !produto.acessorios.capinha &&
                !produto.acessorios.pelicula && (
                  <p className="text-zinc-500">Nenhum acessório incluso</p>
                )}
            </CardContent>
          </Card>

          {/* CTA WhatsApp */}
          <button
            onClick={handleWhatsAppClick}
            className="w-full rounded-lg bg-[var(--brand-yellow)] px-6 py-4 text-lg font-semibold text-[var(--brand-black)] transition-all hover:bg-[var(--brand-yellow)]/90 hover:shadow-lg active:scale-[0.98]"
          >
            Comprar pelo WhatsApp
          </button>
        </div>
      </div>

      {/* Modais - Lazy loaded with Suspense */}
      <Suspense fallback={null}>
        <CompraOuTrocaModal
          open={modalCompraOuTroca}
          onClose={() => setModalCompraOuTroca(false)}
          onComprar={handleComprar}
          onTrocar={handleTrocar}
          produtoNome={produto.nome}
        />
      </Suspense>

      <Suspense fallback={null}>
        <TrocaModal
          open={modalTroca}
          onClose={() => setModalTroca(false)}
          onSubmit={handleTrocaSubmit}
          produtoNome={produto.nome}
        />
      </Suspense>

      {/* Modal WhatsApp (sempre renderizado, controlado) */}
      <WhatsAppContactButton
        message={whatsappMessage}
        label=""
        produtoId={produto.id}
        produtoNome={produto.nome}
        open={whatsappModalOpen}
        onOpenChange={setWhatsappModalOpen}
        className="hidden"
      />
    </div>
  )
}
