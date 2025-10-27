'use client'

import { use, useState } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { WhatsAppContactButton } from '@/components/shared/whatsapp-contact-button'
import { createClient } from '@/lib/supabase/client'
import type { ProdutoComCategoria } from '@/types/produto'
import { useEffect } from 'react'

interface ProdutoPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function ProdutoPage({ params }: ProdutoPageProps) {
  const { slug } = use(params)
  const [produto, setProduto] = useState<ProdutoComCategoria | null>(null)
  const [loading, setLoading] = useState(true)
  const [fotoSelecionada, setFotoSelecionada] = useState(0)

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

      setProduto(data as ProdutoComCategoria)
      setLoading(false)

      // Incrementar visualizações apenas para visitantes
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          await supabase.rpc('increment_visualizacoes', { produto_id: data.id })
        }
      } catch (incrementError) {
        console.warn('Não foi possível contabilizar a visualização do produto:', incrementError)
      }

      // Pré-carregar todas as imagens do produto
      if (data.fotos && data.fotos.length > 0) {
        data.fotos.forEach((foto: string) => {
          const img = new window.Image()
          img.src = foto
        })
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/" className="hover:text-white">
          Início
        </Link>
        <span>/</span>
        <span className="text-white">{produto.nome}</span>
      </div>

      {/* Botão Voltar */}
      <Link href="/" className="mb-6 inline-flex items-center text-zinc-400 hover:text-white">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para início
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
                loading="eager"
                quality={85}
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
                    sizes="25vw"
                    className="object-cover"
                    loading="eager"
                    quality={70}
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
          >
            Comprar pelo WhatsApp
          </WhatsAppContactButton>
        </div>
      </div>
    </div>
  )
}
