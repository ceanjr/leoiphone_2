import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { Produto } from '@/types/produto'
import { getCorOficial, getContrastColor } from '@/lib/iphone-cores'
import { memo, useCallback } from 'react'

interface ProdutoCardProps {
  produto: Produto
  view?: 'grid' | 'list'
  priority?: boolean
  returnParams?: string // Query params para retornar ao catálogo
}

// Optimization: Memoize price formatting
const formatPreco = (preco: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(preco)
}

// Optimization: Lightweight battery icon component
const BatteryIcon = memo(({ level }: { level: number }) => {
  const getBatteryState = () => {
    if (level >= 80) {
      return {
        color: '#22c55e',
        bars: 4,
      }
    } else if (level >= 70) {
      return {
        color: '#facc15',
        bars: 3,
      }
    } else {
      return {
        color: '#ef4444',
        bars: 2,
      }
    }
  }

  const { color, bars } = getBatteryState()

  return (
    <svg
      width="20"
      height="12"
      viewBox="0 0 20 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block"
    >
      <rect
        x="0.5"
        y="0.5"
        width="16"
        height="11"
        rx="2"
        stroke="white"
        strokeWidth="1"
        fill="none"
      />
      <rect x="17" y="3.5" width="2.5" height="5" rx="1" fill="white" />
      {[...Array(4)].map((_, index) => (
        <rect
          key={index}
          x={2.5 + index * 3.5}
          y="3"
          width="2"
          height="6"
          rx="0.5"
          fill={index < bars ? color : 'rgba(255, 255, 255, 0.15)'}
        />
      ))}
    </svg>
  )
})

BatteryIcon.displayName = 'BatteryIcon'

