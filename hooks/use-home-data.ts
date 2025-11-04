/**
 * Hook para carregar e gerenciar dados da HomePage
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ordenarProdutosPorModelo } from '@/lib/utils/produto-helpers'
import type { Produto, ProdutoComCategoria, ProdutoCusto } from '@/types/produto'

export interface Categoria {
  id: string
  nome: string
  slug: string
  ordem: number
}

export interface Secao {
  id: string
  tipo: 'destaques' | 'promocoes' | 'lancamentos'
  titulo: string
  subtitulo: string | null
  produtos: Produto[]
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

interface SecaoHomeRow {
  id: string
  tipo: Secao['tipo']
  titulo: string
  subtitulo: string | null
}

interface ProdutoSecaoRow {
  ordem: number
  produto: Produto | null
}

export function useHomeData(isAuthenticated: boolean) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [secoes, setSecoes] = useState<Secao[]>([])
  const [produtosEmDestaqueIds, setProdutosEmDestaqueIds] = useState<string[]>([])
  const [custosPorProduto, setCustosPorProduto] = useState<Record<string, ProdutoCusto[]>>({})
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

  // Carregar seções de destaque
  const loadSecoes = useCallback(async () => {
    const supabase = createClient()
    const { data: secoesData } = await supabase
      .from('secoes_home')
      .select('id, tipo, titulo, subtitulo')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (secoesData) {
      const secoesBase = (secoesData ?? []) as SecaoHomeRow[]
      const secoesComProdutos = await Promise.all(
        secoesBase.map(async (secao) => {
          const { data: produtosSecao } = await supabase
            .from('produtos_secoes')
            .select(
              `
              ordem,
              produto:produtos(*)
            `
            )
            .eq('secao_id', secao.id)
            .order('ordem', { ascending: true })

          const produtos = ((produtosSecao ?? []) as ProdutoSecaoRow[])
            .map((ps) => ps.produto)
            .filter((p): p is Produto => Boolean(p && p.ativo && !p.deleted_at))

          return {
            ...secao,
            produtos,
          }
        })
      )

      setSecoes(secoesComProdutos.filter((s) => s.produtos.length > 0))
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

  // Carregar custos (apenas se autenticado)
  const loadCustos = useCallback(async () => {
    if (!isAuthenticated) {
      setCustosPorProduto({})
      return
    }

    const supabase = createClient()
    const { data: custosData, error } = await supabase
      .from('produtos_custos')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && custosData) {
      const custosAgrupados: Record<string, ProdutoCusto[]> = {}

      ;(custosData as ProdutoCusto[]).forEach((custo) => {
        if (!custosAgrupados[custo.produto_id]) {
          custosAgrupados[custo.produto_id] = []
        }
        custosAgrupados[custo.produto_id].push(custo)
      })

      setCustosPorProduto(custosAgrupados)
    }
  }, [isAuthenticated])

  // Carregar todos os dados iniciais
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      await Promise.all([
        loadCategorias(),
        loadProdutosDestaque(),
        loadSecoes(),
        loadProdutos(),
      ])
      setLoading(false)
    }

    loadData()
  }, [loadCategorias, loadProdutosDestaque, loadSecoes, loadProdutos])

  // Carregar custos quando autenticação mudar
  useEffect(() => {
    loadCustos()
  }, [loadCustos])

  return {
    produtos,
    setProdutos,
    categorias,
    secoes,
    produtosEmDestaqueIds,
    custosPorProduto,
    loading,
    loadProdutos,
  }
}
