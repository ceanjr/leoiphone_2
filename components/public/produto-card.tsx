import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { Produto } from '@/types/produto'
import { getCorOficial, getContrastColor } from '@/lib/iphone-cores'
import { memo } from 'react'

interface ProdutoCardProps {
  produto: Produto
  view?: 'grid' | 'list'
  priority?: boolean
}

const formatPreco = (preco: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(preco)
}

// Componente de ícone de bateria minimalista e moderno com pauzinhos
const BatteryIcon = ({ level }: { level: number }) => {
  // Determinar cor e quantidade de pauzinhos baseado no nível
  const getBatteryState = () => {
    if (level >= 80) {
      return {
        color: '#22c55e', // verde neon vibrante
        bars: 4
      }
    } else if (level >= 70) {
      return {
        color: '#facc15', // amarelo neon vibrante
        bars: 3
      }
    } else {
      return {
        color: '#ef4444', // vermelho neon vibrante
        bars: 2
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
      {/* Corpo da bateria */}
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
      {/* Ponta da bateria */}
      <rect
        x="17"
        y="3.5"
        width="2.5"
        height="5"
        rx="1"
        fill="white"
      />
      {/* Pauzinhos de carga */}
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
}

function ProdutoCardComponent({ produto, view = 'grid', priority = false }: ProdutoCardProps) {
  const cor = produto.cor_oficial
    ? getCorOficial(produto.nome, produto.cor_oficial)
    : null

  if (view === 'list') {
    return (
      <Link href={`/produto/${produto.slug}`}>
        <div className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-all hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20">
          <div className="flex flex-row">
            {/* Imagem - Oculta em mobile, visível em desktop */}
            <div className="relative h-28 w-28 overflow-hidden bg-zinc-950 flex-shrink-0 hidden sm:block">
              {produto.foto_principal ? (
                <Image
                  src={produto.foto_principal}
                  alt={produto.nome}
                  fill
                  sizes="112px"
                  className="object-cover transition-transform group-hover:scale-105"
                  loading={priority ? 'eager' : 'lazy'}
                  quality={75}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-700 text-xs">
                  Sem imagem
                </div>
              )}
            </div>

            {/* Conteúdo */}
            <div className="flex flex-1 flex-row items-center justify-between gap-3 p-3 sm:p-4">
              {/* Nome, Descrição e Informações */}
              <div className="flex-1 min-w-0">
                <h3 className="mb-1 line-clamp-1 text-base sm:text-lg font-semibold text-white">
                  {produto.nome}
                </h3>

                {/* Descrição */}
                {produto.descricao && (
                  <p className="mb-2 line-clamp-1 text-xs sm:text-sm text-zinc-400">
                    {produto.descricao}
                  </p>
                )}

                {/* Badges e Informações */}
                <div className="flex flex-wrap items-center gap-2">
                  {produto.condicao === 'novo' && produto.nivel_bateria == null && (
                    <Badge className="bg-green-600 text-white hover:bg-green-700 text-xs px-2 py-0">
                      Novo
                    </Badge>
                  )}
                  {produto.condicao === 'seminovo' && produto.nivel_bateria == null && (
                    <Badge className="bg-amber-600 text-white hover:bg-amber-700 text-xs px-2 py-0">
                      Seminovo
                    </Badge>
                  )}
                  {produto.garantia !== 'nenhuma' && (
                    <Badge className="bg-purple-600 text-white hover:bg-purple-700 text-xs px-2 py-0">
                      Garantia
                    </Badge>
                  )}
                  {produto.nivel_bateria && (
                    <Badge className="bg-zinc-700 text-white hover:bg-zinc-600 text-xs px-2 py-0.5 flex items-center gap-1.5">
                      <BatteryIcon level={produto.nivel_bateria} />
                      <span>{produto.nivel_bateria}%</span>
                    </Badge>
                  )}
                  {cor && (
                    <Badge
                      className="text-xs px-2 py-0.5"
                      style={{
                        backgroundColor: cor.hex,
                        color: getContrastColor(cor.hex),
                      }}
                    >
                      {cor.nome}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Preço */}
              <div className="flex-shrink-0 flex items-center">
                <p className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
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
    <Link href={`/produto/${produto.slug}`}>
      <div className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-all hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20">
        {/* Imagem */}
        <div className="relative aspect-square overflow-hidden bg-zinc-950">
          {produto.foto_principal ? (
            <Image
              src={produto.foto_principal}
              alt={produto.nome}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 292px"
              className="object-cover transition-transform group-hover:scale-105"
              loading={priority ? 'eager' : 'lazy'}
              quality={75}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-700">
              Sem imagem
            </div>
          )}

          {/* Badges (top-left) */}
          <div className="absolute left-2 top-2 flex flex-col gap-1.5">
            {cor && (
              <Badge
                className="text-xs px-2 py-0.5  w-fit"
                style={{
                  backgroundColor: cor.hex,
                  color: getContrastColor(cor.hex),
                }}
              >
                {cor.nome}
              </Badge>
            )}
            {produto.nivel_bateria && (
              <Badge className="bg-zinc-700 text-white hover:bg-zinc-600 text-xs flex items-center gap-1.5 px-2 py-0.5 w-fit">
                <BatteryIcon level={produto.nivel_bateria} />
                <span>{produto.nivel_bateria}%</span>
              </Badge>
            )}
            {produto.condicao === 'novo' && produto.nivel_bateria == null && (
              <Badge className="bg-green-600 text-white hover:bg-green-700 text-xs px-2 py-0.5 w-fit">
                Novo
              </Badge>
            )}
            {produto.condicao === 'seminovo' && produto.nivel_bateria == null && (
              <Badge className="bg-amber-600 text-white hover:bg-amber-700 text-xs px-2 py-0.5 w-fit">
                Seminovo
              </Badge>
            )}
            {produto.garantia !== 'nenhuma' && (
              <Badge className="bg-purple-600 text-white hover:bg-purple-700 text-xs px-2 py-0.5 w-fit">
                Garantia
              </Badge>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4">
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-white">
            {produto.nome}
          </h3>

          {/* Descrição */}
          {produto.descricao && (
            <p className="mb-3 line-clamp-2 text-sm text-zinc-400">
              {produto.descricao}
            </p>
          )}

          {/* Preço */}
          <div>
            <p className="text-2xl font-bold text-white">
              {formatPreco(produto.preco)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export const ProdutoCard = memo(ProdutoCardComponent)
