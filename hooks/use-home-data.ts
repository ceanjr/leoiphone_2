/**
 * Hook para carregar e gerenciar dados da HomePage
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ordenarProdutosPorModelo } from '@/lib/utils/produtos/helpers'
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

  // Carregar seções de destaque (OTIMIZADO: elimina query N+1)
  const loadSecoes = useCallback(async () => {
    const supabase = createClient()

    // 1. Buscar todas as seções ativas
    const { data: secoesData } = await supabase
      .from('secoes_home')
      .select('id, tipo, titulo, subtitulo')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (!secoesData || secoesData.length === 0) {
      setSecoes([])
      return
    }

    const secoesBase = (secoesData ?? []) as SecaoHomeRow[]
    const secaoIds = secoesBase.map(s => s.id)

    // 2. Buscar TODAS as relações de uma vez (não em loop) - Otimização: de N+1 queries para 2 queries
    const { data: todasRelacoes } = await supabase
      .from('produtos_secoes')
      .select(
        `
        secao_id,
        ordem,
        produto:produtos(*)
      `
      )
      .in('secao_id', secaoIds)
      .order('ordem', { ascending: true })

    // 3. Agrupar produtos por seção no cliente (operação local, não query)
    const secoesComProdutos = secoesBase.map(secao => {
      const produtosSecao = ((todasRelacoes ?? []) as any[])
        .filter(rel => rel.secao_id === secao.id)
        .map(rel => rel.produto)
        .filter((p): p is Produto => Boolean(p && p.ativo && !p.deleted_at))

      return {
        ...secao,
        produtos: produtosSecao,
      }
    })

    setSecoes(secoesComProdutos.filter((s) => s.produtos.length > 0))
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
