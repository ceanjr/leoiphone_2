'use client'

import { use, useState } from 'react'
import { notFound, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Check, Share2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { WhatsAppContactButton } from '@/components/shared/whatsapp-contact-button'
import { CalculadoraParcelas } from '@/components/public/calculadora-parcelas'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeProdutos } from '@/hooks/use-realtime-produtos'
import { useRealtimeTaxas } from '@/hooks/use-realtime-taxas'
import type { ProdutoComCategoria } from '@/types/produto'
import type { TaxasConfig } from '@/lib/validations/taxas'
import { useEffect, Suspense, useCallback } from 'react'

interface ProdutoPageProps {
  params: Promise<{
    slug: string
  }>
}

function ProdutoPageContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  const [produto, setProduto] = useState<ProdutoComCategoria | null>(null)
  const [loading, setLoading] = useState(true)
  const [fotoSelecionada, setFotoSelecionada] = useState(0)
  const [calculadoraAtiva, setCalculadoraAtiva] = useState(false)
  const [taxas, setTaxas] = useState<TaxasConfig | null>(null)

  // Obter parâmetros de retorno
  const returnParams = searchParams?.get('return') || ''
  const backUrl = returnParams ? `/?${returnParams}` : '/'

  // Realtime: callback para atualizar produto quando mudar no admin
  const handleProdutoUpdate = useCallback((produtoAtualizado: ProdutoComCategoria) => {
    if (produtoAtualizado.slug === slug) {
      // Se o produto foi desativado ou deletado, redirecionar para catálogo
      if (!produtoAtualizado.ativo || produtoAtualizado.deleted_at) {
        window.location.href = backUrl
        return
      }

      // Atualizar produto
      setProduto(produtoAtualizado)
    }
  }, [slug, backUrl])

  const handleProdutoDelete = useCallback((id: string) => {
    if (produto?.id === id) {
      // Produto foi deletado, redirecionar para catálogo
      window.location.href = backUrl
    }
  }, [produto?.id, backUrl])

  // Realtime: callback para atualizar taxas quando mudar no admin
  const handleTaxasUpdate = useCallback((config: { ativo: boolean; taxas: TaxasConfig }) => {
    console.log('[ProdutoPage] Taxas atualizadas via realtime:', config)
    setCalculadoraAtiva(config.ativo)
    setTaxas(config.taxas)
  }, [])

  // Ativar realtime para produtos
  useRealtimeProdutos({
    enabled: true,
    onUpdate: handleProdutoUpdate,
    onDelete: handleProdutoDelete,
  })

  // Ativar realtime para taxas
  useRealtimeTaxas({
    enabled: true,
    onUpdate: handleTaxasUpdate,
  })

  useEffect(() => {
    async function loadProduto() {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          categoria:categorias(id, nome, slug)
        `)
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
        console.warn('Não foi possível contabilizar a visualização do produto:', incrementError)
      }

      // Preload apenas da primeira imagem (foto principal)
      // Deixar o Next.js gerenciar o resto para melhor performance
      if (produtoData.fotos && produtoData.fotos.length > 0) {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = produtoData.fotos[0]
        document.head.appendChild(link)
      }

      // Buscar configuração da calculadora de parcelas
      try {
        const { data: configData } = await supabase
          .from('configuracoes_taxas')
          .select('ativo, taxas')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (configData && configData.ativo) {
          setCalculadoraAtiva(true)
          setTaxas(configData.taxas as TaxasConfig)
        }
      } catch (error) {
        console.warn('Não foi possível carregar configuração de taxas:', error)
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

  const whatsappMessage = encodeURIComponent(
    `Olá! Tenho interesse no ${produto.nome} (${formatPreco(produto.preco)})`
  )

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: produto.nome,
          text: `Confira: ${produto.nome} - ${formatPreco(produto.preco)}`,
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed', error)
      }
    }
  }

  const showShareButton = typeof navigator !== 'undefined' && navigator.share

  return (
    <div className="container mx-auto px-4 py-8">
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
        {/* Imagem */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
            {produto.fotos[fotoSelecionada] ? (
              <Image
                key={fotoSelecionada}
                src={produto.fotos[fotoSelecionada]}
                alt={produto.nome}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-opacity duration-200"
                priority={fotoSelecionada === 0}
                quality={75}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-700">
                Sem imagem disponível
              </div>
            )}
          </div>

          {/* Galeria de Fotos */}
          {produto.fotos.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {produto.fotos.map((foto, index) => (
                <button
                  key={index}
                  onClick={() => setFotoSelecionada(index)}
                  className={`relative aspect-square overflow-hidden rounded border-2 bg-zinc-950 transition-all ${
                    fotoSelecionada === index
                      ? 'border-yellow-500 ring-2 ring-yellow-500/50'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <Image
                    src={foto}
                    alt={`${produto.nome} - Foto ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 25vw, (max-width: 1024px) 20vw, 150px"
                    className="object-cover"
                    loading={index < 4 ? 'eager' : 'lazy'}
                    quality={60}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div>
          {/* Badges */}
          <div className="mb-4 flex flex-wrap gap-2">
            {produto.condicao === 'novo' && (
              <Badge className="bg-green-600 text-white">Novo</Badge>
            )}
            {produto.condicao === 'seminovo' && (
              <Badge className="bg-amber-600 text-white">Seminovo</Badge>
            )}
            {produto.garantia !== 'nenhuma' && (
              <Badge className="bg-purple-600 text-white">Com Garantia</Badge>
            )}
            {produto.estoque > 0 && (
              <Badge className="bg-zinc-700 text-white">Em Estoque</Badge>
            )}
          </div>

          {/* Título e Código */}
          <h1 className="mb-2 text-3xl font-bold text-white">{produto.nome}</h1>
          {produto.codigo_produto && (
            <p className="mb-4 text-sm text-zinc-500">
              Código: {produto.codigo_produto}
            </p>
          )}

          {/* Categoria */}
          {produto.categoria && (
            <p className="mb-4 text-zinc-400">{produto.categoria.nome}</p>
          )}

          {/* Preço */}
          <div className="mb-6">
            <p className="text-4xl font-bold" style={{ color: 'var(--brand-yellow)' }}>
              {formatPreco(produto.preco)}
            </p>
          </div>

          {/* Calculadora de Parcelas */}
          {calculadoraAtiva && taxas && (
            <div className="mb-6">
              <CalculadoraParcelas preco={produto.preco} taxas={taxas} />
            </div>
          )}

          {/* Descrição */}
          {produto.descricao && (
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold text-white">Descrição</h2>
              <p className="text-zinc-400 whitespace-pre-line">{produto.descricao}</p>
            </div>
          )}

          {/* Especificações */}
          <Card className="mb-6 border-zinc-800 bg-zinc-900">
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                Especificações
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Condição:</span>
                  <span className="font-medium text-white capitalize">
                    {produto.condicao}
                  </span>
                </div>
                {produto.nivel_bateria && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Bateria:</span>
                    <span className="font-medium text-white">
                      {produto.nivel_bateria}%
                    </span>
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
              <h2 className="mb-4 text-xl font-semibold text-white">
                Acessórios Inclusos
              </h2>
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
          <WhatsAppContactButton
            size="lg"
            className="w-full bg-[var(--brand-yellow)] text-[var(--brand-black)] hover:bg-[var(--brand-yellow)]/90"
            message={whatsappMessage}
            label="Comprar pelo WhatsApp"
          />
        </div>
      </div>
    </div>
  )
}

export default function ProdutoPage({ params }: ProdutoPageProps) {
  const { slug } = use(params)
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto h-8 w-8 animate-pulse">
            <div className="h-full w-full rounded-full border-4 border-zinc-700 opacity-40 brightness-150 grayscale" />
          </div>
          <p className="mt-4 text-sm text-zinc-400">Carregando produto...</p>
        </div>
      </div>
    </div>}>
      <ProdutoPageContent slug={slug} />
    </Suspense>
  )
}
