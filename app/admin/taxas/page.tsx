'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Save, RotateCcw, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  getConfiguracaoTaxas,
  updateConfiguracaoTaxas,
  restaurarTaxasPadrao,
} from './actions'
import { TAXAS_PADRAO, type TaxasConfig } from '@/lib/validations/taxas'
import { calcularTodasParcelas, formatarMoeda } from '@/lib/utils/calcular-parcelas'

const EXEMPLO_PRECO = 2800 // Preço exemplo para preview

export default function TaxasPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ativo, setAtivo] = useState(false)
  const [taxas, setTaxas] = useState<TaxasConfig>(TAXAS_PADRAO)
  const [hasChanges, setHasChanges] = useState(false)

  // Carregar configuração do servidor
  useEffect(() => {
    async function loadConfig() {
      setLoading(true)
      const { configuracao, error } = await getConfiguracaoTaxas()

      if (error) {
        toast.error(error)
      } else if (configuracao) {
        setAtivo(configuracao.ativo)
        setTaxas(configuracao.taxas)
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
      console.error('Erro ao salvar:', error)
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
      console.error('Erro ao restaurar:', error)
      toast.error('Erro inesperado ao restaurar')
    } finally {
      setSaving(false)
    }
  }

  // Calcular preview
  const parcelas = calcularTodasParcelas(EXEMPLO_PRECO, taxas)
  const parcelaMaxima = parcelas[parcelas.length - 1]

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
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
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-200">
              Você tem alterações não salvas. Clique em "Salvar Configurações" para aplicar.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal - Editor de Taxas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Toggle Ativo/Inativo */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
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
                  <Label htmlFor="ativo" className="text-white font-medium">
                    Exibir calculadora no site
                  </Label>
                  <p className="text-sm text-zinc-500 mt-1">
                    Os clientes poderão ver as opções de parcelamento
                  </p>
                </div>
                <Switch
                  id="ativo"
                  checked={ativo}
                  onCheckedChange={setAtivo}
                  disabled={saving}
                />
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(Object.keys(taxas) as Array<keyof TaxasConfig>).map((parcela) => (
                  <div key={parcela} className="space-y-2">
                    <Label htmlFor={parcela} className="text-zinc-300 text-sm">
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
                        className="border-zinc-800 bg-zinc-950 text-white pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6 bg-zinc-800" />

              <div className="flex flex-col sm:flex-row gap-3">
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

        {/* Coluna Lateral - Preview */}
        <div className="lg:col-span-1">
          <Card className="border-zinc-800 bg-zinc-900 sticky top-4">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
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
                <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4">
                  <p className="text-xs text-zinc-500 mb-1">Parcela máxima</p>
                  <p className="text-lg font-semibold text-[var(--brand-yellow)]">
                    {parcelaMaxima.numero}x de {formatarMoeda(parcelaMaxima.valorParcela)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Total: {formatarMoeda(parcelaMaxima.valorTotal)}
                  </p>
                </div>

                <Separator className="bg-zinc-800" />

                {/* Lista de todas as parcelas */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {parcelas.slice(0, 6).map((parcela) => (
                    <div
                      key={parcela.numero}
                      className="flex justify-between items-center text-sm py-2 px-3 rounded bg-zinc-950"
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
                    <p className="text-xs text-center text-zinc-600 py-2">
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
