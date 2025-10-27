'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Eye, TrendingUp, DollarSign, RefreshCw, RotateCcw } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { toast } from 'sonner'
import { resetAnalytics } from './actions'

interface ProdutoView {
  id: string
  nome: string
  foto_principal: string | null
  visualizacoes_total: number
  preco: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalProdutos: 0,
    produtosAtivos: 0,
    visualizacoesTotal: 0,
  })
  const [topProdutos, setTopProdutos] = useState<ProdutoView[]>([])
  const [loading, setLoading] = useState(true)
  const [isResetting, startReset] = useTransition()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats({ silent = false }: { silent?: boolean } = {}) {
    if (!silent) {
      setLoading(true)
    }
    const supabase = createClient()

    // Total de produtos
    const { count: total } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)

    // Produtos ativos
    const { count: ativos } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('ativo', true)

    // Top 20 produtos mais vistos
    const { data: produtos } = await supabase
      .from('produtos')
      .select('id, nome, foto_principal, visualizacoes_total, preco')
      .is('deleted_at', null)
      .order('visualizacoes_total', { ascending: false })
      .limit(20)

    const visualizacoesTotal = produtos?.reduce((sum, p) => sum + (p.visualizacoes_total || 0), 0) || 0

    setStats({
      totalProdutos: total || 0,
      produtosAtivos: ativos || 0,
      visualizacoesTotal,
    })
    setTopProdutos(produtos || [])
    setLoading(false)
  }

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

  const produtoMaisVisto = topProdutos[0]

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white md:text-2xl">Analytics</h2>
          <p className="text-xs text-zinc-400 md:text-sm">
            Métricas e estatísticas do seu catálogo
          </p>
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
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total de Produtos
            </CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalProdutos}</div>
            <p className="text-xs text-zinc-500">
              {stats.produtosAtivos} ativos
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Produtos Ativos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.produtosAtivos}</div>
            <p className="text-xs text-zinc-500">
              {stats.totalProdutos > 0 ? ((stats.produtosAtivos / stats.totalProdutos) * 100).toFixed(0) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Visualizações Totais
            </CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.visualizacoesTotal}</div>
            <p className="text-xs text-zinc-500">
              Todos os produtos
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Média de Visualizações
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalProdutos > 0 ? Math.round(stats.visualizacoesTotal / stats.totalProdutos) : 0}
            </div>
            <p className="text-xs text-zinc-500">
              Por produto
            </p>
          </CardContent>
        </Card>
      </div>

      {produtoMaisVisto && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Produto Mais Visto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-md bg-zinc-950">
                {produtoMaisVisto.foto_principal ? (
                  <Image
                    src={produtoMaisVisto.foto_principal}
                    alt={produtoMaisVisto.nome}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                    Sem foto
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{produtoMaisVisto.nome}</p>
                <p className="text-sm text-zinc-400">
                  {produtoMaisVisto.visualizacoes_total || 0} visualizações • R$ {produtoMaisVisto.preco.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Top 20 Produtos Mais Vistos</CardTitle>
        </CardHeader>
        <CardContent>
          {topProdutos.length === 0 ? (
            <p className="text-sm text-zinc-400">Nenhuma visualização registrada ainda</p>
          ) : (
            <div className="space-y-3">
              {topProdutos.map((produto, index) => (
                <div
                  key={produto.id}
                  className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-400">
                    {index + 1}
                  </div>
                  <div className="relative h-12 w-12 overflow-hidden rounded-md bg-zinc-900">
                    {produto.foto_principal ? (
                      <Image
                        src={produto.foto_principal}
                        alt={produto.nome}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                        Sem foto
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-white">{produto.nome}</p>
                    <p className="text-xs text-zinc-500">R$ {produto.preco.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-400">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">{produto.visualizacoes_total || 0}</span>
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
            <li>As visualizações são contabilizadas automaticamente quando um visitante acessa a página do produto</li>
            <li>Os dados são atualizados em tempo real a cada visualização</li>
            <li>Use o botão &quot;Atualizar&quot; para ver as estatísticas mais recentes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
