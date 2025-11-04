'use client'

import { useEffect, useState } from 'react'
import { Plus, Settings, Clock, AlertTriangle, HelpCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CriarAnuncioDialog } from './criar-anuncio-dialog'
import { AnunciosTable } from './anuncios-table'
import { ConfiguracaoDialog } from './configuracao-dialog'
import { MarketplaceDiagnostics } from './marketplace-diagnostics'
import { listarAnuncios, buscarConfig, limparTodosAnuncios } from '@/app/admin/anuncios/actions'
import type { FacebookAnuncioComProduto, FacebookConfig } from '@/types/facebook'
import { toast } from 'sonner'

export function AnunciosManager() {
  const [anuncios, setAnuncios] = useState<FacebookAnuncioComProduto[]>([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<FacebookConfig | null>(null)
  const [criarDialogOpen, setCriarDialogOpen] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [limpando, setLimpando] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)

    // Carregar anúncios
    const anunciosResult = await listarAnuncios()
    if (anunciosResult.success && anunciosResult.data) {
      setAnuncios(anunciosResult.data)
    } else {
      toast.error('Erro ao carregar anúncios')
    }

    // Carregar configuração
    const configResult = await buscarConfig()
    if (configResult.success && configResult.data) {
      setConfig(configResult.data)
    }

    setLoading(false)
  }

  const anunciosFiltrados = anuncios.filter((anuncio) => {
    if (!filtro) return true
    return (
      anuncio.produto_nome.toLowerCase().includes(filtro.toLowerCase()) ||
      anuncio.codigo_produto.toLowerCase().includes(filtro.toLowerCase())
    )
  })

  const anunciadosAtivos = anunciosFiltrados.filter((a) => a.status === 'anunciado')
  const anunciadosErro = anunciosFiltrados.filter((a) => a.status === 'erro')
  const anunciadosPausados = anunciosFiltrados.filter((a) => a.status === 'pausado')

  // Calcular dias restantes do token
  const diasRestantes = config?.token_expires_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(config.token_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : null

  async function handleLimparTodos() {
    if (
      !confirm(
        '⚠️ ATENÇÃO: Isso vai remover TODOS os anúncios do banco de dados!\n\nSó faça isso se:\n- Quer começar do zero\n- Os anúncios antigos estão com erro\n- Facebook API está bloqueada\n\nConfirmar?'
      )
    ) {
      return
    }

    setLimpando(true)

    const result = await limparTodosAnuncios()

    setLimpando(false)

    if (result.success) {
      toast.success(result.message)
      carregarDados()
    } else {
      toast.error(result.error || 'Erro ao limpar anúncios')
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Status da integração - Mobile First */}
      <Card className={`border-2 transition-all ${
        config?.sync_enabled 
          ? 'border-green-500/30 bg-green-500/5' 
          : 'border-red-500/30 bg-red-500/5'
      }`}>
        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center sm:h-12 sm:w-12">
                <div className={`absolute inset-0 rounded-full ${
                  config?.sync_enabled ? 'bg-green-500/20 animate-pulse' : 'bg-red-500/20'
                }`} />
                <div className={`relative h-5 w-5 rounded-full sm:h-6 sm:w-6 ${
                  config?.sync_enabled ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-semibold sm:text-base ${
                    config?.sync_enabled ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {config?.sync_enabled ? 'Integração Ativa' : 'Integração Inativa'}
                  </h3>
                  {diasRestantes !== null && (
                    <Badge 
                      variant="outline"
                      className={`text-[10px] sm:text-xs ${
                        diasRestantes <= 7
                          ? 'border-red-500/50 bg-red-500/10 text-red-500'
                          : diasRestantes <= 14
                          ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500'
                          : 'border-blue-500/50 bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      <Clock className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {diasRestantes === 0
                        ? 'Expirado'
                        : diasRestantes === 1
                        ? '1 dia'
                        : `${diasRestantes}d`}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
                  {config?.sync_enabled 
                    ? 'Facebook Marketplace conectado' 
                    : 'Configure a integração para anunciar'}
                </p>
                {config?.last_sync_at && (
                  <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
                    Última sinc: {new Date(config.last_sync_at).toLocaleString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfigDialogOpen(true)}
              className="flex-shrink-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Busca e ações */}
      <Card className="border-zinc-800 bg-zinc-950/50">
        <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
          <Input
            placeholder="🔍 Buscar produto..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="h-10 border-zinc-800 bg-zinc-900/50 text-sm placeholder:text-muted-foreground/70 sm:h-11"
          />

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
            <Button
              onClick={() => setCriarDialogOpen(true)}
              disabled={!config || !config.sync_enabled}
              className="h-10 w-full bg-blue-600 text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 sm:h-10 sm:w-auto sm:text-sm"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Novo
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

      {/* Alerta de token expirando */}
      {diasRestantes !== null && diasRestantes <= 14 && (
        <Card
          className={`border-2 ${
            diasRestantes <= 7
              ? 'border-red-500/30 bg-red-500/5'
              : 'border-yellow-500/30 bg-yellow-500/5'
          }`}
        >
          <div className="flex items-start gap-2 p-3 sm:gap-3 sm:p-4">
            <div className={`mt-0.5 rounded-full p-1.5 ${
              diasRestantes <= 7 ? 'bg-red-500/20' : 'bg-yellow-500/20'
            }`}>
              <AlertTriangle
                className={`h-4 w-4 sm:h-5 sm:w-5 ${diasRestantes <= 7 ? 'text-red-500' : 'text-yellow-500'}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className={`text-sm font-semibold sm:text-base ${diasRestantes <= 7 ? 'text-red-500' : 'text-yellow-500'}`}
              >
                {diasRestantes <= 7 ? '🚨 Token expirando!' : '⚠️ Token expira em breve'}
              </h4>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                Expira em <span className="font-semibold">{diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}</span>
                {diasRestantes <= 7 ? '. Renove imediatamente!' : '.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfigDialogOpen(true)}
                className="mt-2 h-8 text-xs"
              >
                <Settings className="mr-1.5 h-3 w-3" />
                Renovar Agora
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Botão de diagnóstico */}
      {!showDiagnostics && anuncios.length > 0 && (
        <Button
          variant="outline"
          onClick={() => setShowDiagnostics(true)}
          className="w-full border-zinc-800 bg-zinc-950/50 text-xs hover:bg-zinc-900 sm:w-auto sm:text-sm"
        >
          <HelpCircle className="mr-1.5 h-4 w-4" />
          Produtos não aparecem?
        </Button>
      )}

      {/* Card de diagnóstico */}
      {showDiagnostics && (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDiagnostics(false)}
            className="h-8 text-xs"
          >
            Ocultar
          </Button>
          <MarketplaceDiagnostics />
        </div>
      )}

      {/* Tabs com anúncios - Mobile First */}
      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-4 gap-1 bg-zinc-950/50 p-1">
          <TabsTrigger 
            value="todos" 
            className="relative h-auto flex-col gap-0.5 rounded-md border-2 border-transparent px-2 py-2 text-[11px] data-[state=active]:border-blue-500 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-500 sm:text-xs"
          >
            <span className="font-semibold">Todos</span>
            <Badge variant="secondary" className="mt-0.5 h-4 min-w-[20px] text-[10px] sm:h-5 sm:text-xs">
              {anunciosFiltrados.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="anunciados" 
            className="relative h-auto flex-col gap-0.5 rounded-md border-2 border-transparent px-2 py-2 text-[11px] data-[state=active]:border-green-500 data-[state=active]:bg-green-500/10 data-[state=active]:text-green-500 sm:text-xs"
          >
            <span className="font-semibold">Ativos</span>
            <Badge variant="secondary" className="mt-0.5 h-4 min-w-[20px] text-[10px] sm:h-5 sm:text-xs">
              {anunciadosAtivos.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="erro" 
            className="relative h-auto flex-col gap-0.5 rounded-md border-2 border-transparent px-2 py-2 text-[11px] data-[state=active]:border-red-500 data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500 sm:text-xs"
          >
            <span className="font-semibold">Erro</span>
            <Badge variant="secondary" className="mt-0.5 h-4 min-w-[20px] text-[10px] sm:h-5 sm:text-xs">
              {anunciadosErro.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="pausados" 
            className="relative h-auto flex-col gap-0.5 rounded-md border-2 border-transparent px-2 py-2 text-[11px] data-[state=active]:border-yellow-500 data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-500 sm:text-xs"
          >
            <span className="font-semibold">Pausa</span>
            <Badge variant="secondary" className="mt-0.5 h-4 min-w-[20px] text-[10px] sm:h-5 sm:text-xs">
              {anunciadosPausados.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-3 sm:mt-4">
          <AnunciosTable anuncios={anunciosFiltrados} loading={loading} onRefresh={carregarDados} />
        </TabsContent>

        <TabsContent value="anunciados" className="mt-3 sm:mt-4">
          <AnunciosTable anuncios={anunciadosAtivos} loading={loading} onRefresh={carregarDados} />
        </TabsContent>

        <TabsContent value="erro" className="mt-3 sm:mt-4">
          <AnunciosTable anuncios={anunciadosErro} loading={loading} onRefresh={carregarDados} />
        </TabsContent>

        <TabsContent value="pausados" className="mt-3 sm:mt-4">
          <AnunciosTable
            anuncios={anunciadosPausados}
            loading={loading}
            onRefresh={carregarDados}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CriarAnuncioDialog
        open={criarDialogOpen}
        onClose={() => setCriarDialogOpen(false)}
        onSuccess={carregarDados}
      />

      <ConfiguracaoDialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        config={config}
        onSave={() => {
          carregarDados()
          setConfigDialogOpen(false)
        }}
      />
    </div>
  )
}
