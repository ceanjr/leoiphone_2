import { getBannerClickStats } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { BarChart3, MousePointerClick, Users } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Métricas de Cliques | Admin',
  description: 'Estatísticas de cliques em produtos em destaque',
}

export default async function MetricasPage() {
  const { data: stats, error } = await getBannerClickStats()

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar métricas</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Cliques</CardTitle>
            <CardDescription>Nenhum banner de produtos em destaque ativo encontrado</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const totalGlobalClicks = stats.reduce((sum, banner) => sum + banner.total_clicks, 0)
  const totalGlobalVisitors = stats.reduce((sum, banner) => sum + banner.unique_visitors, 0)

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Métricas de Cliques</h1>
        <p className="text-muted-foreground">
          Estatísticas de interação com produtos em destaque
        </p>
      </div>

      {/* Cards de resumo global */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGlobalClicks}</div>
            <p className="text-xs text-muted-foreground">
              Em todos os banners ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGlobalVisitors}</div>
            <p className="text-xs text-muted-foreground">
              Usuários distintos que clicaram
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banners Ativos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.length}</div>
            <p className="text-xs text-muted-foreground">
              Com produtos em destaque
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas por banner */}
      {stats.map((banner) => (
        <Card key={banner.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{banner.titulo}</CardTitle>
                <CardDescription>
                  {banner.total_clicks} cliques totais • {banner.unique_visitors} visitantes únicos
                </CardDescription>
              </div>
              <Badge variant="secondary">{banner.produtos.length} produtos</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {banner.produtos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum clique registrado ainda</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Total Cliques</TableHead>
                    <TableHead className="text-center">Visitantes Únicos</TableHead>
                    <TableHead className="text-center">Taxa de Conversão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banner.produtos.map((produto) => {
                    const conversionRate = produto.total_clicks > 0
                      ? ((produto.unique_visitors / produto.total_clicks) * 100).toFixed(1)
                      : '0'

                    return (
                      <TableRow key={produto.produto_id}>
                        <TableCell className="font-medium">{produto.produto_nome}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{produto.total_clicks}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{produto.unique_visitors}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={Number(conversionRate) > 50 ? 'default' : 'secondary'}>
                            {conversionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/produto/${produto.produto_slug}`}
                            target="_blank"
                            className="text-sm text-primary hover:underline"
                          >
                            Ver produto
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
