'use client'

import { useEffect, useState } from 'react'
import { Plus, Settings, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CriarAnuncioDialog } from './criar-anuncio-dialog'
import { AnunciosTable } from './anuncios-table'
import { ConfiguracaoDialog } from './configuracao-dialog'
import { listarAnuncios, buscarConfig } from '@/app/admin/anuncios/actions'
import type { FacebookAnuncioComProduto, FacebookConfig } from '@/types/facebook'
import { toast } from 'sonner'

export function AnunciosManager() {
  const [anuncios, setAnuncios] = useState<FacebookAnuncioComProduto[]>([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<FacebookConfig | null>(null)
  const [criarDialogOpen, setCriarDialogOpen] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [filtro, setFiltro] = useState('')

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
        Math.ceil((new Date(config.token_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : null

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <Input
              placeholder="Buscar por produto..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full sm:max-w-md"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setConfigDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>

            <Button
              onClick={() => setCriarDialogOpen(true)}
              disabled={!config || !config.sync_enabled}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Anúncio
            </Button>
          </div>
        </div>

        {/* Status da integração */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <div
            className={`h-2 w-2 rounded-full ${
              config?.sync_enabled ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-muted-foreground">
            Integração {config?.sync_enabled ? 'Ativa' : 'Inativa'}
          </span>
          {config?.last_sync_at && (
            <span className="text-muted-foreground">
              · Última sincronização: {new Date(config.last_sync_at).toLocaleString('pt-BR')}
            </span>
          )}
          {diasRestantes !== null && (
            <>
              <span className="text-muted-foreground">·</span>
              <div
                className={`flex items-center gap-1 ${
                  diasRestantes <= 7
                    ? 'text-red-500'
                    : diasRestantes <= 14
                    ? 'text-yellow-500'
                    : 'text-blue-500'
                }`}
              >
                <Clock className="h-3 w-3" />
                <span className="font-medium">
                  {diasRestantes === 0
                    ? 'Token expirou!'
                    : diasRestantes === 1
                    ? 'Token expira amanhã'
                    : `Token expira em ${diasRestantes}d`}
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Alerta de token expirando */}
      {diasRestantes !== null && diasRestantes <= 14 && (
        <Card
          className={`p-4 ${
            diasRestantes <= 7 ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`h-5 w-5 mt-0.5 flex-shrink-0 ${diasRestantes <= 7 ? 'text-red-500' : 'text-yellow-500'}`}
            />
            <div className="flex-1">
              <h4
                className={`font-semibold ${diasRestantes <= 7 ? 'text-red-500' : 'text-yellow-500'}`}
              >
                {diasRestantes <= 7 ? 'Access Token está expirando!' : 'Access Token expira em breve'}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Seu token do Facebook expira em{' '}
                <span className="font-medium">{diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}</span>.
                {diasRestantes <= 7
                  ? ' Renove-o imediatamente para não perder acesso aos anúncios.'
                  : ' Planeje renovar o token em breve.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfigDialogOpen(true)}
                className="mt-3"
              >
                <Settings className="mr-2 h-3 w-3" />
                Renovar Token
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs com anúncios */}
      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="todos" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Todos</span>
            <span className="sm:hidden">Todos</span>
            <span className="ml-1">({anunciosFiltrados.length})</span>
          </TabsTrigger>
          <TabsTrigger value="anunciados" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Anunciados</span>
            <span className="sm:hidden">Ativo</span>
            <span className="ml-1">({anunciadosAtivos.length})</span>
          </TabsTrigger>
          <TabsTrigger value="erro" className="text-xs sm:text-sm">
            <span>Erro</span>
            <span className="ml-1">({anunciadosErro.length})</span>
          </TabsTrigger>
          <TabsTrigger value="pausados" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Pausados</span>
            <span className="sm:hidden">Pausa</span>
            <span className="ml-1">({anunciadosPausados.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-6">
          <AnunciosTable anuncios={anunciosFiltrados} loading={loading} onRefresh={carregarDados} />
        </TabsContent>

        <TabsContent value="anunciados" className="mt-6">
          <AnunciosTable anuncios={anunciadosAtivos} loading={loading} onRefresh={carregarDados} />
        </TabsContent>

        <TabsContent value="erro" className="mt-6">
          <AnunciosTable anuncios={anunciadosErro} loading={loading} onRefresh={carregarDados} />
        </TabsContent>

        <TabsContent value="pausados" className="mt-6">
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
