'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/utils/logger'
import type { Produto } from '@/types/produto'

interface ProdutosRelacionadosProps {
  produtoId: string
  categoriaId: string
}

function ProdutosRelacionadosComponent({
  produtoId,
  categoriaId,
}: ProdutosRelacionadosProps) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)

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

  const formatPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco)
  }

  if (loading) {
    return (
      <div className="my-8">
        <h2 className="mb-4 text-lg font-semibold text-white">Produtos Relacionados</h2>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
            >
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-800" />
            </div>
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
      <h2 className="mb-4 text-lg font-semibold text-white">Produtos Relacionados</h2>

      {/* Lista compacta de produtos */}
      <div className="flex flex-col gap-2">
        {produtos.map((produto) => (
          <Link
            key={produto.id}
            href={`/produto/${produto.slug}`}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 transition-all hover:border-zinc-700 hover:bg-zinc-800"
          >
            <span className="line-clamp-1 text-sm text-white">{produto.nome}</span>
            <span className="ml-4 shrink-0 text-sm font-bold text-[var(--brand-yellow)]">
              {formatPreco(produto.preco)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// Memoize para evitar re-renders desnecessários
export const ProdutosRelacionados = memo(ProdutosRelacionadosComponent)
