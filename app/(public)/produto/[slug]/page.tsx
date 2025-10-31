import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProdutoPageClient } from './produto-page-client'

interface ProdutoPageProps {
  params: Promise<{
    slug: string
  }>
}

// Gerar metadata dinâmica para SEO e compartilhamento
export async function generateMetadata({ params }: ProdutoPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

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
    return {
      title: 'Produto não encontrado - Léo iPhone',
    }
  }

  const produto = data as any

  const formatPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco)
  }

  const titulo = `${produto.nome} - ${formatPreco(produto.preco)} | Léo iPhone`
  const descricao = produto.descricao
    ? `${produto.descricao.substring(0, 150)}...`
    : `${produto.nome} por ${formatPreco(produto.preco)}. ${produto.condicao === 'novo' ? 'Produto novo' : 'Seminovo em excelente estado'}. Entre em contato!`

  const imagemUrl = produto.foto_principal || produto.fotos?.[0] || 'https://aswejqbtejibrilrblnm.supabase.co/storage/v1/object/public/produtos/default-product.jpg'

  return {
    title: titulo,
    description: descricao,
    openGraph: {
      title: titulo,
      description: descricao,
      type: 'website',
      locale: 'pt_BR',
      url: `https://www.leoiphone.com.br/produto/${slug}`,
      siteName: 'Léo iPhone',
      images: [
        {
          url: imagemUrl,
          width: 1200,
          height: 1200,
          alt: produto.nome,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description: descricao,
      images: [imagemUrl],
    },
  }
}

export default async function ProdutoPage({ params }: ProdutoPageProps) {
  const { slug } = await params
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
      <ProdutoPageClient slug={slug} />
    </Suspense>
  )
}
