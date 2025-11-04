'use client'
import { logger } from '@/lib/utils/logger'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Save,
  RotateCcw,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  Plus,
  Trash2,
  Check,
} from 'lucide-react'
import {
  getConfiguracaoTaxas,
  updateConfiguracaoTaxas,
  restaurarTaxasPadrao,
  getPresets,
  createPreset,
  deletePreset,
  applyPreset,
} from './actions'
import { TAXAS_PADRAO, type TaxasConfig, type PresetTaxas } from '@/lib/validations/taxas'
import { calcularTodasParcelas, formatarMoeda } from '@/lib/utils/produtos/parcelas'

const EXEMPLO_PRECO = 2800 // Preço exemplo para preview

export default function TaxasPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ativo, setAtivo] = useState(false)
  const [taxas, setTaxas] = useState<TaxasConfig>(TAXAS_PADRAO)
  const [hasChanges, setHasChanges] = useState(false)
  const [presets, setPresets] = useState<PresetTaxas[]>([])
  const [newPresetName, setNewPresetName] = useState('')
  const [savingPreset, setSavingPreset] = useState(false)

  // Carregar configuração e presets do servidor
  useEffect(() => {
    async function loadConfig() {
      setLoading(true)
      const [configResult, presetsResult] = await Promise.all([
        getConfiguracaoTaxas(),
        getPresets(),
      ])

      if (configResult.error) {
        toast.error(configResult.error)
      } else if (configResult.configuracao) {
        setAtivo(configResult.configuracao.ativo)
        setTaxas(configResult.configuracao.taxas)
      }

      if (presetsResult.error) {
        toast.error(presetsResult.error)
      } else {
        setPresets(presetsResult.presets)
      }

      setLoading(false)
    }

    loadConfig()
  }, [])

  // Detectar mudanças
  useEffect(() => {
    // Não marcar como alterado durante carregamento inicial
    if (loading) return
    setHasChanges(true)
  }, [ativo, taxas, loading])

  const handleTaxaChange = useCallback((parcela: keyof TaxasConfig, valor: string) => {
    const numero = parseFloat(valor)
    if (isNaN(numero)) return

    setTaxas((prev) => ({
      ...prev,
      [parcela]: numero,
    }))
  }, [])

  const handleSave = async () => {
    setSaving(true)

    try {
      const result = await updateConfiguracaoTaxas({ ativo, taxas })

      if (result.success) {
        toast.success('Configurações salvas com sucesso!')
        setHasChanges(false)
      } else {
        toast.error(result.error || 'Erro ao salvar configurações')
      }
    } catch (error) {
      logger.error('Erro ao salvar:', error)
      toast.error('Erro inesperado ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleRestaurarPadrao = async () => {
    if (!confirm('Tem certeza que deseja restaurar as taxas padrão?')) {
      return
    }

    setSaving(true)

    try {
      const result = await restaurarTaxasPadrao()

      if (result.success) {
        setAtivo(false)
        setTaxas(TAXAS_PADRAO)
        setHasChanges(false)
        toast.success('Taxas restauradas para os valores padrão!')
      } else {
        toast.error(result.error || 'Erro ao restaurar taxas')
      }
    } catch (error) {
      logger.error('Erro ao restaurar:', error)
      toast.error('Erro inesperado ao restaurar')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) {
      toast.error('Digite um nome para o preset')
      return
    }

    setSavingPreset(true)

    try {
      const result = await createPreset({
        nome: newPresetName.trim(),
        taxas: taxas,
        is_default: false,
      })

      if (result.success && result.preset) {
        setPresets([...presets, result.preset])
        setNewPresetName('')
        toast.success(`Preset "${newPresetName}" criado com sucesso!`)
      } else {
        toast.error(result.error || 'Erro ao criar preset')
      }
    } catch (error) {
      logger.error('Erro ao criar preset:', error)
      toast.error('Erro inesperado ao criar preset')
    } finally {
      setSavingPreset(false)
    }
  }

  const handleApplyPreset = async (presetId: string) => {
    setSaving(true)

    try {
      const result = await applyPreset(presetId)

      if (result.success && result.configuracao) {
        setTaxas(result.configuracao.taxas)
        setHasChanges(false)
        const preset = presets.find((p) => p.id === presetId)
        toast.success(`Preset "${preset?.nome}" aplicado com sucesso!`)
      } else {
        toast.error(result.error || 'Erro ao aplicar preset')
      }
    } catch (error) {
      logger.error('Erro ao aplicar preset:', error)
      toast.error('Erro inesperado ao aplicar preset')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePreset = async (presetId: string, presetName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o preset "${presetName}"?`)) {
      return
    }

    setSaving(true)

    try {
      const result = await deletePreset(presetId)

      if (result.success) {
        setPresets(presets.filter((p) => p.id !== presetId))
        toast.success(`Preset "${presetName}" deletado com sucesso!`)
      } else {
        toast.error(result.error || 'Erro ao deletar preset')
      }
    } catch (error) {
      logger.error('Erro ao deletar preset:', error)
      toast.error('Erro inesperado ao deletar preset')
    } finally {
      setSaving(false)
    }
  }

  // Calcular preview
  const parcelas = calcularTodasParcelas(EXEMPLO_PRECO, taxas)
  const parcelaMaxima = parcelas[parcelas.length - 1]

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto h-8 w-8 animate-pulse">
              <div className="h-full w-full rounded-full border-4 border-zinc-700 opacity-40 brightness-150 grayscale" />
            </div>
            <p className="mt-4 text-sm text-zinc-400">Carregando configurações...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Calculator className="h-8 w-8 text-[var(--brand-yellow)]" />
          <h1 className="text-3xl font-bold text-white">Calculadora de Parcelas</h1>
        </div>
        <p className="text-zinc-400">
          Configure as taxas de parcelamento exibidas no site para os clientes
        </p>
      </div>

      {/* Alertas */}
      {hasChanges && (
        <Card className="mb-6 border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-500" />
            <p className="text-sm text-yellow-200">
              Você tem alterações não salvas. Clique em "Salvar Configurações" para aplicar.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna Principal - Editor de Taxas */}
        <div className="space-y-6 lg:col-span-2">
          {/* Toggle Ativo/Inativo */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                Status da Calculadora
                {ativo ? (
                  <Badge className="bg-green-600">Ativa</Badge>
                ) : (
                  <Badge variant="secondary">Inativa</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Ative para exibir a calculadora de parcelas nas páginas de produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ativo" className="font-medium text-white">
                    Exibir calculadora no site
                  </Label>
                  <p className="mt-1 text-sm text-zinc-500">
                    Os clientes poderão ver as opções de parcelamento
                  </p>
                </div>
                <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} disabled={saving} />
              </div>
            </CardContent>
          </Card>

          {/* Editor de Taxas */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white">Taxas por Parcela</CardTitle>
              <CardDescription>
                Configure a taxa de juros (%) para cada quantidade de parcelas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {(Object.keys(taxas) as Array<keyof TaxasConfig>).map((parcela) => (
                  <div key={parcela} className="space-y-2">
                    <Label htmlFor={parcela} className="text-sm text-zinc-300">
                      {parcela}
                    </Label>
                    <div className="relative">
                      <Input
                        id={parcela}
                        type="number"
                        min="0"
                        max="50"
                        step="0.1"
                        value={taxas[parcela]}
                        onChange={(e) => handleTaxaChange(parcela, e.target.value)}
                        disabled={saving}
                        className="border-zinc-800 bg-zinc-950 pr-8 text-white"
                      />
                      <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-zinc-500">
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6 bg-zinc-800" />

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="bg-[var(--brand-yellow)] text-[var(--brand-black)] hover:bg-[var(--brand-yellow)]/90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>

                <Button
                  onClick={handleRestaurarPadrao}
                  disabled={saving}
                  variant="outline"
                  className="border-zinc-700"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restaurar Padrões
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral - Presets e Preview */}
        <div className="space-y-6 lg:col-span-1">
          {/* Presets */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bookmark className="h-5 w-5 text-[var(--brand-yellow)]" />
                Presets
              </CardTitle>
              <CardDescription>Salve e aplique configurações rapidamente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Formulário para criar preset */}
                <div className="space-y-2">
                  <Label htmlFor="preset-name" className="text-sm text-zinc-300">
                    Salvar configuração atual
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="preset-name"
                      placeholder="Nome do preset"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      disabled={savingPreset}
                      className="border-zinc-800 bg-zinc-950 text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSavePreset()
                        }
                      }}
                    />
                    <Button
                      onClick={handleSavePreset}
                      disabled={savingPreset || !newPresetName.trim()}
                      size="sm"
                      className="bg-[var(--brand-yellow)] text-[var(--brand-black)] hover:bg-[var(--brand-yellow)]/90"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator className="bg-zinc-800" />

                {/* Lista de presets */}
                <div className="space-y-2">
                  {presets.length === 0 ? (
                    <p className="text-center text-sm text-zinc-500 py-4">
                      Nenhum preset salvo ainda
                    </p>
                  ) : (
                    presets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {preset.nome}
                          </p>
                          {preset.is_default && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Padrão
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-shrink-0 gap-1">
                          <Button
                            onClick={() => handleApplyPreset(preset.id!)}
                            disabled={saving}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 border-zinc-700"
                            title="Aplicar preset"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeletePreset(preset.id!, preset.nome)}
                            disabled={saving}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 border-zinc-700 hover:border-red-500 hover:text-red-500"
                            title="Deletar preset"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="sticky top-4 border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Preview
              </CardTitle>
              <CardDescription>
                Exemplo com produto de {formatarMoeda(EXEMPLO_PRECO)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Destaque da maior parcela */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <p className="mb-1 text-xs text-zinc-500">Parcela máxima</p>
                  <p className="text-lg font-semibold text-[var(--brand-yellow)]">
                    {parcelaMaxima.numero}x de {formatarMoeda(parcelaMaxima.valorParcela)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Total: {formatarMoeda(parcelaMaxima.valorTotal)}
                  </p>
                </div>

                <Separator className="bg-zinc-800" />

                {/* Lista de todas as parcelas */}
                <div className="max-h-[400px] space-y-2 overflow-y-auto pr-2">
                  {parcelas.slice(0, 6).map((parcela) => (
                    <div
                      key={parcela.numero}
                      className="flex items-center justify-between rounded bg-zinc-950 px-3 py-2 text-sm"
                    >
                      <span className="text-zinc-400">
                        {parcela.numero}x
                        {parcela.semJuros && (
                          <span className="ml-2 text-xs text-green-500">sem juros</span>
                        )}
                      </span>
                      <span className="font-medium text-white">
                        {formatarMoeda(parcela.valorParcela)}
                      </span>
                    </div>
                  ))}
                  {parcelas.length > 6 && (
                    <p className="py-2 text-center text-xs text-zinc-600">
                      ... e mais {parcelas.length - 6} opções
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
