import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { Produto, ProdutoCusto } from '@/types/produto'
import { getCorOficial, getContrastColor } from '@/lib/data/iphone-cores'
import { memo, useCallback } from 'react'
import { CustosTableDialog } from '@/components/shared/custos-table-dialog'
import { BatteryIcon } from '@/components/shared/battery-icon'
import { logger } from '@/lib/utils/logger'

interface ProdutoCardProps {
  produto: Produto
  view?: 'grid' | 'list'
  priority?: boolean
  returnParams?: string // Query params para retornar ao catálogo
  custos?: ProdutoCusto[] // Custos do produto (apenas se usuário autenticado)
  isAuthenticated?: boolean // Se o usuário está autenticado
}

// Optimization: Memoize price formatting
const formatPreco = (preco: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(preco)
}

function ProdutoCardComponent({
  produto,
  view = 'grid',
  priority = false,
  returnParams,
  custos,
  isAuthenticated = false,
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
      logger.debug(`[ProdutoCard] Produto: ${produto.nome}`)
      logger.debug(`[ProdutoCard] - cores (array):`, produto.cores)
      logger.debug(`[ProdutoCard] - cor_oficial (legado):`, produto.cor_oficial)
    }

    // Priorizar array de cores (novo sistema)
    if (produto.cores && produto.cores.length > 0) {
      const coresMapeadas = produto.cores
        .map((corNome) => {
          const cor = getCorOficial(produto.nome, corNome)
          // Debug: ver se a cor está sendo mapeada corretamente
          if (process.env.NODE_ENV === 'development') {
            if (cor) {
              logger.debug(`[ProdutoCard] - Cor mapeada: "${corNome}" → ${cor.nome} (${cor.hex})`)
            } else {
              logger.debug(`[ProdutoCard] - ❌ Cor NÃO mapeada: "${corNome}"`)
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
        logger.debug(
          `[ProdutoCard] - Usando cor_oficial legado: "${produto.cor_oficial}" → ${cor?.nome || 'não mapeada'}`
        )
      }
      return cor ? [cor] : []
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[ProdutoCard] - Nenhuma cor encontrada`)
    }

    return []
  }

  const cores = getCores()

  const productUrl = returnParams
    ? `/produto/${produto.slug}?return=${encodeURIComponent(returnParams)}`
    : `/produto/${produto.slug}`

  if (view === 'list') {
    return (
      <div className="relative">
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
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-700">
                    Sem imagem
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-row items-center justify-between gap-3 p-3 sm:p-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start gap-2">
                    <h3 className="text-base font-semibold text-white transition-colors group-hover:text-[var(--brand-yellow)] sm:text-lg">
                      {produto.nome}
                    </h3>
                    {produto.codigo_produto && (
                      <span className="absolute top-0 right-0 flex-shrink-0 px-3 pt-1 text-[11px] text-zinc-500">
                        ({produto.codigo_produto})
                      </span>
                    )}
                  </div>

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

                <div className="flex flex-shrink-0 flex-col items-end gap-1">
                  <p className="text-lg font-bold whitespace-nowrap text-[var(--brand-yellow)] sm:text-xl">
                    {formatPreco(produto.preco)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Link>
        {isAuthenticated && custos && custos.length > 0 && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-end">
            <div className="pointer-events-auto w-full px-3 pb-3 sm:px-4 sm:pb-4">
              <div className="flex justify-end">
                <CustosTableDialog custos={custos} />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
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
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-700">
                Sem imagem
              </div>
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
            <div className="mb-2 flex items-start gap-2">
              <h3 className="line-clamp-2 flex-1 text-lg font-semibold text-white transition-colors group-hover:text-[var(--brand-yellow)]">
                {produto.nome}
              </h3>
              {produto.codigo_produto && (
                <span className="mt-0.5 flex-shrink-0 text-[10px] text-zinc-500">
                  {produto.codigo_produto}
                </span>
              )}
            </div>

            {produto.descricao && (
              <p className="mb-3 line-clamp-2 text-sm text-zinc-400">{produto.descricao}</p>
            )}

            <div className="space-y-1">
              <p className="text-2xl font-bold text-[var(--brand-yellow)]">
                {formatPreco(produto.preco)}
              </p>
            </div>
          </div>
        </div>
      </Link>
      {isAuthenticated && custos && custos.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
          <div className="pointer-events-auto px-4 pb-1">
            <CustosTableDialog custos={custos} />
          </div>
        </div>
      )}
    </div>
  )
}

export const ProdutoCard = memo(ProdutoCardComponent)
