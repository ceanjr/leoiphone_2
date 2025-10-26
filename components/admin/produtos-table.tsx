'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Edit, Trash2, Eye, EyeOff, MoreVertical, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { deleteProduto, toggleProdutoAtivo } from '@/app/admin/produtos/actions'
import type { ProdutoComCategoria } from '@/types/produto'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProdutosTableProps {
  produtos: ProdutoComCategoria[]
}

export function ProdutosTable({ produtos }: ProdutosTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [produtoToDelete, setProdutoToDelete] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')

  // Extrair categorias únicas
  const categorias = useMemo(() => {
    const cats = new Map<string, { id: string; nome: string }>()
    produtos.forEach(p => {
      if (p.categoria && !cats.has(p.categoria.id)) {
        cats.set(p.categoria.id, { id: p.categoria.id, nome: p.categoria.nome })
      }
    })
    return Array.from(cats.values()).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [produtos])

  // Função para extrair número do modelo iPhone
  const extrairNumeroModelo = (nome: string): number => {
    // Casos especiais
    if (nome.toLowerCase().includes('iphone x') && !nome.toLowerCase().includes('xr') && !nome.toLowerCase().includes('xs')) return 10 // iPhone X = 10
    if (nome.toLowerCase().includes('iphone xr')) return 10.3 // iPhone XR entre X e 11
    if (nome.toLowerCase().includes('iphone xs')) return 10.5 // iPhone XS

    // Extrair número padrão (8, 11, 12, 13, 14, 15, 16)
    const match = nome.match(/iphone\s+(\d+)/i)
    if (match) return parseInt(match[1])

    // Se não for iPhone, retornar número alto
    return 9999
  }

  // Filtrar e ordenar produtos
  const produtosFiltrados = useMemo(() => {
    let resultado = [...produtos]

    // Aplicar busca por nome ou código
    if (busca.trim()) {
      const buscaLower = busca.toLowerCase()
      resultado = resultado.filter(
        (p) =>
          p.nome.toLowerCase().includes(buscaLower) ||
          p.codigo_produto?.toLowerCase().includes(buscaLower)
      )
    }

    // Aplicar filtro de categoria
    if (categoriaFiltro !== 'todas') {
      resultado = resultado.filter(p => p.categoria?.id === categoriaFiltro)
    }

    // Ordenar: iPhones em ordem crescente (8, X, XR, XS, 11, 12...), depois outras categorias alfabéticas
    resultado.sort((a, b) => {
      const nomeA = a.nome.toLowerCase()
      const nomeB = b.nome.toLowerCase()

      const isIphoneA = nomeA.includes('iphone')
      const isIphoneB = nomeB.includes('iphone')

      // Se ambos são iPhone, ordenar por modelo
      if (isIphoneA && isIphoneB) {
        const numA = extrairNumeroModelo(a.nome)
        const numB = extrairNumeroModelo(b.nome)

        if (numA !== numB) {
          return numA - numB
        }
        // Mesmo modelo, ordenar alfabeticamente
        return a.nome.localeCompare(b.nome)
      }

      // iPhones sempre vêm primeiro
      if (isIphoneA && !isIphoneB) return -1
      if (!isIphoneA && isIphoneB) return 1

      // Ambos não são iPhone: ordenar por categoria e depois alfabético
      const ordemA = a.categoria?.ordem ?? 9999
      const ordemB = b.categoria?.ordem ?? 9999

      if (ordemA !== ordemB) {
        return ordemA - ordemB
      }

      return a.nome.localeCompare(b.nome)
    })

    return resultado
  }, [produtos, busca, categoriaFiltro])

  async function handleDelete() {
    if (!produtoToDelete) return

    const result = await deleteProduto(produtoToDelete)

    if (result.success) {
      toast.success('Produto excluído com sucesso!')
      setDeleteDialogOpen(false)
      setProdutoToDelete(null)
    } else {
      toast.error(result.error || 'Erro ao excluir produto')
    }
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    const result = await toggleProdutoAtivo(id, !ativo)

    if (result.success) {
      toast.success(ativo ? 'Produto desativado' : 'Produto ativado')
    } else {
      toast.error(result.error || 'Erro ao alterar status')
    }
  }

  if (produtos.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center md:p-12">
        <p className="text-zinc-400">Nenhum produto cadastrado ainda.</p>
        <p className="mt-2 text-sm text-zinc-500">
          Clique em &quot;Novo Produto&quot; para adicionar o primeiro produto.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Filtros */}
      <div className="mb-4 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          {/* Barra de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              type="search"
              placeholder="Buscar por nome ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="border-zinc-800 bg-zinc-900 pl-10 text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Filtro de Categoria */}
          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="border-zinc-800 bg-zinc-900 text-white">
              <SelectValue placeholder="Filtrar por categoria" />
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

        {(busca || categoriaFiltro !== 'todas') && (
          <p className="text-sm text-zinc-400">
            {produtosFiltrados.length} produto(s) encontrado(s)
          </p>
        )}
      </div>

      {produtosFiltrados.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center md:p-12">
          <p className="text-zinc-400">Nenhum produto encontrado.</p>
          <Button
            variant="outline"
            onClick={() => {
              setBusca('')
              setCategoriaFiltro('todas')
            }}
            className="mt-4"
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <>
          {/* VIEW MOBILE: Cards */}
          <div className="flex flex-col gap-3 md:hidden" suppressHydrationWarning>
            {produtosFiltrados.map((produto) => (
          <div
            key={produto.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
            suppressHydrationWarning
          >
            {/* Header do Card */}
            <div className="mb-3 flex items-start gap-3" suppressHydrationWarning>
              {/* Foto */}
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-950" suppressHydrationWarning>
                {produto.foto_principal ? (
                  <Image
                    src={produto.foto_principal}
                    alt={produto.nome}
                    fill
                    sizes="64px"
                    className="object-cover"
                    suppressHydrationWarning
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                    Sem foto
                  </div>
                )}
              </div>

              {/* Info Principal */}
              <div className="min-w-0 flex-1" suppressHydrationWarning>
                <h3 className="truncate font-medium text-white">
                  {produto.nome}
                </h3>
                {produto.codigo_produto && (
                  <p className="text-xs text-zinc-500">
                    {produto.codigo_produto}
                  </p>
                )}
                <p className="mt-1 text-sm text-zinc-400">
                  {produto.categoria?.nome || '-'}
                </p>
              </div>

              {/* Menu de Ações */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/produtos/${produto.id}`} className="flex items-center">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleToggleAtivo(produto.id, produto.ativo)}
                  >
                    {produto.ativo ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Ativar
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setProdutoToDelete(produto.id)
                      setDeleteDialogOpen(true)
                    }}
                    className="text-red-400 focus:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Info Secundária */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-zinc-800 pt-3 text-sm" suppressHydrationWarning>
              <div suppressHydrationWarning>
                <span className="text-zinc-500">Preço</span>
                <p className="font-medium text-white">R$ {produto.preco.toFixed(2)}</p>
              </div>
              <div suppressHydrationWarning>
                <span className="text-zinc-500">Condição</span>
                <p>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      produto.condicao === 'novo'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-blue-900/30 text-blue-400'
                    }`}
                  >
                    {produto.condicao === 'novo' ? 'Novo' : 'Seminovo'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VIEW DESKTOP: Tabela */}
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900 md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400">Foto</TableHead>
              <TableHead className="text-zinc-400">Nome</TableHead>
              <TableHead className="text-zinc-400">Categoria</TableHead>
              <TableHead className="text-zinc-400">Preço</TableHead>
              <TableHead className="text-zinc-400">Condição</TableHead>
              <TableHead className="text-right text-zinc-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtosFiltrados.map((produto) => (
              <TableRow key={produto.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell>
                  <div className="relative h-12 w-12 overflow-hidden rounded-md bg-zinc-950">
                    {produto.foto_principal ? (
                      <Image
                        src={produto.foto_principal}
                        alt={produto.nome}
                        fill
                        sizes="48px"
                        className="object-cover"
                        suppressHydrationWarning
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                        Sem foto
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="min-w-[200px] font-medium text-white">
                  <div>
                    {produto.nome}
                    {produto.codigo_produto && (
                      <span className="ml-2 text-xs text-zinc-500">
                        ({produto.codigo_produto})
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-zinc-300">
                  {produto.categoria?.nome || '-'}
                </TableCell>
                <TableCell className="text-zinc-300">
                  R$ {produto.preco.toFixed(2)}
                </TableCell>
                <TableCell className="text-zinc-300">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      produto.condicao === 'novo'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-blue-900/30 text-blue-400'
                    }`}
                  >
                    {produto.condicao === 'novo' ? 'Novo' : 'Seminovo'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/produtos/${produto.id}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setProdutoToDelete(produto.id)
                        setDeleteDialogOpen(true)
                      }}
                      className="h-8 w-8 text-zinc-400 hover:text-red-400"
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
        </>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir produto"
        description="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  )
}
