'use client'

import { memo } from 'react'
import { OptimizedImage } from '@/components/shared/optimized-image'
import Link from 'next/link'
import { Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CountdownTimer } from '@/components/ui/countdown-timer'
import { autoDisableBannerOnExpire } from '@/app/admin/banners/actions'
import { logger } from '@/lib/utils/logger'

interface ProdutoDestaque {
  id: string
  nome: string
  slug: string
  codigo_produto: string
  preco: number
  preco_promocional: number
  foto_principal: string
  condicao: string
  nivel_bateria: number | null
  cores: string[] | null
  garantia: string | null
}

interface ProdutosDestaqueProps {
  titulo: string
  subtitulo?: string
  produtos: ProdutoDestaque[]
  bannerId: string
  countdownEndsAt?: string | null
}

function ProdutosDestaqueComponent({
  titulo,
  subtitulo,
  produtos,
  bannerId,
  countdownEndsAt,
}: ProdutosDestaqueProps) {
  // Desativar banner quando countdown expirar
  const handleCountdownExpire = async () => {
    try {
      logger.info(`[ProdutosDestaque] Countdown expirou para banner ${bannerId}, desativando...`)
      const result = await autoDisableBannerOnExpire(bannerId)
      if (result.success) {
        logger.info(`[ProdutosDestaque] Banner ${bannerId} desativado com sucesso`)
      } else {
        logger.error(`[ProdutosDestaque] Erro ao desativar banner: ${result.error}`)
      }
    } catch (error) {
      logger.error('[ProdutosDestaque] Exceção ao desativar banner:', error)
    }
  }

  return (
    <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center justify-center gap-1 sm:items-start">
            <div className="flex items-center justify-center gap-2">
              <Flame className="h-8 w-8 animate-pulse text-orange-500" />
              <h2 className="text-2xl font-bold text-white md:text-3xl">{titulo}</h2>
            </div>
            {subtitulo && <p className="px-8 text-sm text-zinc-400">{subtitulo}</p>}
          </div>
          {countdownEndsAt && (
            <CountdownTimer endDate={countdownEndsAt} onExpire={handleCountdownExpire} />
          )}
        </div>
      </div>

      {/* Grid de Produtos */}
      {produtos.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30 p-8 text-center">
          <div className="rounded-full bg-zinc-800/50 p-4">
            <Flame className="h-8 w-8 text-zinc-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-zinc-300">Produtos Esgotados</h3>
            <p className="text-sm text-zinc-500">
              Todos os produtos em oferta dessa semana esgotaram
            </p>
          </div>
        </div>
      ) : (
        <div className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
          {produtos.map((produto) => {
            const desconto = Math.round(
              ((produto.preco - produto.preco_promocional) / produto.preco) * 100
            )

            return (
              <Link
                key={produto.id}
                href={`/produto/${produto.slug}?preco_promo=${produto.preco_promocional}`}
                className="group min-w-[240px] flex-shrink-0 rounded-lg border border-zinc-800 bg-zinc-950 p-3 transition-all hover:border-[var(--brand-yellow)] hover:shadow-[var(--brand-yellow)]/10 hover:shadow-lg md:min-w-0 md:p-4"
              >
                {/* Badge de Desconto */}
                {desconto > 0 && (
                  <div className="mb-2 flex items-center justify-center gap-1.5 rounded-md bg-orange-600/20 px-2 py-1">
                    <Flame className="h-4 w-4 animate-pulse text-orange-500" />
                    <span className="w-full text-center text-xs font-bold text-orange-500">
                      -{desconto}% OFF
                    </span>
                  </div>
                )}

                {/* Imagem do Produto */}
                <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-zinc-900">
                  <OptimizedImage
                    src={produto.foto_principal}
                    alt={produto.nome}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 280px, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>

                {/* Informações do Produto */}
                <div className="space-y-2">
                  <h3 className="line-clamp-2 text-sm font-medium text-white group-hover:text-[var(--brand-yellow)]">
                    {produto.nome}
                  </h3>

                  {produto.codigo_produto && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[10px] text-zinc-500">Código:</span>
                      <span className="font-mono text-zinc-400">{produto.codigo_produto}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {produto.condicao === 'novo' && (
                      <Badge className="bg-green-600 px-1.5 py-0.5 text-[10px] text-white">
                        Novo
                      </Badge>
                    )}
                    {produto.condicao === 'seminovo' && (
                      <Badge className="bg-amber-600 px-1.5 py-0.5 text-[10px] text-white">
                        Seminovo
                      </Badge>
                    )}
                    {produto.garantia !== 'nenhuma' && (
                      <Badge className="bg-purple-600 px-1.5 py-0.5 text-[10px] text-white">
                        Com Garantia
                      </Badge>
                    )}
                  </div>

                  {/* Preços */}
                  <div className="border-t border-zinc-800 pt-2">
                    {produto.preco_promocional < produto.preco ? (
                      <div className="space-y-1">
                        <div className="text-xs text-zinc-500 line-through">
                          R$ {produto.preco.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Flame className="h-5 w-5 animate-pulse text-orange-500" />
                          <div className="text-2xl font-bold text-[var(--brand-yellow)]">
                            R$ {produto.preco_promocional.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-[var(--brand-yellow)]">
                        R$ {produto.preco_promocional.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

export const ProdutosDestaque = memo(ProdutosDestaqueComponent)
