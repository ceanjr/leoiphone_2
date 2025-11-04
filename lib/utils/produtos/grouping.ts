/**
 * Utilitários para agrupar e filtrar produtos
 */

import { ordenarProdutosPorModelo } from './helpers'
import type { Produto } from '@/types/produto'

export interface Categoria {
  id: string
  nome: string
  slug: string
  ordem: number
}

export interface ProdutosAgrupados {
  categoria: Categoria
  produtos: Produto[]
}

/**
 * Agrupa produtos por categoria
 */
export function agruparProdutosPorCategoria(produtos: any[]): ProdutosAgrupados[] {
  const grupos: { [key: string]: ProdutosAgrupados } = {}

  produtos.forEach((produto) => {
    const catId = produto.categoria?.id || 'sem-categoria'
    if (!grupos[catId]) {
      grupos[catId] = {
        categoria: produto.categoria || {
          id: 'sem-categoria',
          nome: 'Outros Produtos',
          slug: 'outros',
          ordem: 9999,
        },
        produtos: [],
      }
    }
    grupos[catId].produtos.push(produto)
  })

  // Ordenar produtos dentro de cada grupo
  Object.values(grupos).forEach((grupo) => {
    grupo.produtos = ordenarProdutosPorModelo(grupo.produtos)
  })

  // Converter para array e ordenar por ordem da categoria
  return Object.values(grupos).sort(
    (a, b) => (a.categoria.ordem || 9999) - (b.categoria.ordem || 9999)
  )
}

/**
 * Filtra produtos por categoria, busca e IDs excluídos
 */
export function filtrarProdutos(
  produtos: any[],
  options: {
    categoriaId?: string
    busca?: string
    excluirIds?: string[]
  }
): any[] {
  let filtered = [...produtos]

  // Filtrar por IDs excluídos (produtos em destaque)
  if (options.excluirIds && options.excluirIds.length > 0) {
    filtered = filtered.filter((p) => !options.excluirIds!.includes(p.id))
  }

  // Filtrar por categoria
  if (options.categoriaId && options.categoriaId !== 'todas') {
    filtered = filtered.filter((p) => p.categoria_id === options.categoriaId)
  }

  // Filtrar por busca
  if (options.busca && options.busca.trim()) {
    const buscaLower = options.busca.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.nome.toLowerCase().includes(buscaLower) ||
        p.descricao?.toLowerCase().includes(buscaLower) ||
        p.codigo_produto?.toLowerCase().includes(buscaLower)
    )
  }

  return filtered
}
