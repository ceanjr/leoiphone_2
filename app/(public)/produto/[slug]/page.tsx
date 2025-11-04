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

  // Título otimizado para SEO
  const titulo = `${produto.nome} - ${formatPreco(produto.preco)}${produto.nivel_bateria ? ` - Bateria ${produto.nivel_bateria}%` : ''} | Léo iPhone`
  
  // Descrição rica com palavras-chave
  const descricaoBase = produto.descricao || `${produto.nome} ${produto.condicao === 'novo' ? 'novo' : 'seminovo'} em excelente estado.`
  const detalhes = [
    produto.condicao === 'novo' ? 'Produto novo' : 'Seminovo',
    produto.nivel_bateria ? `Bateria ${produto.nivel_bateria}%` : null,
    produto.garantia !== 'nenhuma' ? 'Com garantia' : null,
    `Por ${formatPreco(produto.preco)}`,
  ].filter(Boolean).join(' • ')
  
  const descricao = `${descricaoBase.substring(0, 120)}. ${detalhes}`

  const imagemUrl = produto.foto_principal || produto.fotos?.[0] || 'https://aswejqbtejibrilrblnm.supabase.co/storage/v1/object/public/produtos/default-product.jpg'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.leoiphone.com.br'
  
  // Keywords para SEO
  const keywords = [
    produto.nome,
    'iPhone',
    produto.condicao,
    produto.categoria?.nome,
    'Léo iPhone',
    'iPhone seminovo',
    'iPhone novo',
    'iPhone ' + (produto.condicao === 'novo' ? 'lacrado' : 'usado'),
    produto.nivel_bateria ? `bateria ${produto.nivel_bateria}%` : null,
  ].filter(Boolean)

  return {
    title: titulo,
    description: descricao,
    keywords: keywords.join(', '),
    authors: [{ name: 'Léo iPhone' }],
    creator: 'Léo iPhone',
    publisher: 'Léo iPhone',
    alternates: {
      canonical: `${siteUrl}/produto/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
    openGraph: {
      title: produto.nome,
      description: descricao,
      type: 'website', // OpenGraph doesn't have 'product' type in Next.js, use 'website'
      locale: 'pt_BR',
      url: `${siteUrl}/produto/${slug}`,
      siteName: 'Léo iPhone',
      images: [
        {
          url: imagemUrl,
          width: 1200,
          height: 1200,
          alt: produto.nome,
          type: 'image/jpeg',
        },
        ...(produto.fotos || []).slice(1, 4).map((foto: string) => ({
          url: foto,
          width: 1200,
          height: 1200,
          alt: `${produto.nome} - Foto adicional`,
          type: 'image/jpeg',
        })),
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: produto.nome,
      description: descricao,
      images: [imagemUrl],
      creator: '@leoiphone',
      site: '@leoiphone',
    },
    other: {
      'product:price:amount': produto.preco.toString(),
      'product:price:currency': 'BRL',
      'product:condition': produto.condicao === 'novo' ? 'new' : 'refurbished',
      'product:availability': 'in stock',
      'product:brand': 'Apple',
      'product:category': produto.categoria?.nome || 'Smartphones',
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
