'use client'

import { useState } from 'react'
import { OptimizedImage } from '@/components/shared/optimized-image'
import { MoreHorizontal, Eye, Trash2, RefreshCw, AlertCircle, CheckCircle, Package, ExternalLink } from 'lucide-react'
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
import { BatteryIcon } from '@/components/shared/battery-icon'
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

  function getMarketplaceBadge(statusFacebook: string | null, facebookProductId: string | null) {
    if (!facebookProductId) {
      return (
        <Badge variant="outline" className="text-zinc-500">
          <AlertCircle className="mr-1 h-3 w-3" />
          Não sincronizado
        </Badge>
      )
    }

    // Se tem ID, está no marketplace
    if (statusFacebook === 'active' || statusFacebook === 'ACTIVE') {
      return (
        <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
          <CheckCircle className="mr-1 h-3 w-3" />
          No Marketplace
        </Badge>
      )
    }

    if (statusFacebook === 'pending_review') {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
          <AlertCircle className="mr-1 h-3 w-3" />
          Em análise
        </Badge>
      )
    }

    // Tem ID mas status desconhecido
    return (
      <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
        <CheckCircle className="mr-1 h-3 w-3" />
        Sincronizado
      </Badge>
    )
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
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
                      <OptimizedImage
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
                    <div className="mt-1 flex items-center gap-2">
                      {anuncio.categoria_nome && (
                        <p className="text-xs text-muted-foreground">
                          {anuncio.categoria_nome}
                        </p>
                      )}
                      {anuncio.produto_nivel_bateria && (
                        <Badge className="flex items-center gap-1 bg-zinc-700 px-1.5 py-0 text-xs text-white">
                          <BatteryIcon level={anuncio.produto_nivel_bateria} />
                          <span>{anuncio.produto_nivel_bateria}%</span>
                        </Badge>
                      )}
                    </div>
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
                    {/* Status do sistema */}
                    {getStatusBadge(anuncio.status)}
                    
                    {/* Status Marketplace - só se tiver product_id */}
                    {anuncio.facebook_product_id && anuncio.facebook_catalog_id && (
                      <a
                        href={`https://www.facebook.com/marketplace/item/${anuncio.facebook_product_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 transition-opacity hover:opacity-70"
                        title="Ver no Marketplace"
                      >
                        {getMarketplaceBadge(anuncio.status_facebook, anuncio.facebook_product_id)}
                        <ExternalLink className="h-3 w-3 text-blue-500" />
                      </a>
                    )}
                    
                    {/* Erro se houver */}
                    {anuncio.erro_mensagem && (
                      <p className="text-xs text-red-500 max-w-xs truncate" title={anuncio.erro_mensagem}>
                        {anuncio.erro_mensagem}
                      </p>
                    )}
                  </div>
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

                      {/* Link para Facebook se sincronizado */}
                      {anuncio.facebook_product_id && anuncio.facebook_catalog_id && (
                        <DropdownMenuItem asChild>
                          <a
                            href={`https://business.facebook.com/commerce_manager/catalogs/${anuncio.facebook_catalog_id}/products/${anuncio.facebook_product_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600"
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Gerenciar no Facebook
                          </a>
                        </DropdownMenuItem>
                      )}

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
