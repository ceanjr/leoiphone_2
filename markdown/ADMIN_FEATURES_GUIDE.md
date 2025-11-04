# Guia de Funcionalidades Administrativas - SRiPhone

## Índice
1. [Sistema de Design e Estilização](#sistema-de-design-e-estilização)
2. [Dashboard (com Analytics Integrado)](#dashboard-com-analytics-integrado)
3. [Gerenciamento de Produtos](#gerenciamento-de-produtos)
4. [Categorias](#categorias)
5. [Sistema de Taxas](#sistema-de-taxas)

---

## Sistema de Design e Estilização

### Tema e Paleta de Cores
```css
/* globals.css */
:root {
  --brand-yellow: #facc15;
  --brand-black: #18181b;
  --brand-gray: #27272a;

  /* Background */
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;

  /* Cards e Containers */
  --card: 0 0% 9%;
  --card-foreground: 0 0% 98%;

  /* Borders */
  --border: 0 0% 20%;

  /* Primary (Amarelo) */
  --primary: 45 93% 47%;
  --primary-foreground: 45 5% 11%;
}
```

### Layout do Admin
```typescript
// app/admin/layout.tsx
import { AdminHeader } from '@/components/admin/header'
import { AdminSidebar } from '@/components/admin/sidebar'
import { MobileNav } from '@/components/admin/mobile-nav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Desktop Sidebar */}
      <AdminSidebar className="hidden lg:flex" />

      <div className="flex flex-1 flex-col">
        {/* Header com título e ações */}
        <AdminHeader />

        {/* Conteúdo Principal */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  )
}
```

### Componentes Base
```typescript
// components/admin/sidebar.tsx
import { Package, LayoutDashboard, Tags, DollarSign, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Package, label: 'Produtos', href: '/admin/produtos' },
  { icon: Tags, label: 'Categorias', href: '/admin/categorias' },
  { icon: DollarSign, label: 'Taxas', href: '/admin/taxas' },
  { icon: Activity, label: 'Analytics', href: '/admin/analytics' },
]

export function AdminSidebar() {
  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900">
      <div className="flex h-16 items-center px-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-[var(--brand-yellow)]">SRiPhone Admin</h1>
      </div>

      <nav className="space-y-1 p-4">
        {menuItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className="w-full justify-start gap-3 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            asChild
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
    </aside>
  )
}
```

---

## Dashboard (com Analytics Integrado)

O Dashboard agora integra todas as funcionalidades de analytics em tempo real, com atualização automática a cada 10 segundos.

### Estrutura
```typescript
// app/admin/dashboard/page.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Users, Activity, Eye, TrendingUp, Package, DollarSign, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

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
  const [stats, setStats] = useState<AnalyticsStats>({...})
  const [period, setPeriod] = useState<PeriodFilter>('today')
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const loadStats = useCallback(async () => {
    const supabase = createClient()

    // Limpar sessões antigas
    await supabase.rpc('cleanup_inactive_sessions')

    // Buscar todas as métricas em paralelo
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
      supabase.from('active_sessions')
        .select('visitor_id', { count: 'exact', head: true })
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()),

      // Visitantes únicos hoje
      supabase.from('page_views')
        .select('visitor_id')
        .gte('created_at', startOfToday.toISOString()),

      // Conversões (cliques WhatsApp)
      supabase.from('conversions')
        .select('visitor_id')
        .gte('created_at', startOfToday.toISOString()),

      // ... outras queries
    ])

    setStats({...})
    setLastUpdate(new Date())
  }, [])

  // Polling a cada 10 segundos
  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 10000)
    return () => clearInterval(interval)
  }, [loadStats])

  return (
    <div className="space-y-6">
      {/* Header com timestamp e botão refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-sm text-zinc-400">
            Atualizado às {formatTime(lastUpdate)} • Atualização automática a cada 10s
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats}>
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Métricas em Tempo Real */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/10 to-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Usuários Online</CardTitle>
            <Activity className="h-5 w-5 animate-pulse text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.usuariosOnline}</div>
            <p className="text-xs text-zinc-500">Agora mesmo</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Visitantes</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{displayVisitors}</div>
              {/* Toggle Hoje/Mês */}
              <div className="flex gap-1">
                <Button size="sm" variant={period === 'today' ? 'default' : 'ghost'}>
                  Hoje
                </Button>
                <Button size="sm" variant={period === 'month' ? 'default' : 'ghost'}>
                  Mês
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProdutos}</div>
            <p className="text-xs text-zinc-500">{stats.produtosAtivos} ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Outras Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Visualizações Totais</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalVisualizacoes.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-zinc-500">
              {displayConversoes} conversões de {displayVisitors} visitantes
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Receita Potencial</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.topProdutos
                .reduce((acc, p) => acc + p.preco, 0)
                .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500">Top 5 produtos</p>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Produtos Mais Visualizados */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Produtos Mais Visualizados</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Lista com fotos, nomes, preços e visualizações */}
        </CardContent>
      </Card>
    </div>
  )
}
```

### Funcionalidades do Dashboard

1. **Métricas em Tempo Real:**
   - Usuários Online (últimos 5 minutos) com ícone animado
   - Visitantes (toggle Hoje/Mês)
   - Taxa de Conversão Real (cliques WhatsApp / visitantes)
   - Total de Produtos e Visualizações
   - Receita Potencial (soma top 5 produtos)

2. **Auto-atualização:**
   - Polling a cada 10 segundos
   - Timestamp da última atualização
   - Botão manual de refresh

3. **Modo Desenvolvimento:**
   - Aviso visual quando não está em produção
   - Tracking desabilitado em localhost

4. **Top 5 Produtos:**
   - Lista com foto, nome, preço
   - Contagem de visualizações
   - Ordenado por mais acessos

---

## Gerenciamento de Produtos

### 1. Tabela de Produtos

```typescript
// components/admin/produtos-table.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Edit, Trash2, Eye, EyeOff, DollarSign } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { updatePrecoRapido, toggleAtivo, deleteProduto } from '@/app/admin/produtos/actions'

export function ProdutosTable({ produtos }: { produtos: Produto[] }) {
  const [editingPreco, setEditingPreco] = useState<string | null>(null)
  const [novoPreco, setNovoPreco] = useState<string>('')

  async function handlePrecoRapido(produtoId: string) {
    const preco = parseFloat(novoPreco)
    if (isNaN(preco) || preco <= 0) {
      toast.error('Preço inválido')
      return
    }

    const result = await updatePrecoRapido(produtoId, preco)
    if (result.success) {
      toast.success('Preço atualizado!')
      setEditingPreco(null)
    } else {
      toast.error(result.error)
    }
  }

  async function handleToggleAtivo(produtoId: string, ativo: boolean) {
    const result = await toggleAtivo(produtoId, !ativo)
    if (result.success) {
      toast.success(ativo ? 'Produto desativado' : 'Produto ativado')
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
            <TableHead className="text-zinc-400">Foto</TableHead>
            <TableHead className="text-zinc-400">Produto</TableHead>
            <TableHead className="text-zinc-400">Categoria</TableHead>
            <TableHead className="text-zinc-400">Preço</TableHead>
            <TableHead className="text-zinc-400">Estoque</TableHead>
            <TableHead className="text-zinc-400">Status</TableHead>
            <TableHead className="text-zinc-400 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.map((produto) => (
            <TableRow key={produto.id} className="border-zinc-800 hover:bg-zinc-900/50">
              <TableCell>
                {produto.foto_principal ? (
                  <Image
                    src={produto.foto_principal}
                    alt={produto.nome}
                    width={40}
                    height={40}
                    className="rounded object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-zinc-800" />
                )}
              </TableCell>

              <TableCell>
                <div>
                  <p className="font-medium text-white">{produto.nome}</p>
                  <p className="text-xs text-zinc-500">{produto.codigo_produto || 'Sem código'}</p>
                </div>
              </TableCell>

              <TableCell className="text-zinc-300">
                {produto.categoria?.nome}
              </TableCell>

              <TableCell>
                {editingPreco === produto.id ? (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={novoPreco}
                      onChange={(e) => setNovoPreco(e.target.value)}
                      className="h-8 w-24 bg-zinc-800 text-white"
                      placeholder="0.00"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handlePrecoRapido(produto.id)}
                      className="h-8 px-2"
                    >
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingPreco(null)}
                      className="h-8 px-2"
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-white">
                      {produto.preco.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingPreco(produto.id)
                        setNovoPreco(produto.preco.toString())
                      }}
                      className="h-6 w-6 p-0 text-zinc-400 hover:text-white"
                    >
                      <DollarSign className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </TableCell>

              <TableCell>
                <Badge
                  variant={produto.estoque > 2 ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {produto.estoque}
                </Badge>
              </TableCell>

              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleAtivo(produto.id, produto.ativo)}
                  className="h-8 px-2 gap-1"
                >
                  {produto.ativo ? (
                    <>
                      <Eye className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-500">Ativo</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3 text-zinc-500" />
                      <span className="text-xs text-zinc-500">Inativo</span>
                    </>
                  )}
                </Button>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {/* Abrir dialog de edição */}}
                    className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {/* Confirmar e deletar */}}
                    className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

### 2. Exportar Imagens

```typescript
// components/admin/produtos/export-images-dialog.tsx
'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

interface ExportImagesDialogProps {
  produtos: Produto[]
}

export function ExportImagesDialog({ produtos }: ExportImagesDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    if (selectedIds.size === 0) {
      toast.error('Selecione pelo menos um produto')
      return
    }

    setExporting(true)
    const zip = new JSZip()

    try {
      const produtosSelecionados = produtos.filter(p => selectedIds.has(p.id))

      for (const produto of produtosSelecionados) {
        const folder = zip.folder(produto.slug)

        for (let i = 0; i < produto.fotos.length; i++) {
          const url = produto.fotos[i]
          const response = await fetch(url)
          const blob = await response.blob()
          const ext = url.split('.').pop()?.split('?')[0] || 'jpg'
          folder?.file(`${i + 1}.${ext}`, blob)
        }
      }

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `produtos-${new Date().getTime()}.zip`)
      toast.success('Imagens exportadas com sucesso!')
      setOpen(false)
    } catch (error) {
      toast.error('Erro ao exportar imagens')
      console.error(error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Imagens
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-white">Exportar Imagens dos Produtos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-zinc-800 p-4">
            {produtos.map((produto) => (
              <div
                key={produto.id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-800"
              >
                <Checkbox
                  checked={selectedIds.has(produto.id)}
                  onCheckedChange={(checked) => {
                    const newSet = new Set(selectedIds)
                    if (checked) {
                      newSet.add(produto.id)
                    } else {
                      newSet.delete(produto.id)
                    }
                    setSelectedIds(newSet)
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{produto.nome}</p>
                  <p className="text-xs text-zinc-400">{produto.fotos.length} imagens</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedIds.size === produtos.length) {
                  setSelectedIds(new Set())
                } else {
                  setSelectedIds(new Set(produtos.map(p => p.id)))
                }
              }}
            >
              {selectedIds.size === produtos.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>

            <Button
              onClick={handleExport}
              disabled={exporting || selectedIds.size === 0}
              className="gap-2"
            >
              {exporting ? 'Exportando...' : 'Exportar ZIP'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 3. Server Actions

```typescript
// app/admin/produtos/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updatePrecoRapido(produtoId: string, preco: number) {
  const supabase = createClient()

  const { error } = await supabase
    .from('produtos')
    .update({ preco, updated_at: new Date().toISOString() })
    .eq('id', produtoId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/produtos')
  revalidatePath('/(public)', 'layout')
  return { success: true }
}

export async function toggleAtivo(produtoId: string, ativo: boolean) {
  const supabase = createClient()

  const { error } = await supabase
    .from('produtos')
    .update({ ativo, updated_at: new Date().toISOString() })
    .eq('id', produtoId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/produtos')
  revalidatePath('/(public)', 'layout')
  return { success: true }
}

export async function deleteProduto(produtoId: string) {
  const supabase = createClient()

  // Soft delete
  const { error } = await supabase
    .from('produtos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', produtoId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/produtos')
  revalidatePath('/(public)', 'layout')
  return { success: true }
}
```

---

## Categorias

### Interface de Gerenciamento

```typescript
// app/admin/categorias/page.tsx
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoriasTable } from '@/components/admin/categorias-table'
import { CategoriaDialog } from '@/components/admin/categoria-dialog'
import { createClient } from '@/lib/supabase/server'

export default async function CategoriasPage() {
  const supabase = createClient()

  const { data: categorias } = await supabase
    .from('categorias')
    .select('*')
    .order('ordem', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Categorias</h1>
          <p className="text-zinc-400">Gerencie as categorias de produtos</p>
        </div>

        <CategoriaDialog>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Categoria
          </Button>
        </CategoriaDialog>
      </div>

      <CategoriasTable categorias={categorias || []} />
    </div>
  )
}
```

### Tabela de Categorias

```typescript
// components/admin/categorias-table.tsx
'use client'

import { Edit, Trash2, GripVertical } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { updateOrdem } from '@/app/admin/categorias/actions'

export function CategoriasTable({ categorias }: { categorias: Categoria[] }) {
  async function handleDragEnd(result: any) {
    if (!result.destination) return

    const items = Array.from(categorias)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Atualizar ordem no banco
    const updates = items.map((item, index) => ({
      id: item.id,
      ordem: index + 1
    }))

    await updateOrdem(updates)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
              <TableHead className="w-12 text-zinc-400"></TableHead>
              <TableHead className="text-zinc-400">Nome</TableHead>
              <TableHead className="text-zinc-400">Slug</TableHead>
              <TableHead className="text-zinc-400">Produtos</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <Droppable droppableId="categorias">
            {(provided) => (
              <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                {categorias.map((categoria, index) => (
                  <Draggable key={categoria.id} draggableId={categoria.id} index={index}>
                    {(provided) => (
                      <TableRow
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border-zinc-800 hover:bg-zinc-900/50"
                      >
                        <TableCell>
                          <div {...provided.dragHandleProps} className="cursor-grab">
                            <GripVertical className="h-4 w-4 text-zinc-500" />
                          </div>
                        </TableCell>

                        <TableCell className="font-medium text-white">
                          {categoria.nome}
                        </TableCell>

                        <TableCell className="text-zinc-400">
                          {categoria.slug}
                        </TableCell>

                        <TableCell>
                          <Badge variant="secondary">
                            {categoria._count?.produtos || 0}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge variant={categoria.ativo ? 'default' : 'secondary'}>
                            {categoria.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </TableBody>
            )}
          </Droppable>
        </Table>
      </div>
    </DragDropContext>
  )
}
```

---

## Sistema de Taxas

### 1. Configuração de Taxas

```typescript
// app/admin/taxas/page.tsx
import { TaxasForm } from '@/components/admin/taxas-form'
import { createClient } from '@/lib/supabase/server'

export default async function TaxasPage() {
  const supabase = createClient()

  const { data: config } = await supabase
    .from('configuracoes_taxas')
    .select('*')
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Taxas e Parcelas</h1>
        <p className="text-zinc-400">Configure as taxas aplicadas no parcelamento</p>
      </div>

      <TaxasForm initialData={config} />
    </div>
  )
}
```

### 2. Formulário de Taxas

```typescript
// components/admin/taxas-form.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { updateTaxas } from '@/app/admin/taxas/actions'

export function TaxasForm({ initialData }: { initialData: ConfiguracaoTaxas }) {
  const [ativo, setAtivo] = useState(initialData?.ativo ?? false)
  const [taxas, setTaxas] = useState(initialData?.taxas || {
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = await updateTaxas({ ativo, taxas })

    if (result.success) {
      toast.success('Configuração salva com sucesso!')
    } else {
      toast.error(result.error || 'Erro ao salvar')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Sistema de Taxas</CardTitle>
              <CardDescription className="text-zinc-400">
                Ative ou desative as taxas de parcelamento
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="ativo" className="text-zinc-400">
                {ativo ? 'Ativado' : 'Desativado'}
              </Label>
              <Switch
                id="ativo"
                checked={ativo}
                onCheckedChange={setAtivo}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(taxas).map(([parcela, taxa]) => (
              <div key={parcela} className="space-y-2">
                <Label htmlFor={`taxa-${parcela}`} className="text-zinc-300">
                  {parcela}x - Taxa (%)
                </Label>
                <Input
                  id={`taxa-${parcela}`}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxa}
                  onChange={(e) => setTaxas({
                    ...taxas,
                    [parcela]: parseFloat(e.target.value) || 0
                  })}
                  disabled={!ativo}
                  className="bg-zinc-800 text-white"
                />
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h4 className="mb-2 font-semibold text-white">Exemplo de Cálculo</h4>
            <p className="text-sm text-zinc-400">
              Produto de <span className="font-medium text-white">R$ 1.000,00</span> em{' '}
              <span className="font-medium text-white">6x</span> com taxa de{' '}
              <span className="font-medium text-white">{taxas[6]}%</span>:
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              = R$ {((1000 * (1 + taxas[6] / 100)) / 6).toFixed(2)} por mês
            </p>
          </div>

          <Button type="submit" className="w-full md:w-auto">
            Salvar Configuração
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
```

### 3. Server Action

```typescript
// app/admin/taxas/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateTaxas(data: { ativo: boolean; taxas: Record<string, number> }) {
  const supabase = createClient()

  const { error } = await supabase
    .from('configuracoes_taxas')
    .upsert({
      id: 1, // Sempre usar o mesmo ID
      ativo: data.ativo,
      taxas: data.taxas,
      updated_at: new Date().toISOString()
    })

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidar todas as páginas de produtos
  revalidatePath('/(public)', 'layout')
  revalidatePath('/admin/taxas')

  return { success: true }
}
```

### 4. Implementação na Página do Produto

```typescript
// app/(public)/produto/[slug]/page.tsx
import { CalculadoraParcelas } from '@/components/public/calculadora-parcelas'
import { createClient } from '@/lib/supabase/server'

export default async function ProdutoPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const [produtoRes, taxasRes] = await Promise.all([
    supabase.from('produtos').select('*').eq('slug', params.slug).single(),
    supabase.from('configuracoes_taxas').select('*').single()
  ])

  return (
    <div>
      {/* Informações do produto */}

      {/* Calculadora de Parcelas */}
      <CalculadoraParcelas
        preco={produtoRes.data.preco}
        taxasConfig={taxasRes.data}
      />
    </div>
  )
}
```

### 5. Componente Calculadora

```typescript
// components/public/calculadora-parcelas.tsx
'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

interface CalculadoraParcelasProps {
  preco: number
  taxasConfig: ConfiguracaoTaxas | null
}

export function CalculadoraParcelas({ preco, taxasConfig }: CalculadoraParcelasProps) {
  const parcelas = useMemo(() => {
    if (!taxasConfig?.ativo) {
      return Array.from({ length: 12 }, (_, i) => ({
        parcela: i + 1,
        valor: preco / (i + 1),
        total: preco,
        taxa: 0
      }))
    }

    return Object.entries(taxasConfig.taxas).map(([parcela, taxa]) => {
      const numParcelas = parseInt(parcela)
      const taxaDecimal = taxa / 100
      const total = preco * (1 + taxaDecimal)
      const valorParcela = total / numParcelas

      return {
        parcela: numParcelas,
        valor: valorParcela,
        total,
        taxa
      }
    })
  }, [preco, taxasConfig])

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <CreditCard className="h-5 w-5" />
          Formas de Pagamento
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {parcelas.map((item) => (
            <div
              key={item.parcela}
              className="flex items-center justify-between rounded-lg border border-zinc-800 p-3 hover:border-yellow-500/40"
            >
              <div>
                <p className="font-medium text-white">
                  {item.parcela}x de{' '}
                  {item.valor.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
                {item.taxa > 0 && (
                  <p className="text-xs text-zinc-400">
                    Taxa de {item.taxa}% • Total: {item.total.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </p>
                )}
              </div>

              {item.taxa === 0 && item.parcela === 1 && (
                <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">
                  À vista
                </span>
              )}

              {item.taxa === 0 && item.parcela > 1 && (
                <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400">
                  Sem juros
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## Sistema de Presets de Taxas

O sistema de presets permite salvar múltiplas configurações de taxas e alternar entre elas rapidamente, facilitando a gestão de diferentes estratégias de parcelamento.

### 1. Schema e Validação

```typescript
// lib/validations/taxas.ts
import { z } from 'zod'

// Schema para presets de taxas
export const presetTaxasSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo'),
  taxas: taxasSchema,
  is_default: z.boolean().default(false),
})

export type PresetTaxas = z.infer<typeof presetTaxasSchema>
```

### 2. Server Actions para Presets

```typescript
// app/admin/taxas/actions.ts (adicionar ao arquivo existente)

/**
 * Busca todos os presets de taxas
 */
export async function getPresets() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('presets_taxas')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return { presets: [], error: 'Erro ao carregar presets' }
  }

  return { presets: data as PresetTaxas[], error: null }
}

/**
 * Cria um novo preset
 */
export async function createPreset(preset: Omit<PresetTaxas, 'id'>) {
  const supabase = await createClient()
  const validated = presetTaxasSchema.omit({ id: true }).safeParse(preset)

  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message }
  }

  // Se for preset padrão, remover is_default dos outros
  if (validated.data.is_default) {
    await supabase
      .from('presets_taxas')
      .update({ is_default: false })
  }

  const { data, error } = await supabase
    .from('presets_taxas')
    .insert(validated.data)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/taxas')
  return { success: true, preset: data }
}

/**
 * Aplica um preset às taxas atuais
 */
export async function applyPreset(presetId: string) {
  const supabase = await createClient()

  const { data: preset, error } = await supabase
    .from('presets_taxas')
    .select('*')
    .eq('id', presetId)
    .single()

  if (error || !preset) {
    return { success: false, error: 'Preset não encontrado' }
  }

  const { configuracao } = await getConfiguracaoTaxas()

  return updateConfiguracaoTaxas({
    ativo: configuracao?.ativo ?? false,
    taxas: preset.taxas,
  })
}

/**
 * Deleta um preset
 */
export async function deletePreset(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('presets_taxas').delete().eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/taxas')
  return { success: true }
}
```

### 3. Interface de Presets na Página Admin

A página `/admin/taxas` agora inclui um card lateral com a gestão de presets:

```typescript
// Estrutura do Card de Presets
<Card className="border-zinc-800 bg-zinc-900">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-white">
      <Bookmark className="h-5 w-5 text-[var(--brand-yellow)]" />
      Presets
    </CardTitle>
    <CardDescription>Salve e aplique configurações rapidamente</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Formulário para criar novo preset */}
    <div className="flex gap-2">
      <Input
        placeholder="Nome do preset"
        value={newPresetName}
        onChange={(e) => setNewPresetName(e.target.value)}
      />
      <Button onClick={handleSavePreset}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>

    {/* Lista de presets salvos */}
    {presets.map((preset) => (
      <div key={preset.id} className="flex items-center justify-between">
        <p>{preset.nome}</p>
        <div className="flex gap-1">
          <Button onClick={() => handleApplyPreset(preset.id)}>
            <Check className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleDeletePreset(preset.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ))}
  </CardContent>
</Card>
```

### 4. Funcionalidades do Sistema de Presets

- **Salvar configuração atual**: Permite nomear e salvar as taxas configuradas no momento
- **Aplicar preset**: Carrega instantaneamente um conjunto de taxas salvo
- **Deletar preset**: Remove presets que não são mais necessários
- **Preset padrão**: Marca um preset como configuração padrão (futuro)

### 5. Benefícios

1. **Troca rápida de estratégias**: Alterne entre "Padrão", "Promoção", "Black Friday" etc. em 1 clique
2. **Backup de configurações**: Mantenha histórico de diferentes configurações
3. **Redução de erros**: Não precisa digitar 18 valores manualmente toda vez
4. **Agilidade operacional**: De 8+ minutos para 5 segundos ao trocar taxas

---

## Calculadora de Taxas Pública

Disponível no header do site público, permite aos visitantes calcular parcelas de valores personalizados.

### 1. Componente da Calculadora

```typescript
// components/public/calculadora-taxas-dialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { Calculator } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { calcularTodasParcelas, formatarMoeda } from '@/lib/utils/calcular-parcelas'
import { getConfiguracaoTaxas } from '@/app/admin/taxas/actions'

export function CalculadoraTaxasDialog() {
  const [valor, setValor] = useState('')
  const [taxas, setTaxas] = useState(TAXAS_PADRAO)

  useEffect(() => {
    async function loadTaxas() {
      const { configuracao } = await getConfiguracaoTaxas()
      if (configuracao?.taxas) {
        setTaxas(configuracao.taxas)
      }
    }
    loadTaxas()
  }, [])

  const valorNumerico = parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0
  const parcelas = valorNumerico > 0 ? calcularTodasParcelas(valorNumerico, taxas) : []

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Calculator className="mr-2 h-4 w-4" />
          Calculadora de Taxas
        </Button>
      </DialogTrigger>

      <DialogContent>
        {/* Input de valor */}
        <Input
          type="text"
          placeholder="R$ 0,00"
          value={valor}
          onChange={handleValorChange}
        />

        {/* Tabela de parcelas */}
        {parcelas.map((parcela) => (
          <div key={parcela.numero}>
            <span>{parcela.numero}x de {formatarMoeda(parcela.valorParcela)}</span>
            <span className="text-xs">{parcela.taxa.toFixed(2)}% a.m.</span>
          </div>
        ))}
      </DialogContent>
    </Dialog>
  )
}
```

### 2. Integração no Header

```typescript
// components/public/header.tsx

export function PublicHeader() {
  return (
    <header>
      {/* Desktop */}
      <div className="hidden sm:flex items-center gap-3">
        <WhatsAppContactButton />
        <CalculadoraTaxasDialog />
        <Button asChild>
          <Link href="/admin">Admin</Link>
        </Button>
      </div>

      {/* Mobile - Menu Hambúrguer */}
      <div className="flex sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col gap-3">
              <WhatsAppContactButton className="w-full" />
              <CalculadoraTaxasDialog triggerClassName="w-full" />
              <Button asChild className="w-full">
                <Link href="/admin">Admin</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
```

### 3. Funcionalidades da Calculadora Pública

- **Input com formatação automática**: Valor digitado é formatado em tempo real como moeda
- **Cálculo instantâneo**: Mostra todas as opções de parcelamento (1x até 18x)
- **Destaque visual**: Parcela máxima destacada em card especial
- **Informações completas**: Mostra valor da parcela, taxa e total para cada opção
- **Responsivo**: Funciona perfeitamente em mobile e desktop

### 4. Menu Mobile

No mobile, todos os botões do header são agrupados em um menu hambúrguer:

- **Ícone de menu**: Botão com ícone de 3 linhas (hambúrguer)
- **Sheet lateral**: Abre menu deslizante da direita
- **Opções empilhadas**: WhatsApp, Calculadora e Admin em lista vertical
- **Touch targets**: Botões com altura mínima de 48px para melhor UX mobile


## Checklist de Implementação para SRiPhone

### 1. Setup Inicial
- [ ] Clonar repositório sriphone
- [ ] Configurar variáveis de ambiente Supabase
- [ ] Executar migrations SQL no Supabase

### 2. Estilização Base
- [ ] Copiar `globals.css` com tema personalizado
- [ ] Criar componentes UI base (`/components/ui/*`)
- [ ] Implementar layout admin (`/app/admin/layout.tsx`)
- [ ] Criar sidebar e header do admin

### 3. Dashboard (com Analytics Integrado)
- [ ] Implementar página de dashboard com analytics em tempo real
- [ ] Adicionar cards de estatísticas (usuários online, visitantes, conversões)
- [ ] Implementar polling automático a cada 10 segundos
- [ ] Adicionar toggle Hoje/Mês nos visitantes
- [ ] Integrar com queries do Supabase (page_views, active_sessions, conversions)

### 4. Produtos
- [ ] Criar tabela de produtos com ações inline
- [ ] Implementar troca rápida de preço
- [ ] Adicionar toggle de ativo/inativo
- [ ] Implementar exportação de imagens (instalar `jszip` e `file-saver`)
- [ ] Criar formulário de produto completo

### 5. Categorias
- [ ] Implementar CRUD de categorias
- [ ] Adicionar drag-and-drop para ordenação (instalar `@hello-pangea/dnd`)
- [ ] Criar tabela com contagem de produtos

### 6. Sistema de Taxas
- [ ] Criar tabela `configuracoes_taxas` no Supabase
- [ ] Implementar formulário de configuração
- [ ] Criar componente calculadora de parcelas
- [ ] Integrar calculadora na página do produto

### 7. Sistema de Tracking e Conversões
- [ ] Executar migration de analytics no Supabase (page_views, active_sessions, conversions)
- [ ] Criar hook `use-page-tracking.ts`
- [ ] Integrar PageTracker no layout público
- [ ] Implementar tracking de conversões no botão WhatsApp
- [ ] **ADAPTAR:** Trocar domínio de produção em todos os arquivos de tracking

### 8. Adaptações Específicas SRiPhone
- [ ] Trocar `leoiphone.com.br` por `sriphone.com.br` em:
  - `hooks/use-page-tracking.ts`
  - `components/shared/whatsapp-contact-button.tsx`
  - `app/admin/dashboard/page.tsx`
- [ ] Atualizar números de WhatsApp no componente de contato
- [ ] Ajustar cores do tema se necessário
- [ ] Configurar domínio de imagens no `next.config.ts`

---

## Dependências Necessárias

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.46.2",
    "@hello-pangea/dnd": "^17.0.0",
    "jszip": "^3.10.1",
    "file-saver": "^2.0.5",
    "sonner": "^1.7.1",
    "lucide-react": "^0.462.0",
    "zod": "^3.24.1",
    "react-hook-form": "^7.54.2"
  },
  "devDependencies": {
    "@types/file-saver": "^2.0.7"
  }
}
```

---

## Notas Finais

Este documento apresenta todas as funcionalidades administrativas implementadas no projeto Léo iPhone e adaptadas para implementação no projeto SRiPhone.

**Pontos-chave:**
1. Sistema totalmente baseado em Supabase (PostgreSQL)
2. Dashboard com analytics integrado e atualização em tempo real (polling 10s)
3. Tracking apenas em produção (domínio configurável)
4. Conversões rastreadas via cliques no WhatsApp
5. Sistema de taxas completamente configurável
6. UI moderna com Tailwind CSS e Radix UI

**Próximos passos:**
1. Seguir o checklist de implementação
2. Adaptar domínios e números de contato
3. Executar migrations no Supabase
4. Testar todas as funcionalidades
