'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MoreHorizontal, Eye, Trash2, RefreshCw, AlertCircle, CheckCircle, Package } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { removerAnuncio } from '@/app/admin/anuncios/actions'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import type { FacebookAnuncioComProduto } from '@/types/facebook'

interface AnunciosTableProps {
  anuncios: FacebookAnuncioComProduto[]
  loading: boolean
  onRefresh: () => void
}

export function AnunciosTable({ anuncios, loading, onRefresh }: AnunciosTableProps) {
  const [removendo, setRemovendo] = useState<string | null>(null)

  async function handleRemover(anuncioId: string) {
    if (!confirm('Tem certeza que deseja remover este anúncio do Facebook?')) {
      return
    }

    setRemovendo(anuncioId)

    const result = await removerAnuncio(anuncioId)

    setRemovendo(null)

    if (result.success) {
      toast.success(result.message)
      onRefresh()
    } else {
      toast.error(result.error || 'Erro ao remover anúncio')
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'anunciado':
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            <CheckCircle className="mr-1 h-3 w-3" />
            Anunciado
          </Badge>
        )
      case 'erro':
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Erro
          </Badge>
        )
      case 'pausado':
        return <Badge variant="outline">Pausado</Badge>
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>
      case 'removido':
        return <Badge variant="secondary">Removido</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Carregando anúncios...
        </div>
      </Card>
    )
  }

  if (anuncios.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <Package className="mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Nenhum anúncio encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crie seu primeiro anúncio no Facebook Marketplace
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Facebook ID</TableHead>
              <TableHead>Sincronizado</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {anuncios.map((anuncio) => (
              <TableRow key={anuncio.id}>
                {/* Imagem */}
                <TableCell>
                  <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted">
                    {anuncio.produto_imagem ? (
                      <Image
                        src={anuncio.produto_imagem}
                        alt={anuncio.produto_nome}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Produto */}
                <TableCell>
                  <div>
                    <p className="font-medium">{anuncio.produto_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {anuncio.codigo_produto}
                    </p>
                    {anuncio.categoria_nome && (
                      <p className="text-xs text-muted-foreground">
                        {anuncio.categoria_nome}
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Preço */}
                <TableCell>
                  <p className="font-semibold">R$ {anuncio.preco.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {anuncio.disponibilidade === 'in stock' ? 'Em estoque' : 'Sem estoque'}
                  </p>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <div className="space-y-1">
                    {getStatusBadge(anuncio.status)}
                    {anuncio.erro_mensagem && (
                      <p className="text-xs text-red-500 max-w-xs truncate" title={anuncio.erro_mensagem}>
                        {anuncio.erro_mensagem}
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Facebook ID */}
                <TableCell>
                  {anuncio.facebook_product_id ? (
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {anuncio.facebook_product_id.slice(0, 12)}...
                    </code>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Sincronizado */}
                <TableCell>
                  {anuncio.sincronizado_em ? (
                    <time className="text-xs text-muted-foreground">
                      {new Date(anuncio.sincronizado_em).toLocaleDateString('pt-BR')}
                    </time>
                  ) : (
                    <span className="text-xs text-muted-foreground">Nunca</span>
                  )}
                </TableCell>

                {/* Ações */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a
                          href={`/produto/${anuncio.produto_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Produto
                        </a>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => handleRemover(anuncio.id)}
                        disabled={removendo === anuncio.id || anuncio.status === 'removido'}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {removendo === anuncio.id ? 'Removendo...' : 'Remover'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