function ProdutoCardComponent({
  produto,
  view = 'grid',
  priority = false,
  returnParams,
}: ProdutoCardProps) {
  // Prefetch de imagens ao fazer hover
  const handleMouseEnter = useCallback(() => {
    // Prefetch da foto principal e primeiras fotos da galeria
    if (produto.fotos && produto.fotos.length > 0) {
      // Preload das primeiras 3 imagens (principal + 2 da galeria)
      produto.fotos.slice(0, 3).forEach((fotoUrl) => {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.as = 'image'
        link.href = fotoUrl
        document.head.appendChild(link)
      })
    }
  }, [produto.fotos])

  // Obter cores do produto (novo array ou legado cor_oficial)
  const getCores = () => {
    // Debug detalhado
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ProdutoCard] Produto: ${produto.nome}`)
      console.log(`[ProdutoCard] - cores (array):`, produto.cores)
      console.log(`[ProdutoCard] - cor_oficial (legado):`, produto.cor_oficial)
    }

    // Priorizar array de cores (novo sistema)
    if (produto.cores && produto.cores.length > 0) {
      const coresMapeadas = produto.cores
        .map((corNome) => {
          const cor = getCorOficial(produto.nome, corNome)
          // Debug: ver se a cor está sendo mapeada corretamente
          if (process.env.NODE_ENV === 'development') {
            if (cor) {
              console.log(`[ProdutoCard] - Cor mapeada: "${corNome}" → ${cor.nome} (${cor.hex})`)
            } else {
              console.log(`[ProdutoCard] - ❌ Cor NÃO mapeada: "${corNome}"`)
            }
          }
          return cor
        })
        .filter((cor) => cor !== null)

      return coresMapeadas
    }

    // Fallback para cor_oficial (produtos antigos)
    if (produto.cor_oficial) {
      const cor = getCorOficial(produto.nome, produto.cor_oficial)
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[ProdutoCard] - Usando cor_oficial legado: "${produto.cor_oficial}" → ${cor?.nome || 'não mapeada'}`
        )
      }
      return cor ? [cor] : []
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[ProdutoCard] - Nenhuma cor encontrada`)
    }

    return []
  }

  const cores = getCores()

  const productUrl = returnParams
    ? `/produto/${produto.slug}?return=${encodeURIComponent(returnParams)}`
    : `/produto/${produto.slug}`

  if (view === 'list') {
    return (
      <Link href={productUrl} prefetch={true}>
        <div
          className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-yellow)] hover:shadow-[var(--brand-yellow)]/20 hover:shadow-xl active:scale-[0.98]"
          onMouseEnter={handleMouseEnter}
        >
          <div className="flex flex-row">
            {/* Optimization: Fixed dimensions to prevent CLS */}
            <div className="relative hidden h-28 w-28 flex-shrink-0 overflow-hidden bg-zinc-950 sm:block">
              {produto.foto_principal ? (
                <Image
                  src={produto.foto_principal}
                  alt={produto.nome}
                  fill
                  sizes="112px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  loading={priority ? 'eager' : 'lazy'}
                  quality={85}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-700">
                  Sem imagem
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-row items-center justify-between gap-3 p-3 sm:p-4">
              <div className="min-w-0 flex-1">
                <h3 className="mb-1 line-clamp-1 text-base font-semibold text-white transition-colors group-hover:text-[var(--brand-yellow)] sm:text-lg">
                  {produto.nome}
                </h3>

                {produto.descricao && (
                  <p className="mb-2 line-clamp-1 text-xs text-zinc-400 sm:text-sm">
                    {produto.descricao}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {produto.condicao === 'novo' && produto.nivel_bateria == null && (
                    <Badge className="bg-green-600 px-2 py-0 text-xs text-white hover:bg-green-700">
                      Novo
                    </Badge>
                  )}
                  {produto.condicao === 'seminovo' && produto.nivel_bateria == null && (
                    <Badge className="bg-amber-600 px-2 py-0 text-xs text-white hover:bg-amber-700">
                      Seminovo
                    </Badge>
                  )}
                  {produto.nivel_bateria && (
                    <Badge className="flex items-center gap-1.5 bg-zinc-700 px-2 py-0.5 text-xs text-white hover:bg-zinc-600">
                      <BatteryIcon level={produto.nivel_bateria} />
                      <span>{produto.nivel_bateria}%</span>
                    </Badge>
                  )}
                  {cores.map((cor, index) => (
                    <Badge
                      key={index}
                      className="px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: cor.hex,
                        color: getContrastColor(cor.hex),
                      }}
                    >
                      {cor.nome}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center">
                <p className="text-lg font-bold whitespace-nowrap text-[var(--brand-yellow)] sm:text-xl">
                  {formatPreco(produto.preco)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={productUrl} prefetch={true}>
      <div
        className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-yellow)] hover:shadow-[var(--brand-yellow)]/20 hover:shadow-xl active:scale-[0.98]"
        onMouseEnter={handleMouseEnter}
      >
        {/* Optimization: aspect-square maintains proper spacing, preventing CLS */}
        <div className="relative aspect-square overflow-hidden bg-zinc-950">
          {produto.foto_principal ? (
            <Image
              src={produto.foto_principal}
              alt={produto.nome}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 292px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              loading={priority ? 'eager' : 'lazy'}
              quality={85}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-700">Sem imagem</div>
          )}

          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {cores.map((cor, index) => (
              <Badge
                key={index}
                className="w-fit px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: cor.hex,
                  color: getContrastColor(cor.hex),
                }}
              >
                {cor.nome}
              </Badge>
            ))}
            {produto.nivel_bateria && (
              <Badge className="flex w-fit items-center gap-1.5 bg-zinc-700 px-2 py-0.5 text-xs text-white hover:bg-zinc-600">
                <BatteryIcon level={produto.nivel_bateria} />
                <span>{produto.nivel_bateria}%</span>
              </Badge>
            )}
            {produto.condicao === 'novo' && produto.nivel_bateria == null && (
              <Badge className="w-fit bg-green-600 px-2 py-0.5 text-xs text-white hover:bg-green-700">
                Novo
              </Badge>
            )}
            {produto.condicao === 'seminovo' && produto.nivel_bateria == null && (
              <Badge className="w-fit bg-amber-600 px-2 py-0.5 text-xs text-white hover:bg-amber-700">
                Seminovo
              </Badge>
            )}
          </div>
        </div>

        <div className="p-4">
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-white transition-colors group-hover:text-[var(--brand-yellow)]">
            {produto.nome}
          </h3>

          {produto.descricao && (
            <p className="mb-3 line-clamp-2 text-sm text-zinc-400">{produto.descricao}</p>
          )}

          <div>
            <p className="text-2xl font-bold text-[var(--brand-yellow)]">
              {formatPreco(produto.preco)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export const ProdutoCard = memo(ProdutoCardComponent)
