'use client'

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ProdutoCard } from '@/components/public/produto-card'
import { BannerCarousel } from '@/components/public/banner-carousel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X, LayoutGrid, List } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { usePollingProdutos } from '@/hooks/use-polling-produtos'
import type { Produto, ProdutoComCategoria } from '@/types/produto'

interface Categoria {
  id: string
  nome: string
  slug: string
  ordem: number
}

interface Secao {
  id: string
  tipo: 'destaques' | 'promocoes' | 'lancamentos'
  titulo: string
  subtitulo: string | null
  produtos: Produto[]
}

interface ProdutosAgrupados {
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


// Função para ordenar produtos por modelo iPhone
function ordenarProdutosPorModelo(produtos: Produto[]): Produto[] {
  return produtos.sort((a, b) => {
    // Extrair número do modelo do nome (ex: "iPhone 11 Pro" -> 11)
    const extrairNumero = (nome: string): number => {
      // Casos especiais
      if (
        nome.toLowerCase().includes('iphone x') &&
        !nome.toLowerCase().includes('xr') &&
        !nome.toLowerCase().includes('xs')
      )
        return 10 // iPhone X = 10
      if (nome.toLowerCase().includes('iphone xr')) return 10.3 // iPhone XR entre X e 11
      if (nome.toLowerCase().includes('iphone xs')) return 10.5 // iPhone XS

      // Extrair número padrão (8, 11, 12, 13, 14, 15, 16)
      const match = nome.match(/iphone\s+(\d+)/i)
      if (match) return parseInt(match[1])

      // Se não for iPhone, colocar no final
      return 9999
    }

    const numA = extrairNumero(a.nome)
    const numB = extrairNumero(b.nome)

    // Ordenar por número (crescente)
    if (numA !== numB) return numA - numB

    // Se forem do mesmo modelo, ordenar por nome (alfabético)
    return a.nome.localeCompare(b.nome)
  })
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <HomePageContent />
    </Suspense>
  )
}

