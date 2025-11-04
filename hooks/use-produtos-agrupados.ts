/**
 * Hook para gerenciar agrupamento e paginação de produtos
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { agruparProdutosPorCategoria, filtrarProdutos } from '@/lib/utils/produtos/grouping'
import { ordenarProdutosPorModelo } from '@/lib/utils/produtos/helpers'
import type { ProdutosAgrupados } from '@/lib/utils/produtos/grouping'
import type { ProdutoComCategoria } from '@/types/produto'

const MINIMO_PRODUTOS_INICIAIS = 20
const PRODUTOS_POR_PAGINA = 20

export function useProdutosAgrupados(
  produtosIniciais: any[],
  produtosEmDestaqueIds: string[],
  categoriaFiltro: string,
  busca: string
) {
  const [todasCategorias, setTodasCategorias] = useState<ProdutosAgrupados[]>([])
  const [categoriasExibidas, setCategoriasExibidas] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  // Processar e agrupar produtos
  useEffect(() => {
    // Filtrar produtos
    const produtosFiltrados = filtrarProdutos(produtosIniciais, {
      categoriaId: categoriaFiltro,
      busca,
      excluirIds: produtosEmDestaqueIds,
    })

    // Ordenar produtos
    const produtosOrdenados = ordenarProdutosPorModelo(produtosFiltrados)

    // Agrupar por categoria
    const gruposArray = agruparProdutosPorCategoria(produtosOrdenados)

    // Salvar todos os grupos
    setTodasCategorias(gruposArray)

    // Calcular quantas categorias são necessárias para mostrar pelo menos 20 produtos
    let totalProdutos = 0
    let categoriasIniciais = 0

    for (let i = 0; i < gruposArray.length; i++) {
      totalProdutos += gruposArray[i].produtos.length
      categoriasIniciais++
      if (totalProdutos >= MINIMO_PRODUTOS_INICIAIS) {
        break
      }
    }

    setCategoriasExibidas(categoriasIniciais || 1)
  }, [produtosIniciais, produtosEmDestaqueIds, categoriaFiltro, busca])

  // Produtos agrupados visíveis
  const produtosAgrupados = useMemo(() => {
    return todasCategorias.slice(0, categoriasExibidas)
  }, [todasCategorias, categoriasExibidas])

  // Carregar mais produtos
  const carregarMais = useCallback(() => {
    setLoadingMore(true)

    // Calcular quantas categorias adicionar para mostrar mais ~20 produtos
    let totalProdutosAdicionais = 0
    let categoriasAdicionais = 0

    for (let i = categoriasExibidas; i < todasCategorias.length; i++) {
      totalProdutosAdicionais += todasCategorias[i].produtos.length
      categoriasAdicionais++
      if (totalProdutosAdicionais >= PRODUTOS_POR_PAGINA) {
        break
      }
    }

    const novaQuantidade = categoriasExibidas + categoriasAdicionais
    setCategoriasExibidas(novaQuantidade)

    setLoadingMore(false)
  }, [categoriasExibidas, todasCategorias])

  const temMaisProdutos = categoriasExibidas < todasCategorias.length

  return {
    produtosAgrupados,
    carregarMais,
    loadingMore,
    temMaisProdutos,
  }
}
