'use client'

import { useState, useEffect, memo } from 'react'
import NextImage from 'next/image'
import Link from 'next/link'
import { Tag, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { logger } from '@/lib/utils/logger'
import type { ProdutoRelacionado } from '@/types/produto'
import { getDescontoColor } from '@/lib/utils/desconto-colors'

interface ProdutosRelacionadosProps {
  produtoId: string
  categoriaId: string
  produtosSelecionados?: string[] // IDs dos produtos já selecionados via URL
  onSelectionChange?: (selectedIds: string[]) => void
}

function ProdutosRelacionadosComponent({
  produtoId,
  categoriaId,
  produtosSelecionados = [],
  onSelectionChange,
}: ProdutosRelacionadosProps) {
  const [produtos, setProdutos] = useState<ProdutoRelacionado[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>(produtosSelecionados)

  useEffect(() => {
    async function loadProdutosRelacionados() {
      try {
        logger.info('[ProdutosRelacionados] Carregando...', { produtoId, categoriaId })

        const response = await fetch(
          `/api/produtos-relacionados?produtoId=${produtoId}&categoriaId=${categoriaId}`
        )

        if (!response.ok) {
          logger.error('[ProdutosRelacionados] Erro HTTP:', response.status)
          setLoading(false)
          return
        }

        const data = await response.json()
        logger.info('[ProdutosRelacionados] Produtos carregados:', data.produtos?.length || 0)
        setProdutos(data.produtos || [])
      } catch (error) {
        logger.error('[ProdutosRelacionados] Erro ao carregar:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProdutosRelacionados()
  }, [produtoId, categoriaId])

  useEffect(() => {
    setSelectedIds(produtosSelecionados)
  }, [produtosSelecionados])

  const handleCheckboxChange = (produtoRelacionadoId: string) => {
    setSelectedIds((prev) => {
      const newIds = prev.includes(produtoRelacionadoId)
        ? prev.filter((id) => id !== produtoRelacionadoId)
        : [...prev, produtoRelacionadoId]

      onSelectionChange?.(newIds)
      return newIds
    })
  }

  const formatPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco)
  }

  if (loading) {
    return (
      <div className="my-8">
        <h2 className="mb-4 text-2xl font-semibold text-white">Aproveite e Leve Junto</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-zinc-800 bg-zinc-900">
              <CardContent className="p-4">
                <div className="aspect-square w-full animate-pulse rounded bg-zinc-800" />
                <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (produtos.length === 0) {
    return null
  }

  return (
    <div className="my-8">
      <h2 className="mb-4 text-xl font-semibold text-white sm:text-2xl">Aproveite e Leve Junto</h2>
      <p className="mb-4 text-xs text-zinc-400 sm:text-sm">
        Selecione os produtos adicionais que você deseja com descontos exclusivos na compra desse
        produto.
      </p>

      {/* Layout Mobile - Lista Minimalista (clique no card marca checkbox) */}
      <div className="flex flex-col gap-3 sm:hidden">
        {produtos.map((produto) => {
          const isSelected = selectedIds.includes(produto.id)
          const descontoValor = produto.preco_original - produto.preco_com_desconto
          const descontoColors = getDescontoColor(produto.desconto_percentual)

          return (
            <div
              key={produto.id}
              onClick={() => handleCheckboxChange(produto.id)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all duration-200 active:scale-[0.98] ${
                isSelected
                  ? 'border-[var(--brand-yellow)] bg-[var(--brand-yellow)]/5'
                  : 'border-zinc-800 bg-zinc-900'
              }`}
            >
              {/* Checkbox customizado */}
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-all ${
                  isSelected
                    ? 'border-[var(--brand-yellow)] bg-[var(--brand-yellow)]'
                    : 'border-zinc-600 bg-zinc-800'
                }`}
                aria-label={isSelected ? 'Produto selecionado' : 'Produto não selecionado'}
              >
                {isSelected && <Check className="h-4 w-4 text-black" strokeWidth={3} />}
              </div>

              {/* Informações do produto */}
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-medium text-white">{produto.nome}</h3>
                <div className="mt-1 flex items-center gap-2">
                  {produto.desconto_percentual > 0 && (
                    <span className="text-xs text-zinc-500 line-through">
                      {formatPreco(produto.preco_original)}
                    </span>
                  )}
                  <span className="text-sm font-bold text-[var(--brand-yellow)]">
                    {formatPreco(produto.preco_com_desconto)}
                  </span>
                  {produto.desconto_percentual > 0 && (
                    <span
                      className={`rounded ${descontoColors.bg} px-1.5 py-0.5 text-xs font-semibold ${descontoColors.text}`}
                    >
                      -{produto.desconto_percentual.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Layout Desktop - Cards com Imagem */}
      <div className="hidden grid-cols-2 gap-4 sm:grid lg:grid-cols-3">
        {produtos.map((produto) => {
          const isSelected = selectedIds.includes(produto.id)
          const descontoValor = produto.preco_original - produto.preco_com_desconto
          const descontoColors = getDescontoColor(produto.desconto_percentual)

          return (
            <Card
              key={produto.id}
              onClick={() => handleCheckboxChange(produto.id)}
              className={`relative cursor-pointer border transition-all duration-200 ${
                isSelected
                  ? 'border-[var(--brand-yellow)] bg-zinc-900 ring-2 ring-[var(--brand-yellow)]/30'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <CardContent className="p-4">
                {/* Checkbox customizado */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex cursor-pointer items-center gap-2">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                        isSelected
                          ? 'border-[var(--brand-yellow)] bg-[var(--brand-yellow)]'
                          : 'border-zinc-600 bg-zinc-800'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-black" strokeWidth={3} />}
                    </div>
                  </div>

                  {/* Badge de desconto */}
                  {produto.desconto_percentual > 0 && (
                    <div
                      className={`flex items-center gap-1 rounded ${descontoColors.bg} border ${descontoColors.border} px-2 py-1 text-xs font-semibold ${descontoColors.text}`}
                    >
                      <Tag className="h-3 w-3" />
                      {produto.desconto_percentual.toFixed(2)}% OFF
                    </div>
                  )}
                </div>

                {/* Conteúdo do produto */}
                <div>
                  {/* Imagem */}
                  <div className="relative aspect-square w-full overflow-hidden rounded border border-zinc-800 bg-zinc-950">
                    {produto.foto_principal || produto.fotos?.[0] ? (
                      <NextImage
                        src={produto.foto_principal || produto.fotos[0]}
                        alt={produto.nome}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-700">
                        Sem imagem
                      </div>
                    )}
                  </div>

                  {/* Nome */}
                  <h3 className="mt-3 line-clamp-2 text-sm font-medium text-white">
                    {produto.nome}
                  </h3>

                  {/* Preços */}
                  <div className="mt-2 space-y-1">
                    {produto.desconto_percentual > 0 && (
                      <p className="text-xs text-zinc-500 line-through">
                        {formatPreco(produto.preco_original)}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-[var(--brand-yellow)]">
                        {formatPreco(produto.preco_com_desconto)}
                      </p>
                      {descontoValor > 0 && (
                        <span className="text-[11px] text-green-500">
                          Economize {formatPreco(descontoValor)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Link para ver produto (opcional) */}
                  <Link
                    href={`/produto/${produto.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 block text-center text-xs text-zinc-400 underline hover:text-[var(--brand-yellow)]"
                  >
                    Ver detalhes do produto
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Indicador de produtos selecionados */}
      {selectedIds.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--brand-yellow)]/30 bg-[var(--brand-yellow)]/10 p-3">
          <Check className="h-4 w-4 text-[var(--brand-yellow)]" />
          <p className="text-sm font-medium text-[var(--brand-yellow)]">
            {selectedIds.length}{' '}
            {selectedIds.length === 1 ? 'produto selecionado' : 'produtos selecionados'}
          </p>
        </div>
      )}
    </div>
  )
}

// Memoize para evitar re-renders desnecessários
export const ProdutosRelacionados = memo(ProdutosRelacionadosComponent)
