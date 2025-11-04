'use client'
import { logger } from '@/lib/utils/logger'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Package, Eye, TrendingUp, DollarSign, RefreshCw, Users, Activity, RotateCcw, Shuffle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { SiteMetricsCard } from '@/components/admin/site-metrics-card'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { zerarVisualizacoes, aleatorizarProdutosRelacionados } from './actions'
import { toast } from 'sonner'

interface ProdutoView {
  id: string
  nome: string
  foto_principal: string | null
  visualizacoes_total: number
  preco: number
}

interface BannerProdutoMetric {
  produtoId: string
  nome: string
  foto_principal: string | null
  preco: number | null
  preco_promocional: number | null
  totalClicks: number
  uniqueVisitors: number
}

interface BannerHighlight {
  bannerId: string
  titulo: string
  produtos: BannerProdutoMetric[]
}

interface AnalyticsStats {
  usuariosOnline: number
  visitantesHoje: number
  visitantesMes: number
  conversoesHoje: number
  conversoesMes: number
  totalProdutos: number
  produtosAtivos: number
  totalVisualizacoes: number
  topProdutos: ProdutoView[]
  bannersDestaque: BannerHighlight[]
}

type PeriodFilter = 'today' | 'month'

export default function DashboardPage() {
  const [stats, setStats] = useState<AnalyticsStats>({
    usuariosOnline: 0,
    visitantesHoje: 0,
    visitantesMes: 0,
    conversoesHoje: 0,
    conversoesMes: 0,
    totalProdutos: 0,
    produtosAtivos: 0,
    totalVisualizacoes: 0,
    topProdutos: [],
    bannersDestaque: [],
  })
  const [period, setPeriod] = useState<PeriodFilter>('today')
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [zerandoViews, setZerandoViews] = useState(false)
  const [showZerarDialog, setShowZerarDialog] = useState(false)
  const [aleatorizando, setAleatorizando] = useState(false)
  const [showAleatorizarDialog, setShowAleatorizarDialog] = useState(false)

  const loadStats = useCallback(async () => {
    const supabase = createClient()

    // Limpar sessões antigas primeiro
    await supabase.rpc('cleanup_inactive_sessions')

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      usuariosOnlineRes,
      visitantesHojeRes,
      visitantesMesRes,
      conversoesHojeRes,
      conversoesMesRes,
      totalProdutosRes,
      produtosAtivosRes,
      visualizacoesRes,
      topProdutosRes,
      bannersDestaqueRes,
    ] = await Promise.all([
      // Usuários online (últimos 5 minutos)
      supabase
        .from('active_sessions')
        .select('visitor_id', { count: 'exact', head: true })
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()),

      // Visitantes únicos hoje
      supabase
        .from('page_views')
        .select('visitor_id', { count: 'exact', head: false })
        .gte('created_at', startOfToday.toISOString())
        .then(res => {
          if (res.data) {
            const unique = new Set(res.data.map((r: any) => r.visitor_id))
            return { count: unique.size }
          }
          return { count: 0 }
        }),

      // Visitantes únicos no mês
      supabase
        .from('page_views')
        .select('visitor_id', { count: 'exact', head: false })
        .gte('created_at', startOfMonth.toISOString())
        .then(res => {
          if (res.data) {
            const unique = new Set(res.data.map((r: any) => r.visitor_id))
            return { count: unique.size }
          }
          return { count: 0 }
        }),

      // Conversões únicas hoje (cliques no WhatsApp)
      supabase
        .from('conversions')
        .select('visitor_id', { count: 'exact', head: false })
        .gte('created_at', startOfToday.toISOString())
        .then(res => {
          if (res.data) {
            const unique = new Set(res.data.map((r: any) => r.visitor_id))
            return { count: unique.size }
          }
          return { count: 0 }
        }),

      // Conversões únicas no mês
      supabase
        .from('conversions')
        .select('visitor_id', { count: 'exact', head: false })
        .gte('created_at', startOfMonth.toISOString())
        .then(res => {
          if (res.data) {
            const unique = new Set(res.data.map((r: any) => r.visitor_id))
            return { count: unique.size }
          }
          return { count: 0 }
        }),

      // Total produtos
      supabase.from('produtos').select('id', { count: 'exact', head: true }).is('deleted_at', null),

      // Produtos ativos
      supabase
        .from('produtos')
        .select('id', { count: 'exact', head: true })
        .eq('ativo', true)
        .is('deleted_at', null),

      // Total visualizações
      supabase.from('produtos').select('visualizacoes_total').is('deleted_at', null),

      // Top 5 produtos
      supabase
        .from('produtos')
        .select('id, nome, foto_principal, visualizacoes_total, preco')
        .is('deleted_at', null)
        .order('visualizacoes_total', { ascending: false })
        .limit(5),

      // Banners de produtos em destaque ativos
      supabase
        .from('banners')
        .select('id, titulo, produtos_destaque')
        .eq('ativo', true)
        .eq('tipo', 'produtos_destaque'),
    ])

    const totalVisualizacoes =
      visualizacoesRes.data?.reduce((acc: number, curr: any) => acc + (curr.visualizacoes_total || 0), 0) || 0

    const bannersDestaqueData = (bannersDestaqueRes.data ?? []) as Array<{
      id: string
      titulo: string
      produtos_destaque: Array<{ produto_id: string; preco_promocional: number | null }> | null
    }>

    if (bannersDestaqueRes.error) {
      logger.error('[Dashboard] Erro ao carregar banners de destaque:', bannersDestaqueRes.error)
    }

    let bannersDestaque: BannerHighlight[] = []

    if (bannersDestaqueData.length > 0) {
      const bannerIds = bannersDestaqueData.map((banner) => banner.id)
      const produtoIds = Array.from(
        new Set(
          bannersDestaqueData.flatMap((banner) =>
            (banner.produtos_destaque ?? [])
              .map((produto) => produto?.produto_id)
              .filter((id): id is string => Boolean(id))
          )
        )
      )

      const clicksPromise =
        bannerIds.length > 0
          ? supabase
              .from('banner_produtos_clicks_stats')
              .select('banner_id, produto_id, total_clicks, unique_visitors')
              .in('banner_id', bannerIds)
          : Promise.resolve({ data: [], error: null })

      const produtosPromise =
        produtoIds.length > 0
          ? supabase
              .from('produtos')
              .select('id, nome, foto_principal, preco')
              .in('id', produtoIds)
              .is('deleted_at', null)
          : Promise.resolve({ data: [], error: null })

      const [clicksStatsRes, produtosInfoRes] = await Promise.all([clicksPromise, produtosPromise])

      if (clicksStatsRes.error) {
        logger.error('[Dashboard] Erro ao carregar estatísticas de cliques:', clicksStatsRes.error)
      }

      if (produtosInfoRes.error) {
        logger.error('[Dashboard] Erro ao carregar produtos destacados:', produtosInfoRes.error)
      }

      const statsMap = new Map<string, Map<string, { totalClicks: number; uniqueVisitors: number }>>()
      ;(clicksStatsRes.data ?? []).forEach((row: any) => {
        if (!statsMap.has(row.banner_id)) {
          statsMap.set(row.banner_id, new Map())
        }
        statsMap.get(row.banner_id)?.set(row.produto_id, {
          totalClicks: row.total_clicks || 0,
          uniqueVisitors: row.unique_visitors || 0,
        })
      })

      const produtoMap = new Map<
        string,
        { nome: string; foto_principal: string | null; preco: number | null }
      >()
      ;(produtosInfoRes.data ?? []).forEach((produto: any) => {
        produtoMap.set(produto.id, {
          nome: produto.nome,
          foto_principal: produto.foto_principal || null,
          preco: produto.preco != null ? Number(produto.preco) : null,
        })
      })

      bannersDestaque = bannersDestaqueData.map((banner) => {
        const produtos: BannerProdutoMetric[] = (banner.produtos_destaque ?? []).map((p) => {
          const produtoInfo = produtoMap.get(p.produto_id)
          const metrics = statsMap.get(banner.id)?.get(p.produto_id)
          const precoPromocional =
            p.preco_promocional != null
              ? Number(p.preco_promocional)
              : produtoInfo?.preco ?? null

          return {
            produtoId: p.produto_id,
            nome: produtoInfo?.nome ?? 'Produto removido',
            foto_principal: produtoInfo?.foto_principal ?? null,
            preco: produtoInfo?.preco ?? null,
            preco_promocional: precoPromocional,
            totalClicks: metrics?.totalClicks ?? 0,
            uniqueVisitors: metrics?.uniqueVisitors ?? 0,
          }
        })

        produtos.sort((a, b) => b.totalClicks - a.totalClicks)

        return {
          bannerId: banner.id,
          titulo: banner.titulo,
          produtos,
        }
      })
    }

    setStats({
      usuariosOnline: usuariosOnlineRes.count || 0,
      visitantesHoje: visitantesHojeRes.count || 0,
      visitantesMes: visitantesMesRes.count || 0,
      conversoesHoje: conversoesHojeRes.count || 0,
      conversoesMes: conversoesMesRes.count || 0,
      totalProdutos: totalProdutosRes.count || 0,
      produtosAtivos: produtosAtivosRes.count || 0,
      totalVisualizacoes,
      topProdutos: (topProdutosRes.data as ProdutoView[]) || [],
      bannersDestaque,
    })

    setLastUpdate(new Date())
    setLoading(false)
  }, [])

  // Polling a cada 10 segundos
  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 10000)
    return () => clearInterval(interval)
  }, [loadStats])

  const handleZerarVisualizacoes = async () => {
    setZerandoViews(true)
    setShowZerarDialog(false)

    const result = await zerarVisualizacoes()

    if (result.success) {
      toast.success(result.message)
      await loadStats() // Recarregar estatísticas
    } else {
      toast.error(result.error || 'Erro ao zerar visualizações')
    }

    setZerandoViews(false)
  }

  const handleAleatorizarRelacionados = async () => {
    setAleatorizando(true)
    setShowAleatorizarDialog(false)

    const result = await aleatorizarProdutosRelacionados()

    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.error || 'Erro ao aleatorizar produtos')
    }

    setAleatorizando(false)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <div className="text-center">
          <div className="relative mx-auto h-8 w-8 animate-pulse">
            <div className="h-full w-full rounded-full border-4 border-zinc-700 opacity-40 brightness-150 grayscale" />
          </div>
          <p className="mt-4 text-sm text-zinc-400">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const displayVisitors = period === 'today' ? stats.visitantesHoje : stats.visitantesMes
  const displayConversoes = period === 'today' ? stats.conversoesHoje : stats.conversoesMes
  const conversionRate = displayVisitors > 0
    ? ((displayConversoes / displayVisitors) * 100).toFixed(1)
    : '0.0'

  const isProduction = typeof window !== 'undefined' &&
    (window.location.hostname.includes('leoiphone.com.br') || window.location.hostname.includes('vercel.app'))

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      {!isProduction && (
        <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-zinc-900">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-400">
              ⚠️ <strong>Modo Desenvolvimento:</strong> O tracking de visitantes está desabilitado.
              Apenas dados de produção (leoiphone.com.br) são rastreados.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white md:text-2xl">Dashboard</h2>
          <p className="text-xs text-zinc-400 md:text-sm">
            Atualizado às {formatTime(lastUpdate)} • Atualização automática a cada 10s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadStats} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAleatorizarDialog(true)}
            disabled={aleatorizando}
            className="gap-2 border-blue-500/20 text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
          >
            <Shuffle className="h-4 w-4" />
            <span className="hidden lg:inline">Aleatorizar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowZerarDialog(true)}
            disabled={zerandoViews}
            className="gap-2 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden lg:inline">Zerar Views</span>
          </Button>
        </div>
      </div>

      {/* Dialog de confirmação - Zerar Views */}
      <ConfirmDialog
        open={showZerarDialog}
        onOpenChange={setShowZerarDialog}
        onConfirm={handleZerarVisualizacoes}
        title="Zerar Visualizações"
        description="Tem certeza que deseja zerar as visualizações de TODOS os produtos? Esta ação não pode ser desfeita."
        confirmText="Zerar Visualizações"
        variant="destructive"
      />

      {/* Dialog de confirmação - Aleatorizar */}
      <ConfirmDialog
        open={showAleatorizarDialog}
        onOpenChange={setShowAleatorizarDialog}
        onConfirm={handleAleatorizarRelacionados}
        title="Aleatorizar Produtos Relacionados"
        description="Isso irá gerar uma nova ordem aleatória para os produtos relacionados em todo o site. Os usuários verão diferentes sugestões."
        confirmText="Aleatorizar"
        variant="default"
      />

      {/* Métricas em tempo real */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/10 to-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Usuários Online</CardTitle>
            <Activity className="h-5 w-5 animate-pulse text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.usuariosOnline}</div>
            <p className="text-xs text-zinc-500">Agora mesmo</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Visitantes</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{displayVisitors}</div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={period === 'today' ? 'default' : 'ghost'}
                  onClick={() => setPeriod('today')}
                  className="h-7 px-2 text-xs"
                >
                  Hoje
                </Button>
                <Button
                  size="sm"
                  variant={period === 'month' ? 'default' : 'ghost'}
                  onClick={() => setPeriod('month')}
                  className="h-7 px-2 text-xs"
                >
                  Mês
                </Button>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {period === 'today' ? 'Últimas 24h' : 'Últimos 30 dias'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalProdutos}</div>
            <p className="text-xs text-zinc-500">{stats.produtosAtivos} ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Outras métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Visualizações Totais</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalVisualizacoes.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-zinc-500">Todos os produtos</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {conversionRate}%
            </div>
            <p className="text-xs text-zinc-500">
              {displayConversoes} conversões de {displayVisitors} visitantes
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Receita Potencial</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.topProdutos
                .reduce((acc, produto) => acc + produto.preco, 0)
                .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500">Top 5 produtos</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas do Site */}
      <SiteMetricsCard onRefresh={loadStats} />

      {/* Performance dos banners de produtos em destaque */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Produtos em Destaque • Cliques</CardTitle>
          <CardDescription className="text-zinc-400">
            Monitoramento de banners ativos do tipo produtos_destaque
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.bannersDestaque.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Nenhum banner de produtos em destaque está ativo no momento.
            </p>
          ) : (
            <div className="space-y-6">
              {stats.bannersDestaque.map((banner) => (
                <div
                  key={banner.bannerId}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{banner.titulo}</h3>
                      <p className="text-xs text-zinc-500">
                        {banner.produtos.length}{' '}
                        {banner.produtos.length === 1 ? 'produto configurado' : 'produtos configurados'}
                      </p>
                    </div>
                  </div>

                  {banner.produtos.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      Adicione produtos ao banner para começar a medir cliques.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {banner.produtos.map((produto) => {
                        const precoBase = produto.preco ?? produto.preco_promocional ?? 0
                        const precoDestaque = produto.preco_promocional ?? produto.preco ?? 0
                        const temDesconto =
                          produto.preco !== null &&
                          produto.preco_promocional !== null &&
                          produto.preco_promocional < produto.preco

                        return (
                          <div
                            key={produto.produtoId}
                            className="flex items-center gap-4 rounded-md border border-zinc-800/60 bg-zinc-900/80 p-3 md:p-4"
                          >
                            {produto.foto_principal ? (
                              <div className="relative h-12 w-12 overflow-hidden rounded-md">
                                <Image
                                  src={produto.foto_principal}
                                  alt={produto.nome}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-zinc-800 text-[10px] text-zinc-500">
                                Sem foto
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">{produto.nome}</p>
                              <div className="flex items-center gap-2 text-xs text-zinc-500">
                                {temDesconto && (
                                  <span className="line-through">
                                    R$ {precoBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                                <span className="font-semibold text-[var(--brand-yellow)]">
                                  R$ {precoDestaque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-shrink-0 gap-4">
                              <div className="text-right">
                                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Cliques</p>
                                <p
                                  className={`text-lg font-semibold ${
                                    produto.totalClicks > 0 ? 'text-white' : 'text-zinc-500'
                                  }`}
                                >
                                  {produto.totalClicks}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                                  Visitantes
                                </p>
                                <p
                                  className={`text-lg font-semibold ${
                                    produto.uniqueVisitors > 0 ? 'text-white' : 'text-zinc-500'
                                  }`}
                                >
                                  {produto.uniqueVisitors}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Produtos mais visualizados */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Produtos Mais Visualizados</CardTitle>
          <CardDescription className="text-zinc-400">Top 5 produtos com mais acessos</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topProdutos.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Nenhum produto cadastrado ainda</p>
          ) : (
            <div className="space-y-4">
              {stats.topProdutos.map((produto, index) => (
                <div key={produto.id} className="flex items-center gap-4 rounded-lg border border-zinc-800 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>

                  {produto.foto_principal ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-md">
                      <Image
                        src={produto.foto_principal}
                        alt={produto.nome}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-zinc-800 text-xs text-zinc-500">
                      Sem foto
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-white">{produto.nome}</p>
                    <p className="text-xs text-zinc-400">
                      R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-zinc-400">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {produto.visualizacoes_total?.toLocaleString('pt-BR') || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
