'use client'

import { useEffect, useState } from 'react'
import { logger } from '@/lib/utils/logger'
import {
  Plus,
  Settings,
  Trash2,
  TestTube,
  Eye,
  Package,
  Search,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  listarAnunciosOlx,
  buscarConfigOlx,
  limparTodosAnunciosOlx,
  salvarConfigOlx,
  testarConexaoOlx,
  criarAnuncioOlx,
  removerAnuncioOlx,
  buscarProdutosDisponiveisOlx,
  migrarAnunciosAntigos,
} from '@/app/admin/anuncios/olx-actions'
import type { OlxAnuncioComProduto, OlxConfig } from '@/types/olx'
import { toast } from 'sonner'

export function OlxManager() {
  const [anuncios, setAnuncios] = useState<OlxAnuncioComProduto[]>([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<OlxConfig | null>(null)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [criarDialogOpen, setCriarDialogOpen] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [testando, setTestando] = useState(false)
  const [limpando, setLimpando] = useState(false)
  const [migrating, setMigrating] = useState(false)

  // Config form
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [syncEnabled, setSyncEnabled] = useState(false)

  // Criar anúncio
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<any[]>([])
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>('')
  const [buscaProduto, setBuscaProduto] = useState('')
  const [produtosFiltrados, setProdutosFiltrados] = useState<any[]>([])
  const [tituloCustom, setTituloCustom] = useState('')
  const [descricaoCustom, setDescricaoCustom] = useState('')
  const [categoriaOlx, setCategoriaOlx] = useState('23') // Celulares
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    if (anuncios.length > 0) {
      logger.debug(
        '[OLX-MANAGER] Anúncios carregados:',
        anuncios.map((a) => ({
          id: a.id,
          produto: a.produto_nome,
          status: a.status,
          olx_ad_id: a.olx_ad_id,
          tem_link: !!a.olx_ad_id,
        }))
      )
    }
  }, [anuncios])

  useEffect(() => {
    if (config) {
      setClientId(config.client_id || '')
      setClientSecret(config.client_secret || '')
      setAccessToken(config.access_token || '')
      setSyncEnabled(config.sync_enabled || false)
    }
  }, [config])

  async function carregarDados() {
    setLoading(true)

    const anunciosResult = await listarAnunciosOlx()
    if (anunciosResult.success && anunciosResult.data) {
      setAnuncios(anunciosResult.data as OlxAnuncioComProduto[])
    }

    const configResult = await buscarConfigOlx()
    if (configResult.success && configResult.data) {
      setConfig(configResult.data)
    }

    setLoading(false)
  }

  async function handleSalvarConfig() {
    if (!clientId || !clientSecret || !accessToken) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const result = await salvarConfigOlx({
      client_id: clientId,
      client_secret: clientSecret,
      access_token: accessToken,
      sync_enabled: syncEnabled,
    })

    if (result.success) {
      toast.success(result.message)
      setConfigDialogOpen(false)
      carregarDados()
    } else {
      toast.error(result.error || 'Erro ao salvar configuração')
    }
  }

  const handleMigrarAnuncios = async () => {
    if (!confirm('Buscar IDs dos anúncios antigos na OLX?\n\nIsso pode demorar alguns segundos.')) {
      return
    }

    setMigrating(true)
    try {
      logger.debug('[OLX-MANAGER] Iniciando migração...')
      const result = await migrarAnunciosAntigos()

      if (result.success) {
        toast.success(result.message || '✅ Migração Concluída!')

        // Recarregar anúncios
        await carregarDados()
      } else {
        toast.error(result.error || '❌ Erro na Migração')
      }
    } catch (error: any) {
      logger.error('[OLX-MANAGER] Erro na migração:', error)
      toast.error(error.message || '❌ Erro ao migrar anúncios')
    } finally {
      setMigrating(false)
    }
  }

  async function handleTestarConexao() {
    setTestando(true)
    const result = await testarConexaoOlx()
    setTestando(false)

    logger.debug('[OLX-MANAGER] Resultado do teste:', result)

    if (result.success) {
      toast.success(result.message)
      logger.debug('[OLX-MANAGER] ✅ Dados do usuário:', result.data)
    } else {
      toast.error(result.error || 'Erro ao testar conexão')
      logger.error('[OLX-MANAGER] ❌ Erro completo:', result)

      // Mostrar informações de debug
      if (result.debug) {
        logger.error('[OLX-MANAGER] Debug info:', result.debug)
      }
      if (result.details) {
        logger.error('[OLX-MANAGER] Detalhes do erro:', result.details)
      }
    }
  }

  async function handleLimparTodos() {
    if (!confirm('⚠️ Isso vai remover TODOS os anúncios OLX do banco de dados. Confirmar?')) {
      return
    }

    setLimpando(true)
    const result = await limparTodosAnunciosOlx()
    setLimpando(false)

    if (result.success) {
      toast.success(result.message)
      carregarDados()
    } else {
      toast.error(result.error || 'Erro ao limpar anúncios')
    }
  }

  async function handleAbrirCriarDialog() {
    const result = await buscarProdutosDisponiveisOlx()
    if (result.success && result.data) {
      setProdutosDisponiveis(result.data)
      setProdutosFiltrados(result.data)
      setBuscaProduto('')
      setProdutoSelecionado('')
      setTituloCustom('')
      setDescricaoCustom('')
      setCriarDialogOpen(true)
    } else {
      toast.error('Erro ao buscar produtos disponíveis')
    }
  }

  // Filtrar produtos ao digitar na busca - usar backend
  useEffect(() => {
    if (!buscaProduto.trim()) {
      setProdutosFiltrados(produtosDisponiveis)
      return
    }

    // Buscar no backend com debounce
    const timeoutId = setTimeout(async () => {
      const result = await buscarProdutosDisponiveisOlx(buscaProduto.trim())
      if (result.success && result.data) {
        setProdutosFiltrados(result.data)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [buscaProduto])

  async function handleCriarAnuncio() {
    if (!produtoSelecionado) {
      toast.error('Selecione um produto')
      return
    }

    logger.debug('[OLX-MANAGER] Iniciando criação de anúncio...')
    logger.debug('[OLX-MANAGER] Produto selecionado:', produtoSelecionado)
    logger.debug('[OLX-MANAGER] Título custom:', tituloCustom)
    logger.debug('[OLX-MANAGER] Categoria:', categoriaOlx)

    // Buscar dados do produto para debug
    const produtoInfo = produtosDisponiveis.find((p) => p.id === produtoSelecionado)
    logger.debug('[OLX-MANAGER] Info do produto:', produtoInfo)

    // Testar payload antes de enviar
    logger.debug('[OLX-MANAGER] Testando payload...')
    try {
      const testResponse = await fetch('/api/test-olx-payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id: produtoSelecionado }),
      })
      const testData = await testResponse.json()
      logger.debug('[OLX-MANAGER] ✅ Payload de teste:', testData)
    } catch (err) {
      logger.error('[OLX-MANAGER] ❌ Erro ao testar payload:', err)
    }

    setCriando(true)
    try {
      const result = await criarAnuncioOlx({
        produto_id: produtoSelecionado,
        titulo: tituloCustom || undefined,
        descricao: descricaoCustom || undefined,
        categoria_olx: categoriaOlx,
      })

      logger.debug('[OLX-MANAGER] Resultado:', result)

      // Log debug info se disponível
      if (result.debug) {
        logger.debug('[OLX-MANAGER] Debug - Payload enviado:', result.debug.payload)
        logger.debug('[OLX-MANAGER] Debug - Erro da OLX:', result.debug.responseError)
      }

      setCriando(false)

      if (result.success) {
        toast.success(result.message)
        setCriarDialogOpen(false)
        setProdutoSelecionado('')
        setTituloCustom('')
        setDescricaoCustom('')
        setBuscaProduto('')
        carregarDados()
      } else {
        logger.error('[OLX-MANAGER] Erro ao criar:', result.error)
        toast.error(result.error || 'Erro ao criar anúncio')
      }
    } catch (error: any) {
      logger.error('[OLX-MANAGER] ERRO FATAL:', error)
      setCriando(false)
      toast.error(`Erro inesperado: ${error.message}`)
    }
  }

  async function handleRemoverAnuncio(anuncioId: string) {
    if (!confirm('Deseja remover este anúncio?')) return

    const result = await removerAnuncioOlx(anuncioId)

    if (result.success) {
      toast.success(result.message)
      carregarDados()
    } else {
      toast.error(result.error || 'Erro ao remover anúncio')
    }
  }

  const anunciosFiltrados: OlxAnuncioComProduto[] = anuncios.filter((anuncio) => {
    if (!filtro) return true
    return (
      anuncio.produto_nome.toLowerCase().includes(filtro.toLowerCase()) ||
      anuncio.codigo_produto.toLowerCase().includes(filtro.toLowerCase())
    )
  })

  const anunciadosAtivos = anunciosFiltrados.filter((a) => a.status === 'anunciado')
  const anunciadosErro = anunciosFiltrados.filter((a) => a.status === 'erro')

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Status da integração - Mobile First */}
      <Card
        className={`border-2 transition-all ${
          config?.sync_enabled
            ? 'border-purple-500/30 bg-purple-500/5'
            : 'border-red-500/30 bg-red-500/5'
        }`}
      >
        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center sm:h-12 sm:w-12">
                <div
                  className={`absolute inset-0 rounded-full ${
                    config?.sync_enabled ? 'animate-pulse bg-purple-500/20' : 'bg-red-500/20'
                  }`}
                />
                <div
                  className={`relative h-5 w-5 rounded-full sm:h-6 sm:w-6 ${
                    config?.sync_enabled ? 'bg-purple-500' : 'bg-red-500'
                  }`}
                />
              </div>
              <div className="flex-1">
                <h3
                  className={`text-sm font-semibold sm:text-base ${
                    config?.sync_enabled ? 'text-purple-500' : 'text-red-500'
                  }`}
                >
                  {config?.sync_enabled ? 'OLX Conectada' : 'OLX Inativa'}
                </h3>
                <p className="text-muted-foreground mt-0.5 text-[11px] sm:text-xs">
                  {config?.sync_enabled
                    ? 'Integração OLX ativa'
                    : 'Configure a integração para anunciar'}
                </p>
                {config?.last_sync_at && (
                  <p className="text-muted-foreground mt-1 text-[10px] sm:text-xs">
                    Última sinc:{' '}
                    {new Date(config.last_sync_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfigDialogOpen(true)}
              className="shrink-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Estatísticas compactas */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="border-zinc-800 bg-linear-to-br from-green-500/10 to-transparent">
          <CardContent className="p-3 sm:p-4">
            <p className="text-muted-foreground text-[10px] sm:text-xs">Ativos</p>
            <p className="text-xl font-bold text-green-500 sm:text-2xl">
              {anunciadosAtivos.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-linear-to-br from-red-500/10 to-transparent">
          <CardContent className="p-3 sm:p-4">
            <p className="text-muted-foreground text-[10px] sm:text-xs">Erros</p>
            <p className="text-xl font-bold text-red-500 sm:text-2xl">{anunciadosErro.length}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-linear-to-br from-blue-500/10 to-transparent">
          <CardContent className="p-3 sm:p-4">
            <p className="text-muted-foreground text-[10px] sm:text-xs">Total</p>
            <p className="text-xl font-bold text-blue-500 sm:text-2xl">{anuncios.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca e ações */}
      <Card className="border-zinc-800 bg-zinc-950/50">
        <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
          <Input
            placeholder="🔍 Buscar produto..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="placeholder:text-muted-foreground/70 h-10 border-zinc-800 bg-zinc-900/50 text-sm sm:h-11"
          />

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
            <Button
              onClick={handleAbrirCriarDialog}
              disabled={!config || !config.sync_enabled}
              className="h-10 w-full bg-purple-600 text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 sm:h-10 sm:w-auto sm:text-sm"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Novo
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleMigrarAnuncios}
              disabled={migrating}
              className="gap-2"
            >
              {migrating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando IDs...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Buscar IDs Antigos
                </>
              )}
            </Button>

            {anuncios.length > 0 && (
              <Button
                variant="outline"
                onClick={handleLimparTodos}
                disabled={limpando}
                className="h-10 border-red-500/30 text-xs text-red-500 hover:bg-red-500/10 sm:h-10 sm:w-auto sm:text-sm"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Lista de anúncios - Mobile responsive */}
      <Card className="border-zinc-800 bg-zinc-950/50">
        <div className="p-3 sm:p-4">
          {loading ? (
            <div className="text-muted-foreground py-8 text-center text-xs sm:text-sm">
              Carregando...
            </div>
          ) : anunciosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="text-muted-foreground mb-2 h-10 w-10 sm:h-12 sm:w-12" />
              <p className="text-muted-foreground text-xs sm:text-sm">
                {filtro ? 'Nenhum anúncio encontrado' : 'Nenhum anúncio criado ainda'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2 sm:hidden">
                {/* Mobile Cards */}
                {anunciosFiltrados.map((anuncio) => (
                  <Card key={anuncio.id} className="border-zinc-800 bg-zinc-900/50">
                    <div className="flex gap-3 p-3">
                      {anuncio.produto_imagem && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                          <img
                            src={anuncio.produto_imagem}
                            alt={anuncio.produto_nome}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{anuncio.produto_nome}</p>
                        <p className="text-muted-foreground text-xs">{anuncio.codigo_produto}</p>
                        <p className="mt-1 text-sm font-bold text-green-500">
                          R$ {anuncio.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          {anuncio.olx_ad_id ? (
                            <a
                              href={`https://www.olx.com.br/vi/${anuncio.olx_ad_id}.htm`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                              onClick={(e) => {
                                logger.debug('[OLX-LINK] Clicou no link:', anuncio.olx_ad_id)
                                logger.debug(
                                  '[OLX-LINK] URL completa:',
                                  `https://www.olx.com.br/vi/${anuncio.olx_ad_id}.htm`
                                )
                              }}
                            >
                              <Badge
                                className={`cursor-pointer text-[10px] transition-opacity hover:opacity-80 ${
                                  anuncio.status === 'anunciado'
                                    ? 'border-green-500/30 bg-green-500/20 text-green-500'
                                    : anuncio.status === 'erro'
                                      ? 'border-red-500/30 bg-red-500/20 text-red-500'
                                      : 'bg-zinc-700 text-zinc-300'
                                }`}
                              >
                                {anuncio.status === 'anunciado'
                                  ? '✓ Ver na OLX'
                                  : anuncio.status === 'erro'
                                    ? '✕ Erro'
                                    : anuncio.status}
                              </Badge>
                            </a>
                          ) : anuncio.status === 'anunciado' ? (
                            <a
                              href={`https://www.olx.com.br/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                              title="Busque por: iPhone 11 - 128gb"
                            >
                              <Badge className="cursor-pointer border-yellow-500/30 bg-yellow-500/20 text-[10px] text-yellow-500 transition-opacity hover:opacity-80">
                                ⚠ Ver na OLX (buscar)
                              </Badge>
                            </a>
                          ) : (
                            <Badge
                              className={`text-[10px] ${
                                anuncio.status === 'erro'
                                  ? 'border-red-500/30 bg-red-500/20 text-red-500'
                                  : 'bg-zinc-700 text-zinc-300'
                              }`}
                              title="Sem ID da OLX"
                            >
                              {anuncio.status === 'erro' ? '✕ Erro' : anuncio.status}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoverAnuncio(anuncio.id)}
                            className="h-7 px-2"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                        {anuncio.erro_mensagem && (
                          <p className="mt-1 text-[10px] text-red-500">{anuncio.erro_mensagem}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="hidden overflow-x-auto sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sincronizado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anunciosFiltrados.map((anuncio) => (
                      <TableRow key={anuncio.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {anuncio.produto_imagem && (
                              <img
                                src={anuncio.produto_imagem}
                                alt={anuncio.produto_nome}
                                className="h-10 w-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">{anuncio.produto_nome}</div>
                              <div className="text-muted-foreground text-xs">
                                {anuncio.codigo_produto}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          R$ {anuncio.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {anuncio.olx_ad_id ? (
                            <a
                              href={`https://www.olx.com.br/vi/${anuncio.olx_ad_id}.htm`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                              onClick={(e) => {
                                logger.debug(
                                  '[OLX-LINK] Clicou no link (desktop):',
                                  anuncio.olx_ad_id
                                )
                                logger.debug(
                                  '[OLX-LINK] URL completa:',
                                  `https://www.olx.com.br/vi/${anuncio.olx_ad_id}.htm`
                                )
                              }}
                            >
                              <Badge
                                className={`cursor-pointer transition-opacity hover:opacity-80 ${
                                  anuncio.status === 'anunciado'
                                    ? 'border-green-500/30 bg-green-500/20 text-green-500'
                                    : anuncio.status === 'erro'
                                      ? 'border-red-500/30 bg-red-500/20 text-red-500'
                                      : 'bg-zinc-700 text-zinc-300'
                                }`}
                              >
                                {anuncio.status === 'anunciado' ? '✓ Ver na OLX' : anuncio.status}
                              </Badge>
                            </a>
                          ) : anuncio.status === 'anunciado' ? (
                            <a
                              href={`https://www.olx.com.br/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                              title={`Busque por: ${anuncio.produto_nome}`}
                            >
                              <Badge className="cursor-pointer border-yellow-500/30 bg-yellow-500/20 text-yellow-500 transition-opacity hover:opacity-80">
                                ⚠ Ver na OLX (buscar)
                              </Badge>
                            </a>
                          ) : (
                            <Badge
                              className={`${
                                anuncio.status === 'erro'
                                  ? 'border-red-500/30 bg-red-500/20 text-red-500'
                                  : 'bg-zinc-700 text-zinc-300'
                              }`}
                              title="Sem ID da OLX"
                            >
                              {anuncio.status}
                            </Badge>
                          )}
                          {anuncio.erro_mensagem && (
                            <div className="mt-1 text-xs text-red-500">{anuncio.erro_mensagem}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {anuncio.sincronizado_em
                            ? new Date(anuncio.sincronizado_em).toLocaleString('pt-BR')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {anuncio.olx_ad_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`https://www.olx.com.br/`, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoverAnuncio(anuncio.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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
        </div>
      </Card>

      {/* Dialog Configuração */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="flex max-h-[95vh] w-[95vw] flex-col gap-0 p-0 sm:max-h-[90vh] sm:max-w-2xl sm:gap-6 sm:p-6">
          <DialogHeader className="border-b border-zinc-800 px-4 pt-4 pb-3 sm:border-none sm:p-0 sm:pb-4">
            <DialogTitle className="text-base sm:text-lg">Configuração OLX</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Configure as credenciais OAuth2 da OLX. Obtenha suas credenciais em{' '}
              <a
                href="https://developers.olx.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-500 underline"
              >
                developers.olx.com.br
              </a>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 sm:space-y-4 sm:px-0 sm:pb-0">
            <div>
              <Label htmlFor="clientId" className="text-xs sm:text-sm">
                Client ID *
              </Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Digite o Client ID"
                className="mt-1.5 h-10"
              />
            </div>

            <div>
              <Label htmlFor="clientSecret" className="text-xs sm:text-sm">
                Client Secret *
              </Label>
              <Input
                id="clientSecret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Digite o Client Secret"
                className="mt-1.5 h-10"
              />
            </div>

            <div>
              <Label htmlFor="accessToken" className="text-xs sm:text-sm">
                Access Token *
              </Label>
              <Textarea
                id="accessToken"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Cole o Access Token OAuth2"
                rows={3}
                className="mt-1.5 resize-none text-xs sm:text-sm"
              />
              <p className="text-muted-foreground mt-1 text-[11px] sm:text-xs">
                Token de acesso obtido via OAuth2 flow
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
              <div className="flex-1 space-y-0.5">
                <Label htmlFor="syncEnabled" className="text-xs font-semibold sm:text-sm">
                  Ativar sincronização
                </Label>
                <p className="text-muted-foreground text-[11px] sm:text-xs">
                  Habilita a criação de anúncios na OLX
                </p>
              </div>
              <Switch
                id="syncEnabled"
                checked={syncEnabled}
                onCheckedChange={setSyncEnabled}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>

            <Button
              variant="outline"
              onClick={handleTestarConexao}
              disabled={testando || !accessToken}
              className="h-10 w-full border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
            >
              <TestTube className="mr-2 h-4 w-4" />
              {testando ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>

          <DialogFooter className="border-t border-zinc-800 bg-zinc-950/50 px-4 py-3 sm:border-none sm:bg-transparent sm:px-0 sm:py-0">
            <Button
              variant="outline"
              onClick={() => setConfigDialogOpen(false)}
              className="h-10 w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarConfig}
              className="h-10 w-full bg-purple-600 hover:bg-purple-700 sm:w-auto"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Criar Anúncio */}
      <Dialog open={criarDialogOpen} onOpenChange={setCriarDialogOpen}>
        <DialogContent className="flex max-h-[95vh] w-[95vw] flex-col gap-0 p-0 sm:max-h-[90vh] sm:max-w-2xl sm:gap-6 sm:p-6">
          <DialogHeader className="border-b border-zinc-800 px-4 pt-4 pb-3 sm:border-none sm:p-0 sm:pb-4">
            <DialogTitle className="text-base sm:text-lg">Criar Anúncio na OLX</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Selecione o produto e personalize o anúncio
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 sm:space-y-4 sm:px-0 sm:pb-0">
            <div className="space-y-2">
              <Label htmlFor="busca-produto" className="text-xs sm:text-sm">
                Buscar Produto *
              </Label>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  id="busca-produto"
                  type="text"
                  placeholder="Digite o nome ou código do produto..."
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>

              {/* Lista de produtos filtrados */}
              {buscaProduto && !produtoSelecionado && (
                <div className="max-h-60 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950">
                  {produtosFiltrados.length > 0 ? (
                    produtosFiltrados.map((produto) => (
                      <button
                        key={produto.id}
                        type="button"
                        onClick={() => {
                          setProdutoSelecionado(produto.id)
                          setBuscaProduto('')
                        }}
                        className={`w-full border-b border-zinc-800 px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-zinc-900`}
                      >
                        <div className="font-medium">{produto.nome}</div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span>Código: {produto.codigo_produto}</span>
                          <span>•</span>
                          <span className="text-(--brand-yellow)">
                            R$ {produto.preco.toFixed(2)}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-sm text-zinc-500">
                      Nenhum produto encontrado
                    </div>
                  )}
                </div>
              )}

              {/* Produto selecionado */}
              {produtoSelecionado && (
                <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">
                        {produtosDisponiveis.find((p) => p.id === produtoSelecionado)?.nome}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>
                          Código:{' '}
                          {
                            produtosDisponiveis.find((p) => p.id === produtoSelecionado)
                              ?.codigo_produto
                          }
                        </span>
                        <span>•</span>
                        <span className="text-(--brand-yellow)">
                          R${' '}
                          {produtosDisponiveis
                            .find((p) => p.id === produtoSelecionado)
                            ?.preco.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setProdutoSelecionado('')
                        setBuscaProduto('')
                      }}
                      className="h-7 text-xs"
                    >
                      Alterar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="categoria" className="text-xs sm:text-sm">
                Categoria OLX
              </Label>
              <Select value={categoriaOlx} onValueChange={setCategoriaOlx}>
                <SelectTrigger className="mt-1.5 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="23">📱 Celulares e Telefones</SelectItem>
                  <SelectItem value="4161">📱 Tablets</SelectItem>
                  <SelectItem value="93">🔌 Acessórios para Celular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="titulo" className="text-xs sm:text-sm">
                Título (opcional)
              </Label>
              <Input
                id="titulo"
                value={tituloCustom}
                onChange={(e) => setTituloCustom(e.target.value)}
                placeholder="Deixe em branco para usar o nome do produto"
                maxLength={70}
                className="mt-1.5 h-10"
              />
              <p className="text-muted-foreground mt-1 text-[11px] sm:text-xs">
                {tituloCustom.length}/70 caracteres
              </p>
            </div>

            <div>
              <Label htmlFor="descricao" className="text-xs sm:text-sm">
                Descrição (opcional)
              </Label>
              <Textarea
                id="descricao"
                value={descricaoCustom}
                onChange={(e) => setDescricaoCustom(e.target.value)}
                placeholder="Deixe em branco para usar a descrição padrão"
                rows={4}
                className="mt-1.5 resize-none text-xs sm:text-sm"
              />
              <p className="text-muted-foreground mt-1 text-[11px] sm:text-xs">
                {descricaoCustom.length} caracteres
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-800 bg-zinc-950/50 px-4 py-3 sm:border-none sm:bg-transparent sm:px-0 sm:py-0">
            <Button
              variant="outline"
              onClick={() => setCriarDialogOpen(false)}
              className="h-10 w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCriarAnuncio}
              disabled={criando || !produtoSelecionado}
              className="h-10 w-full bg-purple-600 hover:bg-purple-700 sm:w-auto"
            >
              {criando ? 'Criando...' : 'Criar Anúncio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
function carregarAnuncios() {
  throw new Error('Function not implemented.')
}
