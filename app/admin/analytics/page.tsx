'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import { Package, Eye, TrendingUp, DollarSign, RefreshCw, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { resetAnalytics } from './actions'

interface ProdutoView {
  id: string
  nome: string
  foto_principal: string | null
  visualizacoes_total: number
  preco: number
}

interface StatsSnapshot {
  totalProdutos: number
  produtosAtivos: number
  produtosNovos: number
  produtosSeminovos: number
  totalVisualizacoes: number
  topProdutos: ProdutoView[]
}

async function fetchStats(): Promise<StatsSnapshot> {
  const supabase = createClient()

  const [totalProdutosResult, produtosAtivosResult, produtosNovosResult, produtosSeminovosResult, visualizacoesResult, maisVistosResult] = await Promise.all([
    supabase.from('produtos').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase
      .from('produtos')
      .select('id', { count: 'exact', head: true })
      .eq('ativo', true)
      .is('deleted_at', null),
    supabase
      .from('produtos')
      .select('id', { count: 'exact', head: true })
      .eq('condicao', 'novo')
      .is('deleted_at', null),
    supabase
      .from('produtos')
      .select('id', { count: 'exact', head: true })
      .eq('condicao', 'seminovo')
      .is('deleted_at', null),
    supabase.from('produtos').select('visualizacoes_total').is('deleted_at', null),
    supabase
      .from('produtos')
      .select('id, nome, foto_principal, visualizacoes_total, preco')
      .is('deleted_at', null)
      .order('visualizacoes_total', { ascending: false })
      .limit(5),
  ])

  const totalVisualizacoes =
    visualizacoesResult.data?.reduce(
      (acc: number, curr: { visualizacoes_total: number | null }) => acc + (curr.visualizacoes_total || 0),
      0
    ) || 0

  return {
    totalProdutos: totalProdutosResult.count || 0,
    produtosAtivos: produtosAtivosResult.count || 0,
    produtosNovos: produtosNovosResult.count || 0,
    produtosSeminovos: produtosSeminovosResult.count || 0,
    totalVisualizacoes,
    topProdutos: (maisVistosResult.data as ProdutoView[] | null) || [],
  }
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState(() => ({
    totalProdutos: 0,
    produtosAtivos: 0,
    produtosNovos: 0,
    produtosSeminovos: 0,
    totalVisualizacoes: 0,
  }))
  const [topProdutos, setTopProdutos] = useState<ProdutoView[]>([])
  const [loading, setLoading] = useState(true)
  const [isResetting, startReset] = useTransition()

  const loadStats = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true)
    }

    const snapshot = await fetchStats()

    setStats({
      totalProdutos: snapshot.totalProdutos,
      produtosAtivos: snapshot.produtosAtivos,
      produtosNovos: snapshot.produtosNovos,
      produtosSeminovos: snapshot.produtosSeminovos,
      totalVisualizacoes: snapshot.totalVisualizacoes,
    })
    setTopProdutos(snapshot.topProdutos)
    setLoading(false)
  }, [])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadStats()
    }, 0)
    return () => window.clearTimeout(handle)
  }, [loadStats])

  function handleResetAnalytics() {
    if (loading || isResetting) {
      return
    }

    const confirmed = window.confirm(
      'Tem certeza que deseja zerar todas as visualizações registradas? Esta ação não pode ser desfeita.'
    )

    if (!confirmed) {
      return
    }

    startReset(async () => {
      const result = await resetAnalytics()

      if (!result?.success) {
        toast.error('Não foi possível zerar as visualizações', {
          description: result?.error || 'Tente novamente em instantes.',
          duration: 4000,
        })
        return
      }

      toast.success('Visualizações zeradas com sucesso!', {
        duration: 3500,
      })

      await loadStats({ silent: true })
    })
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <div className="text-center">
          <div className="relative mx-auto h-8 w-8 animate-pulse">
            <div className="h-full w-full rounded-full border-4 border-zinc-700 opacity-40 brightness-150 grayscale" />
          </div>
          <p className="mt-4 text-sm text-zinc-400">Carregando analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white md:text-2xl">Analytics</h2>
          <p className="text-xs text-zinc-400 md:text-sm">Métricas e estatísticas do seu catálogo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadStats()}
            className="gap-2"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAnalytics}
            disabled={isResetting}
            className="gap-2 border-red-500 text-red-400 hover:bg-red-500/10 hover:text-red-200"
          >
            <RotateCcw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Zerando...' : 'Zerar métricas'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Produtos Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.produtosAtivos}</div>
            <p className="text-xs text-zinc-500">
              {stats.totalProdutos > 0
                ? ((stats.produtosAtivos / stats.totalProdutos) * 100).toFixed(0)
                : 0}
              % do total
            </p>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium text-zinc-400">Receita Potencial</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {topProdutos.reduce((acc, produto) => acc + produto.preco, 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <p className="text-xs text-zinc-500">Somatório dos mais vistos</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Produtos Mais Visualizados</CardTitle>
          <CardDescription className="text-zinc-400">
            Top 5 produtos com mais acessos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topProdutos.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Nenhum produto cadastrado ainda
            </p>
          ) : (
            <div className="space-y-4">
              {topProdutos.map((produto, index) => (
                <div
                  key={produto.id}
                  className="flex items-center gap-4 rounded-lg border border-zinc-800 p-4"
                >
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

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Observações</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-400">
          <ul className="list-inside list-disc space-y-1">
            <li>
              As visualizações são contabilizadas automaticamente quando um visitante acessa a página do produto
            </li>
            <li>Os dados são atualizados em tempo real a cada visualização</li>
            <li>Use o botão &quot;Atualizar&quot; para ver as estatísticas mais recentes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