function HomePageContent() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtosAgrupados, setProdutosAgrupados] = useState<ProdutosAgrupados[]>([])
  const [secoes, setSecoes] = useState<Secao[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [categoriasExibidas, setCategoriasExibidas] = useState(1) // Quantas categorias mostrar
  const [todasCategorias, setTodasCategorias] = useState<ProdutosAgrupados[]>([]) // Todos os produtos agrupados
  const [produtosEmDestaqueIds, setProdutosEmDestaqueIds] = useState<string[]>([]) // IDs dos produtos em destaque nos banners

  // Filtros
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Inicializar estados diretamente dos searchParams
  const initialBusca = searchParams?.get('busca') ?? ''
  const initialCategoria = searchParams?.get('categoria') ?? 'todas'
  const initialViewMode = (searchParams?.get('view') ?? 'list') as 'grid' | 'list'

  const [busca, setBusca] = useState(initialBusca)
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>(initialCategoria)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)

  // Sincronizar filtros quando searchParams mudar (para navegação)
  useEffect(() => {
    if (!searchParams) return
    const paramBusca = searchParams.get('busca') ?? ''
    const paramCategoria = searchParams.get('categoria') ?? 'todas'
    const paramViewMode = searchParams.get('view') ?? 'list'

    setBusca(paramBusca)
    setCategoriaFiltro(paramCategoria)
    setViewMode(paramViewMode as 'grid' | 'list')
  }, [searchParams])

  // Polling: sincronização de produtos via verificação periódica
  const handleProdutosUpdate = useCallback((produtosAtualizados: ProdutoComCategoria[]) => {
    console.log('[HomePage] Produtos atualizados via polling:', produtosAtualizados.length)

    // Filtrar produtos em destaque
    const produtosFiltrados = produtosAtualizados.filter(
      (p) => !produtosEmDestaqueIds.includes(p.id)
    )

    // Atualizar lista completa
    setProdutos(produtosFiltrados as Produto[])

    // Forçar recarregamento dos produtos agrupados
    void loadProdutos()
  }, [produtosEmDestaqueIds])

  // Ativar polling (verifica a cada 3 segundos)
  usePollingProdutos({
    enabled: true,
    interval: 3000,
    onUpdate: handleProdutosUpdate,
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      // Carregar categorias
      const { data: cats } = await supabase
        .from('categorias')
        .select('id, nome, slug, ordem')
        .eq('ativo', true)
        .order('ordem', { ascending: true })

      if (cats) setCategorias(cats)

      // Carregar IDs de produtos em destaque de banners ativos
      const { data: bannersAtivos } = await supabase
        .from('banners')
        .select('produtos_destaque, tipo')
        .eq('ativo', true)
        .eq('tipo', 'produtos_destaque')

      if (bannersAtivos && bannersAtivos.length > 0) {
        const idsDestaque: string[] = []
        const ativos = (bannersAtivos ?? []) as BannerAtivoRow[]
        ativos.forEach((banner) => {
          (banner.produtos_destaque ?? []).forEach((entry) => {
            const produtoId = entry?.produto_id
            if (produtoId && !idsDestaque.includes(produtoId)) {
              idsDestaque.push(produtoId)
            }
          })
        })
        setProdutosEmDestaqueIds(idsDestaque)
      }

      // Carregar seções de destaque (promoções, lançamentos, etc)
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

      // Carregar todos os produtos
      await loadProdutos()
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProdutos() {
    setLoading(true)
    setCategoriasExibidas(1)

    const supabase = createClient()

    // Carregar TODOS os produtos (sem paginação)
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

    // Filtrar por categoria
    if (categoriaFiltro !== 'todas') {
      query = query.eq('categoria_id', categoriaFiltro)
    }

    const { data, error } = await query

    if (!error && data) {
      // Debug: verificar se cores estão sendo carregadas
      if (process.env.NODE_ENV === 'development' && data.length > 0) {
        const produtoComCor = data.find((p: any) => p.cores && p.cores.length > 0)
        if (produtoComCor) {
          console.log('[HomePage] Exemplo de produto com cores:', {
            nome: produtoComCor.nome,
            cores: produtoComCor.cores,
            cor_oficial: produtoComCor.cor_oficial
          })
        } else {
          console.log('[HomePage] Nenhum produto com cores encontrado no banco')
        }
      }

      // Filtrar produtos em destaque dos banners
      let produtosFiltrados = data.filter((p: any) => !produtosEmDestaqueIds.includes(p.id))

      // Filtrar por busca (cliente)
      if (busca.trim()) {
        const buscaLower = busca.toLowerCase()
        produtosFiltrados = produtosFiltrados.filter(
          (p: any) =>
            p.nome.toLowerCase().includes(buscaLower) ||
            p.descricao?.toLowerCase().includes(buscaLower) ||
            p.codigo_produto?.toLowerCase().includes(buscaLower)
        )
      }

      // Ordenar por modelo iPhone
      let produtosOrdenados: any[] = ordenarProdutosPorModelo(produtosFiltrados as Produto[])

      // Agrupar por categoria
      const grupos: { [key: string]: ProdutosAgrupados } = {}

      produtosOrdenados.forEach((produto: any) => {
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

      // Ordenar cada grupo internamente por modelo
      Object.values(grupos).forEach((grupo) => {
        grupo.produtos = ordenarProdutosPorModelo(grupo.produtos)
      })

      // Converter para array e ordenar por ordem da categoria
      const gruposArray = Object.values(grupos).sort(
        (a, b) => (a.categoria.ordem || 9999) - (b.categoria.ordem || 9999)
      )

      // Salvar todos os grupos
      setTodasCategorias(gruposArray)

      // Calcular quantas categorias são necessárias para mostrar pelo menos 20 produtos
      const MINIMO_PRODUTOS_INICIAIS = 20
      let totalProdutos = 0
      let categoriasIniciais = 0

      for (let i = 0; i < gruposArray.length; i++) {
        totalProdutos += gruposArray[i].produtos.length
        categoriasIniciais++
        if (totalProdutos >= MINIMO_PRODUTOS_INICIAIS) {
          break
        }
      }

      // Exibir categorias suficientes para ter pelo menos 20 produtos
      setCategoriasExibidas(categoriasIniciais)
      setProdutosAgrupados(gruposArray.slice(0, categoriasIniciais))
      setProdutos(produtosOrdenados as Produto[])
    }

    setLoading(false)
  }

  const carregarMais = useCallback(() => {
    setLoadingMore(true)

    // Calcular quantas categorias adicionar para mostrar mais ~20 produtos
    const PRODUTOS_POR_PAGINA = 20
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

    // Atualizar produtos agrupados com mais categorias
    setProdutosAgrupados(todasCategorias.slice(0, novaQuantidade))

    setLoadingMore(false)
  }, [categoriasExibidas, todasCategorias])

  const temMaisProdutos = categoriasExibidas < todasCategorias.length

  // Criar string de query params para retornar ao catálogo
  const returnParams = useMemo(() => {
    const params = new URLSearchParams()
    if (busca.trim()) params.set('busca', busca.trim())
    if (categoriaFiltro !== 'todas') params.set('categoria', categoriaFiltro)
    if (viewMode !== 'list') params.set('view', viewMode)
    return params.toString()
  }, [busca, categoriaFiltro, viewMode])

  // Optimization: Load products efficiently
  useEffect(() => {
    void loadProdutos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaFiltro, busca, produtosEmDestaqueIds])

  // Atualizar URL com os filtros atuais
  const updateURLWithFilters = useCallback(
    (filters: {
      busca?: string
      categoria?: string
      view?: string
    }) => {
      const params = new URLSearchParams()

      if (filters.busca && filters.busca.trim()) {
        params.set('busca', filters.busca.trim())
      }
      if (filters.categoria && filters.categoria !== 'todas') {
        params.set('categoria', filters.categoria)
      }
      if (filters.view && filters.view !== 'list') {
        params.set('view', filters.view)
      }

      const queryString = params.toString()
      const newURL = queryString ? `/?${queryString}` : '/'
      router.replace(newURL, { scroll: false })
    },
    [router]
  )

  const limparFiltros = useCallback(() => {
    setBusca('')
    setCategoriaFiltro('todas')
    setViewMode('list')
    router.replace(pathname)
  }, [pathname, router])

  // Handlers que atualizam estado e URL
  const handleCategoriaChange = useCallback(
    (value: string) => {
      setCategoriaFiltro(value)
      updateURLWithFilters({
        busca,
        categoria: value,
        view: viewMode,
      })
    },
    [busca, viewMode, updateURLWithFilters]
  )

  const handleViewModeChange = useCallback(
    (value: 'grid' | 'list') => {
      setViewMode(value)
      updateURLWithFilters({
        busca,
        categoria: categoriaFiltro,
        view: value,
      })
    },
    [busca, categoriaFiltro, updateURLWithFilters]
  )

  // Optimization: Memoize section config to prevent recalculation
  const getSecaoConfig = useCallback((tipo: Secao['tipo']) => {
    switch (tipo) {
      case 'destaques':
        return {
          icon: '⭐',
          borderColor: 'var(--brand-yellow)',
          bgGradient:
            'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(234, 179, 8, 0.02) 100%)',
          badge: 'Destaque',
          badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        }
      case 'promocoes':
        return {
          icon: '🔥',
          borderColor: '#ef4444',
          bgGradient:
            'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)',
          badge: 'Promoção',
          badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
        }
      case 'lancamentos':
        return {
          icon: '🚀',
          borderColor: '#3b82f6',
          bgGradient:
            'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)',
          badge: 'Novo',
          badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        }
      default:
        return {
          icon: '⭐',
          borderColor: 'var(--brand-yellow)',
          bgGradient:
            'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(234, 179, 8, 0.02) 100%)',
          badge: 'Destaque',
          badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        }
    }
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Catálogo */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold text-white text-center">Catálogo Completo</h1>
        <p className="text-zinc-400 text-center">Explore todos os nossos iPhones disponíveis</p>
      </div>

      {/* Carrossel de Banners */}
      <BannerCarousel />

      {/* Barra de Busca e Filtros */}
      <div className="mb-8 space-y-4">
        {/* Busca */}
        <form
          className="relative"
          onSubmit={(event) => {
            event.preventDefault()
            const trimmed = busca.trim()
            const params = new URLSearchParams(searchParams?.toString())
            if (trimmed) {
              params.set('busca', trimmed)
            } else {
              params.delete('busca')
            }
            const query = params.toString()
            const target = query ? `/?${query}` : '/'
            const currentQuery = searchParams?.toString() ?? ''
            if (pathname === '/' && query === currentQuery) return
            router.replace(target)
          }}
        >
          <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-zinc-500" />
          <Input
            type="search"
            placeholder="Buscar por nome, modelo ou código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="border-zinc-800 bg-zinc-900 pl-10 text-white placeholder:text-zinc-500"
          />
          <button type="submit" className="sr-only">
            Buscar
          </button>
        </form>

        {/* Filtro de Categoria em Destaque */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 max-w-md">
            <Label className="mb-2 block text-sm font-medium text-zinc-300">Filtrar por Categoria</Label>
            <Select value={categoriaFiltro} onValueChange={handleCategoriaChange}>
              <SelectTrigger className="border-zinc-800 bg-zinc-900 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900">
                <SelectItem value="todas">Todas as Categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Limpar Filtros */}
          {(busca.trim() || categoriaFiltro !== 'todas') && (
            <Button variant="outline" onClick={limparFiltros} className="sm:w-auto">
              <X className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Seções de Destaque (Promoções, Lançamentos, etc) */}
      {secoes.map((secao) => {
        const config = getSecaoConfig(secao.tipo)

        return (
          <section
            key={secao.id}
            className="mb-12 rounded-lg border-2 p-6"
            style={{
              borderColor: config.borderColor,
              background: config.bgGradient,
            }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{config.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--brand-yellow)]">{secao.titulo}</h2>
                  {secao.subtitulo && <p className="text-sm text-zinc-400">{secao.subtitulo}</p>}
                </div>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${config.badgeColor}`}
              >
                {config.badge}
              </span>
            </div>
            <div
              className={
                viewMode === 'list'
                  ? 'flex flex-col gap-3'
                  : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
              }
            >
              {secao.produtos.map((produto, index) => (
                <ProdutoCard
                  key={produto.id}
                  produto={produto}
                  view={viewMode}
                  priority={index < 3}
                  returnParams={returnParams}
                />
              ))}
            </div>
          </section>
        )
      })}

      {/* Resultados e Toggle de Visualização */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-zinc-400">
          {loading
            ? 'Carregando...'
            : `${produtos.length} produto(s) encontrado(s) • Exibindo ${produtosAgrupados.reduce((acc, g) => acc + g.produtos.length, 0)} produtos`}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-zinc-500 sm:inline">Visualização:</span>
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className={`h-8 w-8 p-0 ${
                viewMode === 'grid' ? 'bg-zinc-800 text-[var(--brand-yellow)]' : 'text-zinc-500 hover:text-[var(--brand-yellow)]'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewModeChange('list')}
              className={`h-8 w-8 p-0 ${
                viewMode === 'list' ? 'bg-zinc-800 text-[var(--brand-yellow)]' : 'text-zinc-500 hover:text-[var(--brand-yellow)]'
              }`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid de Produtos Agrupados por Categoria */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto h-8 w-8 animate-pulse">
              <div className="h-full w-full rounded-full border-4 border-zinc-700 opacity-40 brightness-150 grayscale" />
            </div>
            <p className="mt-4 text-sm text-zinc-400">Carregando produtos...</p>
          </div>
        </div>
      ) : produtos.length > 0 ? (
        <div className="space-y-12">
          {produtosAgrupados.map((grupo) => (
            <section key={grupo.categoria.id}>
              {/* Título da Categoria */}
              <div className="mb-6 border-b border-zinc-800 pb-3">
                <h2 className="text-2xl font-bold text-[var(--brand-yellow)]">{grupo.categoria.nome}</h2>
                <p className="text-sm text-zinc-400">{grupo.produtos.length} produto(s)</p>
              </div>

              {/* Grid de Produtos da Categoria */}
              <div
                className={
                  viewMode === 'list'
                    ? 'flex flex-col gap-3'
                    : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }
              >
                {grupo.produtos.map((produto, index) => (
                  <ProdutoCard
                    key={produto.id}
                    produto={produto}
                    view={viewMode}
                    priority={index < 4}
                    returnParams={returnParams}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* Botão Ver Mais */}
          {temMaisProdutos && (
            <div className="mt-8 flex justify-center">
              <Button
                onClick={carregarMais}
                disabled={loadingMore}
                variant="outline"
                className="min-w-[200px]"
              >
                {loadingMore ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                    Carregando...
                  </>
                ) : (
                  'Ver Mais Produtos'
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-zinc-400">Nenhum produto encontrado com esses filtros.</p>
          <Button onClick={limparFiltros} variant="outline" className="mt-4">
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  )
}
