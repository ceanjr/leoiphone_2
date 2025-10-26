'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProdutosDestaque } from './produtos-destaque'

interface Banner {
  id: string
  titulo: string
  subtitulo: string | null
  link: string | null
  imagem_url: string
  ordem: number
  tipo: 'banner' | 'produtos_destaque'
  produtos_destaque: Array<{ produto_id: string; preco_promocional: number }>
}

interface Produto {
  id: string
  nome: string
  slug: string
  codigo_produto: string
  preco: number
  foto_principal: string
  condicao: string
}

export function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [produtosPorBanner, setProdutosPorBanner] = useState<
    Record<string, Array<Produto & { preco_promocional: number }>>
  >({})

  useEffect(() => {
    loadBanners()
  }, [])

  async function loadBanners() {
    const supabase = createClient()
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (data && data.length > 0) {
      setBanners(data)

      // Carregar produtos para banners do tipo produtos_destaque
      const produtosMap: Record<string, Array<Produto & { preco_promocional: number }>> = {}

      for (const banner of data) {
        if (banner.tipo === 'produtos_destaque' && banner.produtos_destaque?.length > 0) {
          const produtoIds = banner.produtos_destaque.map((p: any) => p.produto_id)
          const { data: produtos } = await supabase
            .from('produtos')
            .select('id, nome, slug, codigo_produto, preco, foto_principal, condicao')
            .in('id', produtoIds)
            .is('deleted_at', null)

          if (produtos) {
            produtosMap[banner.id] = produtos.map((p) => {
              const produtoDestaque = banner.produtos_destaque.find(
                (pd: any) => pd.produto_id === p.id
              )
              return {
                ...p,
                preco_promocional: produtoDestaque?.preco_promocional || p.preco,
              }
            })
          }
        }
      }

      setProdutosPorBanner(produtosMap)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000) // Muda a cada 5 segundos

    return () => clearInterval(interval)
  }, [banners.length])

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  if (loading || banners.length === 0) {
    return null
  }

  const currentBanner = banners[currentIndex]

  // Renderizar produtos em destaque
  if (currentBanner.tipo === 'produtos_destaque') {
    const produtos = produtosPorBanner[currentBanner.id] || []

    return (
      <div className="relative mb-8">
        <ProdutosDestaque
          titulo={currentBanner.titulo}
          subtitulo={currentBanner.subtitulo || undefined}
          produtos={produtos}
        />

        {banners.length > 1 && (
          <>
            {/* Botões de navegação */}
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 md:left-4"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 md:right-4"
              aria-label="Próximo banner"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Indicadores */}
            <div className="absolute -bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-[var(--brand-yellow)]'
                      : 'bg-zinc-600 hover:bg-zinc-500'
                  }`}
                  aria-label={`Ir para banner ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // Renderizar banner de imagem (apenas se tiver imagem_url)
  if (!currentBanner.imagem_url) {
    return null
  }

  const BannerContent = (
    <div className="relative h-[300px] w-full overflow-hidden rounded-lg bg-zinc-900 md:h-[400px] lg:h-[500px]">
      <Image
        src={currentBanner.imagem_url}
        alt={currentBanner.titulo}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-8 lg:p-12">
        <h2 className="mb-2 text-2xl font-bold md:text-3xl lg:text-4xl">
          {currentBanner.titulo}
        </h2>
        {currentBanner.subtitulo && (
          <p className="text-sm text-zinc-200 md:text-base lg:text-lg">
            {currentBanner.subtitulo}
          </p>
        )}
      </div>
    </div>
  )

  return (
    <div className="relative mb-8">
      {currentBanner.link ? (
        <Link href={currentBanner.link}>{BannerContent}</Link>
      ) : (
        BannerContent
      )}

      {banners.length > 1 && (
        <>
          {/* Botões de navegação */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            aria-label="Próximo banner"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-white'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Ir para banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
