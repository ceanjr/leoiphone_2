/**
 * Hook para carregar e gerenciar dados da HomePage
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ordenarProdutosPorModelo } from '@/lib/utils/produtos/helpers'
import type { Produto, ProdutoComCategoria } from '@/types/produto'

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

interface BannerProdutoDestaqueRow {
  produto_id?: string
}

interface BannerAtivoRow {
  produtos_destaque?: BannerProdutoDestaqueRow[] | null
  tipo: 'banner' | 'produtos_destaque'
}

export function useHomeData() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [produtosEmDestaqueIds, setProdutosEmDestaqueIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Carregar categorias
  const loadCategorias = useCallback(async () => {
    const supabase = createClient()
    const { data: cats } = await supabase
      .from('categorias')
      .select('id, nome, slug, ordem')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (cats) setCategorias(cats)
  }, [])

  // Carregar IDs de produtos em destaque
  const loadProdutosDestaque = useCallback(async () => {
    const supabase = createClient()
    const { data: bannersAtivos } = await supabase
      .from('banners')
      .select('produtos_destaque, tipo')
      .eq('ativo', true)
      .eq('tipo', 'produtos_destaque')

    if (bannersAtivos && bannersAtivos.length > 0) {
      const idsDestaque: string[] = []
      const ativos = (bannersAtivos ?? []) as BannerAtivoRow[]
      ativos.forEach((banner) => {
        ;(banner.produtos_destaque ?? []).forEach((entry) => {
          const produtoId = entry?.produto_id
          if (produtoId && !idsDestaque.includes(produtoId)) {
            idsDestaque.push(produtoId)
          }
        })
      })
      setProdutosEmDestaqueIds(idsDestaque)
    }
  }, [])

  // Carregar produtos
  const loadProdutos = useCallback(async (categoriaId?: string, termoBusca?: string) => {
    const supabase = createClient()

    let query = supabase
      .from('produtos')
      .select(
        `
        *,
        categoria:categorias(id, nome, slug, ordem)
      `
      )
      .eq('ativo', true)
      .is('deleted_at', null)

    if (categoriaId && categoriaId !== 'todas') {
      query = query.eq('categoria_id', categoriaId)
    }

    if (termoBusca && termoBusca.trim()) {
      const termo = termoBusca.toLowerCase()
      query = query.or(`nome.ilike.%${termo}%,descricao.ilike.%${termo}%,codigo_produto.ilike.%${termo}%`)
    }

    query = query.order('created_at', { ascending: false })

    const { data: produtosData } = await query

    if (produtosData) {
      const produtosOrdenados = ordenarProdutosPorModelo(produtosData as Produto[])
      setProdutos(produtosOrdenados)
    }
  }, [])

  // Carregar todos os dados iniciais
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      await Promise.all([
        loadCategorias(),
        loadProdutosDestaque(),
        loadProdutos(),
      ])
      setLoading(false)
    }

    loadData()
  }, [loadCategorias, loadProdutosDestaque, loadProdutos])

  // Filtrar categorias que têm produtos ativos
  const categoriasComProdutos = useMemo(() => {
    if (categorias.length === 0 || produtos.length === 0) {
      return categorias
    }

    return categorias.filter((categoria) => {
      return produtos.some((produto) => {
        const produtoCategoria = (produto as ProdutoComCategoria).categoria
        return produtoCategoria?.id === categoria.id
      })
    })
  }, [categorias, produtos])

  return {
    produtos,
    setProdutos,
    categorias: categoriasComProdutos,
    produtosEmDestaqueIds,
    loading,
    loadProdutos,
  }
}
