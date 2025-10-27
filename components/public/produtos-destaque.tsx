'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ProdutoDestaque {
  id: string
  nome: string
  slug: string
  codigo_produto: string
  preco: number
  preco_promocional: number
  foto_principal: string
  condicao: string
}

interface ProdutosDestaqueProps {
  titulo: string
  subtitulo?: string
  produtos: ProdutoDestaque[]
}

export function ProdutosDestaque({ titulo, subtitulo, produtos }: ProdutosDestaqueProps) {
  if (produtos.length === 0) return null

  return (
    <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Flame className="h-6 w-6 animate-pulse text-orange-500" />
        <div>
          <h2 className="text-xl font-bold text-white md:text-2xl">{titulo}</h2>
          {subtitulo && <p className="text-sm text-zinc-400">{subtitulo}</p>}
        </div>
      </div>

      {/* Grid de Produtos - Scroll horizontal no mobile */}
      <div className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
        {produtos.map((produto) => {
          const desconto = Math.round(
            ((produto.preco - produto.preco_promocional) / produto.preco) * 100
          )

          return (
            <Link
              key={produto.id}
              href={`/produto/${produto.slug}`}
              className="group min-w-[240px] flex-shrink-0 rounded-lg border border-zinc-800 bg-zinc-950 p-3 transition-all hover:border-[var(--brand-yellow)] hover:shadow-lg hover:shadow-[var(--brand-yellow)]/10 md:min-w-0 md:p-4"
            >
              {/* Badge de Desconto */}
              {desconto > 0 && (
                <div className="mb-2 flex items-center justify-center gap-1.5 rounded-md bg-orange-600/20 px-2 py-1 text-orange-500">
                  <Flame className="h-4 w-4 animate-pulse" />
                  <span className="text-xs font-bold">-{desconto}% OFF</span>
                </div>
              )}

              {/* Imagem do Produto */}
              <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-zinc-900">
                <Image
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
                    <span className="text-zinc-500">Código:</span>
                    <span className="font-mono text-zinc-400">{produto.codigo_produto}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500">Condição:</span>
                  {produto.condicao.toLowerCase() === 'novo' ? (
                    <Badge className="bg-green-600 text-white hover:bg-green-700 text-xs px-2 py-0">
                      Novo
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-600 text-white hover:bg-amber-700 text-xs px-2 py-0">
                      Seminovo
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
