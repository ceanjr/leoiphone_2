'use client'

import { useState, useEffect } from 'react'
import { Settings, Star, Percent, Package, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BatteryIcon } from '@/components/shared/battery-icon'
import {
  getConfigProdutosRelacionadosDestaque,
  updateConfigProdutosRelacionadosDestaque,
  buscarProdutosParaRelacionados,
  listarProdutosEmDestaque,
  updateConfigProdutoDestaqueIndividual,
  deleteConfigProdutoDestaqueIndividual,
} from '@/app/admin/categorias/produtos-destaque-relacionados-actions'
import Image from 'next/image'

interface ModalProdutosRelacionadosDestaqueProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModalProdutosRelacionadosDestaque({
  open,
  onOpenChange,
}: ModalProdutosRelacionadosDestaqueProps) {
  // Config Global
  const [configGlobal, setConfigGlobal] = useState<any>(null)
  const [autoSelectGlobal, setAutoSelectGlobal] = useState(true)
  const [produtosSelecionadosGlobal, setProdutosSelecionadosGlobal] = useState<string[]>([])
  const [descontoMinGlobal, setDescontoMinGlobal] = useState(3)
  const [descontoMaxGlobal, setDescontoMaxGlobal] = useState(7)

  // Produtos
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<any[]>([])
  const [produtosEmDestaque, setProdutosEmDestaque] = useState<any[]>([])
  const [produtoEditando, setProdutoEditando] = useState<any>(null)

  // Estados
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('global')

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  async function loadData() {
    setLoading(true)

    const [configResult, disponiveisResult, destaqueResult] = await Promise.all([
      getConfigProdutosRelacionadosDestaque(),
      buscarProdutosParaRelacionados(),
      listarProdutosEmDestaque(),
    ])

    if (configResult.data) {
      setConfigGlobal(configResult.data)
      setAutoSelectGlobal(configResult.data.auto_select)
      setProdutosSelecionadosGlobal(configResult.data.produtos_selecionados || [])
      setDescontoMinGlobal(configResult.data.desconto_min)
      setDescontoMaxGlobal(configResult.data.desconto_max)
    }

    setProdutosDisponiveis(disponiveisResult.data)
    setProdutosEmDestaque(destaqueResult.data)

    setLoading(false)
  }

  async function handleSaveGlobal() {
    if (descontoMinGlobal > descontoMaxGlobal) {
      toast.error('Desconto mínimo não pode ser maior que o máximo')
      return
    }

    setSaving(true)

    const result = await updateConfigProdutosRelacionadosDestaque(
      autoSelectGlobal,
      produtosSelecionadosGlobal,
      descontoMinGlobal,
      descontoMaxGlobal
    )

    setSaving(false)

    if (result.success) {
      toast.success('Configuração global salva com sucesso!')
      loadData()
    } else {
      toast.error(result.error || 'Erro ao salvar configuração')
    }
  }

  async function handleSaveIndividual(produto: any) {
    const config = produto.config_temp || produto.config_individual

    if (!config) {
      toast.error('Configure os produtos relacionados primeiro')
      return
    }

    if (config.desconto_min > config.desconto_max) {
      toast.error('Desconto mínimo não pode ser maior que o máximo')
      return
    }

    setSaving(true)

    const result = await updateConfigProdutoDestaqueIndividual(
      produto.produto_id,
      config.auto_select,
      config.produtos_selecionados || [],
      config.desconto_min,
      config.desconto_max
    )

    setSaving(false)

    if (result.success) {
      toast.success(`Configuração de "${produto.produto_nome}" salva!`)
      loadData()
      setProdutoEditando(null)
    } else {
      toast.error(result.error || 'Erro ao salvar configuração')
    }
  }

  async function handleToggleConfigIndividual(produto: any, ativar: boolean) {
    if (!ativar) {
      // Desativar = deletar config individual (usará global)
      setSaving(true)
      const result = await deleteConfigProdutoDestaqueIndividual(produto.produto_id)
      setSaving(false)

      if (result.success) {
        toast.success(`"${produto.produto_nome}" usará configuração global`)
        loadData()
        setProdutoEditando(null)
      } else {
        toast.error(result.error || 'Erro ao remover configuração')
      }
    }
    // Se ativar, não faz nada - usuário deve configurar e salvar
  }

  function toggleProdutoGlobal(produtoId: string) {
    setProdutosSelecionadosGlobal((prev) =>
      prev.includes(produtoId) ? prev.filter((id) => id !== produtoId) : [...prev, produtoId]
    )
  }

  function updateProdutoTempConfig(produto: any, key: string, value: any) {
    setProdutosEmDestaque((prev) =>
      prev.map((p) => {
        if (p.produto_id === produto.produto_id) {
          const config = p.config_temp || p.config_individual || {
            auto_select: true,
            produtos_selecionados: [],
            desconto_min: 3,
            desconto_max: 7,
          }
          return {
            ...p,
            config_temp: { ...config, [key]: value },
          }
        }
        return p
      })
    )
  }

  function toggleProdutoIndividual(produto: any, produtoId: string) {
    const config = produto.config_temp || produto.config_individual || {
      auto_select: true,
      produtos_selecionados: [],
      desconto_min: 3,
      desconto_max: 7,
    }

    const produtos = config.produtos_selecionados || []
    const novos = produtos.includes(produtoId)
      ? produtos.filter((id: string) => id !== produtoId)
      : [...produtos, produtoId]

    updateProdutoTempConfig(produto, 'produtos_selecionados', novos)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] w-[95vw] flex-col gap-0 p-0 sm:max-h-[90vh] sm:max-w-5xl sm:gap-6 sm:p-6">
        <DialogHeader className="border-b border-zinc-800 px-4 pb-3 pt-4 sm:border-none sm:p-0 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Star className="h-5 w-5 text-yellow-500" />
            Produtos Relacionados - Produtos em Destaque
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Configure quais produtos aparecem como "relacionados" nas páginas dos produtos em destaque
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden">
          <div className="border-b border-zinc-800 px-4 sm:px-0">
            <TabsList className="grid w-full grid-cols-2 bg-transparent">
              <TabsTrigger
                value="global"
                className="data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configuração Global
              </TabsTrigger>
              <TabsTrigger
                value="individual"
                className="data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent"
              >
                <Package className="mr-2 h-4 w-4" />
                Por Produto ({produtosEmDestaque.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-0 sm:pb-0">
            {/* TAB: Configuração Global */}
            <TabsContent value="global" className="mt-4 space-y-4">
              <div className="rounded-lg border-2 border-yellow-500/30 bg-yellow-500/5 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-yellow-500">
                  <Star className="h-4 w-4" />
                  Aplicar para Todos os Produtos em Destaque
                </h3>
                <p className="text-xs text-muted-foreground">
                  Essa configuração será aplicada a todos os produtos que estão no banner de destaque
                </p>
              </div>

              <div className="space-y-4">
                {/* Toggle Auto Select */}
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                  <div className="flex-1">
                    <Label className="text-sm font-semibold">Seleção Automática</Label>
                    <p className="text-xs text-muted-foreground">
                      Sistema escolhe produtos relacionados automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={autoSelectGlobal}
                    onCheckedChange={setAutoSelectGlobal}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>

                {/* Range de Desconto */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">
                      <Percent className="mr-1 inline h-3 w-3" />
                      Desconto Mínimo (%)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={descontoMinGlobal}
                      onChange={(e) => setDescontoMinGlobal(parseFloat(e.target.value) || 0)}
                      className="h-10 border-zinc-800 bg-zinc-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">
                      <Percent className="mr-1 inline h-3 w-3" />
                      Desconto Máximo (%)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={descontoMaxGlobal}
                      onChange={(e) => setDescontoMaxGlobal(parseFloat(e.target.value) || 0)}
                      className="h-10 border-zinc-800 bg-zinc-900"
                    />
                  </div>
                </div>

                {/* Seleção Manual de Produtos */}
                {!autoSelectGlobal && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Selecionar Produtos Manualmente ({produtosSelecionadosGlobal.length})
                    </Label>
                    <ScrollArea className="h-[300px] rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                      {loading ? (
                        <p className="py-8 text-center text-xs text-muted-foreground">Carregando...</p>
                      ) : produtosDisponiveis.length === 0 ? (
                        <p className="py-8 text-center text-xs text-muted-foreground">
                          Nenhum produto disponível
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {produtosDisponiveis.map((produto) => (
                            <div
                              key={produto.id}
                              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 hover:bg-zinc-800/50"
                            >
                              <Checkbox
                                checked={produtosSelecionadosGlobal.includes(produto.id)}
                                onCheckedChange={() => toggleProdutoGlobal(produto.id)}
                              />
                              {produto.foto_principal && (
                                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
                                  <Image
                                    src={produto.foto_principal}
                                    alt={produto.nome}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold">{produto.nome}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  R$ {produto.preco.toFixed(2)}
                                </p>
                              </div>
                              {produto.nivel_bateria && (
                                <Badge className="flex items-center gap-1 bg-zinc-800 px-1.5 py-0.5 text-[10px]">
                                  <BatteryIcon level={produto.nivel_bateria} />
                                  {produto.nivel_bateria}%
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}

                <Button
                  onClick={handleSaveGlobal}
                  disabled={saving}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar Configuração Global'}
                </Button>
              </div>
            </TabsContent>

            {/* TAB: Configuração Individual */}
            <TabsContent value="individual" className="mt-4 space-y-3">
              {loading ? (
                <p className="py-8 text-center text-xs text-muted-foreground">Carregando...</p>
              ) : produtosEmDestaque.length === 0 ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center">
                  <Star className="mx-auto mb-2 h-10 w-10 text-zinc-600" />
                  <p className="text-sm text-zinc-400">Nenhum produto em destaque</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Adicione produtos ao banner de destaque primeiro
                  </p>
                </div>
              ) : (
                produtosEmDestaque.map((produto) => {
                  const config = produto.config_temp || produto.config_individual || {
                    auto_select: true,
                    produtos_selecionados: [],
                    desconto_min: 3,
                    desconto_max: 7,
                  }
                  const isEditando = produtoEditando === produto.produto_id
                  const temConfigIndividual = produto.config_individual?.id

                  return (
                    <div
                      key={produto.produto_id}
                      className={`rounded-lg border-2 p-3 ${
                        temConfigIndividual 
                          ? 'border-yellow-500/50 bg-yellow-500/5' 
                          : 'border-zinc-800 bg-zinc-900/50'
                      }`}
                    >
                      {/* Header do Card */}
                      <div className="mb-3 flex items-start gap-3">
                        {produto.foto_principal && (
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={produto.foto_principal}
                              alt={produto.produto_nome}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{produto.produto_nome}</p>
                          <p className="text-xs text-muted-foreground">{produto.codigo_produto}</p>
                          {produto.nivel_bateria && (
                            <Badge className="mt-1 flex w-fit items-center gap-1 bg-zinc-800 px-1.5 py-0.5 text-[10px]">
                              <BatteryIcon level={produto.nivel_bateria} />
                              {produto.nivel_bateria}%
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant={isEditando ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            setProdutoEditando(isEditando ? null : produto.produto_id)
                          }
                          className="h-8"
                        >
                          <Settings className="mr-1.5 h-3.5 w-3.5" />
                          {isEditando ? 'Fechar' : 'Configurar'}
                        </Button>
                      </div>

                      {/* Toggle para Ativar/Desativar Config Individual */}
                      <div className={`mb-3 flex items-center justify-between rounded-lg border p-2 ${
                        temConfigIndividual 
                          ? 'border-yellow-500/30 bg-yellow-500/10' 
                          : 'border-zinc-800 bg-zinc-950/50'
                      }`}>
                        <div className="flex-1">
                          <Label className="text-xs font-semibold">
                            {temConfigIndividual ? '🎯 Config Individual Ativa' : '🌐 Usando Config Global'}
                          </Label>
                          <p className="text-[10px] text-muted-foreground">
                            {temConfigIndividual 
                              ? 'Este produto tem configuração própria' 
                              : 'Usando configuração global de produtos em destaque'}
                          </p>
                        </div>
                        <Switch
                          checked={temConfigIndividual}
                          onCheckedChange={(checked) => handleToggleConfigIndividual(produto, checked)}
                          disabled={saving}
                          className="data-[state=checked]:bg-yellow-600"
                        />
                      </div>

                      {isEditando && temConfigIndividual && (
                        <div className="space-y-3 border-t border-zinc-800 pt-3">
                          {/* Toggle Auto Select */}
                          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-2">
                            <Label className="text-xs">Seleção Automática</Label>
                            <Switch
                              checked={config.auto_select}
                              onCheckedChange={(checked) =>
                                updateProdutoTempConfig(produto, 'auto_select', checked)
                              }
                              className="data-[state=checked]:bg-green-600"
                            />
                          </div>

                          {/* Range de Desconto */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px]">Desconto Min (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={config.desconto_min}
                                onChange={(e) =>
                                  updateProdutoTempConfig(
                                    produto,
                                    'desconto_min',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="h-8 border-zinc-800 bg-zinc-900 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px]">Desconto Max (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={config.desconto_max}
                                onChange={(e) =>
                                  updateProdutoTempConfig(
                                    produto,
                                    'desconto_max',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="h-8 border-zinc-800 bg-zinc-900 text-xs"
                              />
                            </div>
                          </div>

                          {/* Seleção Manual */}
                          {!config.auto_select && (
                            <div className="space-y-2">
                              <Label className="text-xs">
                                Produtos ({config.produtos_selecionados?.length || 0})
                              </Label>
                              <ScrollArea className="h-[200px] rounded-lg border border-zinc-800 bg-zinc-950/50 p-2">
                                <div className="space-y-1">
                                  {produtosDisponiveis.map((p) => (
                                    <div
                                      key={p.id}
                                      className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900/50 p-1.5"
                                    >
                                      <Checkbox
                                        checked={config.produtos_selecionados?.includes(p.id)}
                                        onCheckedChange={() => toggleProdutoIndividual(produto, p.id)}
                                      />
                                      <p className="flex-1 truncate text-[10px]">{p.nome}</p>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          )}

                          <Button
                            onClick={() => handleSaveIndividual(produto)}
                            disabled={saving}
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            {saving ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t border-zinc-800 bg-zinc-950/50 px-4 py-3 sm:border-none sm:bg-transparent sm:px-0 sm:py-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 w-full sm:w-auto">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
