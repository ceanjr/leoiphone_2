import { Suspense } from 'react'
import { Package, DollarSign, Eye, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/admin/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/shared/loading'
import { createClient } from '@/lib/supabase/server'

async function getStats() {
  try {
    const supabase = await createClient()

    // Executar todas as queries em paralelo para melhor performance
    const results = await Promise.all([
      // Total de produtos
      supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null),

      // Produtos ativos
      supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)
        .is('deleted_at', null),

      // Produtos novos
      supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('condicao', 'novo')
        .is('deleted_at', null),

      // Produtos seminovos
      supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('condicao', 'seminovo')
        .is('deleted_at', null),

      // Total de visualizações
      supabase.from('produtos').select('visualizacoes_total').is('deleted_at', null),

      // Produtos mais visualizados
      supabase
        .from('produtos')
        .select('id, nome, foto_principal, visualizacoes_total, preco')
        .is('deleted_at', null)
        .order('visualizacoes_total', { ascending: false })
        .limit(5),
    ])

    const [
      totalProdutosResult,
      produtosAtivosResult,
      produtosNovosResult,
      produtosSeminovosResult,
      visualizacoesResult,
      maisVistosResult,
    ] = results

    // Verificar erros
    if (totalProdutosResult.error) console.error('Erro ao buscar total de produtos:', totalProdutosResult.error)
    if (visualizacoesResult.error) console.error('Erro ao buscar visualizações:', visualizacoesResult.error)
    if (maisVistosResult.error) console.error('Erro ao buscar mais vistos:', maisVistosResult.error)

    const totalVisualizacoes =
      visualizacoesResult.data?.reduce((acc: number, curr: any) => acc + (curr.visualizacoes_total || 0), 0) || 0

    return {
      totalProdutos: totalProdutosResult.count || 0,
      produtosAtivos: produtosAtivosResult.count || 0,
      produtosInativos: (totalProdutosResult.count || 0) - (produtosAtivosResult.count || 0),
      produtosNovos: produtosNovosResult.count || 0,
      produtosSeminovos: produtosSeminovosResult.count || 0,
      totalVisualizacoes,
      maisVistos: maisVistosResult.data || [],
    }
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error)
    // Retornar valores padrão em caso de erro
    return {
      totalProdutos: 0,
      produtosAtivos: 0,
      produtosInativos: 0,
      produtosNovos: 0,
      produtosSeminovos: 0,
      totalVisualizacoes: 0,
      maisVistos: [],
    }
  }
}

async function DashboardStats() {
  const stats = await getStats()

  return (
    <>
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalProdutos}</div>
            <p className="text-xs text-zinc-500">
              {stats.produtosAtivos} ativos, {stats.produtosInativos} inativos
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Condição</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.produtosNovos}</div>
            <p className="text-xs text-zinc-500">
              novos / {stats.produtosSeminovos} seminovos
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalVisualizacoes.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-zinc-500">Total no catálogo</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Ação Rápida</CardTitle>
            <Plus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <Link href="/admin/produtos?modal=create">
              <Button className="w-full">Novo Produto</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Produtos Mais Vistos */}
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-white">Produtos Mais Visualizados</CardTitle>
          <CardDescription className="text-zinc-400">
            Top 5 produtos com mais acessos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.maisVistos.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-8">
              Nenhum produto cadastrado ainda
            </p>
          ) : (
            <div className="space-y-4">
              {stats.maisVistos.map((produto: any, index: number) => (
                <div
                  key={produto.id}
                  className="flex items-center gap-4 rounded-lg border border-zinc-800 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>

                  {produto.foto_principal && (
                    <img
                      src={produto.foto_principal}
                      alt={produto.nome}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  )}

                  <div className="flex-1">
                    <h4 className="font-medium text-white">{produto.nome}</h4>
                    <p className="text-sm text-zinc-400">
                      R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-400">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {produto.visualizacoes_total.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Atalhos Rápidos */}
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-white">Ações Rápidas</CardTitle>
          <CardDescription className="text-zinc-400">
            Atalhos para funcionalidades principais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/produtos">
              <Button variant="outline" className="w-full justify-start border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800">
                <Package className="mr-2 h-4 w-4" />
                Ver Todos os Produtos
              </Button>
            </Link>

            <Link href="/admin/categorias">
              <Button variant="outline" className="w-full justify-start border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800">
                <DollarSign className="mr-2 h-4 w-4" />
                Gerenciar Categorias
              </Button>
            </Link>

            <Link href="/admin/banners">
              <Button variant="outline" className="w-full justify-start border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800">
                <Plus className="mr-2 h-4 w-4" />
                Configurar Banners
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col">
      <Header
        title="Dashboard"
        description="Visão geral do catálogo de produtos"
      />

      <div className="flex-1 space-y-4 p-6">
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center">
              <Loading size="lg" text="Carregando estatísticas..." />
            </div>
          }
        >
          <DashboardStats />
        </Suspense>
      </div>
    </div>
  )
}
