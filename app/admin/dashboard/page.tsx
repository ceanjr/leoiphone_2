'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Package, Eye, TrendingUp, DollarSign, RefreshCw, Users, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface ProdutoView {
  id: string
  nome: string
  foto_principal: string | null
  visualizacoes_total: number
  preco: number
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
  })
  const [period, setPeriod] = useState<PeriodFilter>('today')
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

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
    ])

    const totalVisualizacoes =
      visualizacoesRes.data?.reduce((acc: number, curr: any) => acc + (curr.visualizacoes_total || 0), 0) || 0

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
            Atualizar
          </Button>
        </div>
      </div>

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
