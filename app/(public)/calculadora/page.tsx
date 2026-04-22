'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect, useRef } from 'react'
import { Calculator, Share2, Download, CreditCard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { calcularTodasParcelas, formatarMoeda } from '@/lib/utils/produtos/parcelas'
import { getConfiguracaoTaxas } from '@/app/admin/taxas/actions'
import type { TaxasConfig } from '@/lib/validations/taxas'
import { TAXAS_PADRAO } from '@/lib/validations/taxas'
import { toast } from 'sonner'
import { trackMetric } from '@/lib/utils/metrics'
import { CalculadoraExportRenderer } from '@/components/public/calculadora/calculadora-export-renderer'
import {
  exportSimulacao,
  downloadSimulacao,
  shareSimulacao,
} from '@/components/public/calculadora/calculadora-export-utils'

export default function CalculadoraPage() {
  const [valor, setValor] = useState('')
  const [taxas, setTaxas] = useState<TaxasConfig>(TAXAS_PADRAO)
  const [loading, setLoading] = useState(true)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [showExportComponent, setShowExportComponent] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Detectar mobile apenas no cliente, de forma segura
    setIsMobile(window.innerWidth < 640)

    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    async function loadTaxas() {
      setLoading(true)
      const { configuracao } = await getConfiguracaoTaxas()
      if (configuracao?.taxas) {
        setTaxas(configuracao.taxas)
      }
      setLoading(false)
    }
    loadTaxas()
  }, [])

  const valorNumerico = parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0

  const parcelas =
    valorNumerico > 0
      ? calcularTodasParcelas(valorNumerico, taxas).map((p) => ({
          ...p,
          taxaMensal: p.semJuros ? 0 : (p.valorTotal / p.valorParcela / p.numero - 1) * 100,
        }))
      : []

  const parcelaMaxima = parcelas[parcelas.length - 1]

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '')
    if (input === '') {
      setValor('')
      return
    }
    const numero = parseInt(input, 10) / 100

    if (numero > 0) {
      trackMetric({
        metricType: 'calculadora_taxas_calculate',
        metadata: { valor: numero },
      })
    }

    setValor(
      numero.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )
  }

  const handleGerarImagem = async () => {
    if (valorNumerico === 0 || parcelas.length === 0) {
      toast.error('Digite um valor para gerar a simulação')
      return
    }

    trackMetric({
      metricType: 'calculadora_taxas_download',
      metadata: { valor: valorNumerico },
    })

    setIsGeneratingImage(true)
    setShowExportComponent(true)
    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      const blob = await exportSimulacao(valor, parcelas)

      if (isMobile && typeof navigator.share === 'function') {
        const shared = await shareSimulacao(blob, valor)
        if (shared) {
          trackMetric({ metricType: 'calculadora_taxas_share', metadata: { valor: valorNumerico } })
          toast.success('Simulação compartilhada!')
        } else {
          downloadSimulacao(blob)
          toast.success('Simulação baixada!')
        }
      } else {
        downloadSimulacao(blob)
        toast.success('Simulação baixada!')
      }
    } catch (error) {
      logger.error('Erro ao gerar imagem:', error)
      toast.error('Erro ao gerar imagem da simulação')
    } finally {
      setIsGeneratingImage(false)
      setTimeout(() => setShowExportComponent(false), 500)
    }
  }

  return (
    <>
      {showExportComponent && parcelas.length > 0 && (
        <CalculadoraExportRenderer valor={valorNumerico} parcelas={parcelas} visible={true} />
      )}

      <div className="container mx-auto max-w-2xl px-4 py-10">
        {/* Header da página */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-yellow)]/10">
              <Calculator className="h-7 w-7 text-[var(--brand-yellow)]" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">Calculadora de Parcelamento</h1>
          <p className="text-zinc-400">
            Digite o valor do produto e veja todas as opções de parcelamento disponíveis
          </p>
        </div>

        {/* Input */}
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="space-y-2">
            <Label htmlFor="valor" className="text-sm font-medium text-zinc-200">
              Valor do produto
            </Label>
            <div className="relative">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 text-base font-medium text-zinc-400">
                R$
              </span>
              <Input
                id="valor"
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={valor}
                onChange={handleValorChange}
                className="h-14 border-zinc-700 bg-zinc-950 pl-12 text-xl font-semibold text-white placeholder:text-zinc-600 focus-visible:ring-[var(--brand-yellow)]"
              />
            </div>
          </div>
        </div>

        {/* Tabela de parcelas */}
        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
            <p className="text-sm text-zinc-500">Carregando taxas...</p>
          </div>
        ) : valorNumerico > 0 && parcelas.length > 0 ? (
          <div className="space-y-4">
            {/* Botão compartilhar/baixar */}
            <Button
              onClick={handleGerarImagem}
              disabled={isGeneratingImage}
              className="w-full bg-[var(--brand-yellow)] font-bold text-black hover:bg-[var(--brand-yellow)]/90"
              size="lg"
            >
              {isGeneratingImage ? (
                'Gerando imagem...'
              ) : isMobile ? (
                <>
                  <Share2 className="mr-2 h-5 w-5" />
                  Compartilhar Simulação
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Baixar Simulação
                </>
              )}
            </Button>

            {/* Lista de parcelas */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Opções de parcelamento</h2>
                <Badge variant="secondary" className="text-xs">
                  {parcelas.length} opções
                </Badge>
              </div>

              <div
                className="custom-scrollbar space-y-1.5 overflow-y-auto pr-1"
                style={{ maxHeight: '420px' }}
              >
                {parcelas.map((parcela) => (
                  <div
                    key={parcela.numero}
                    className={`flex items-center justify-between gap-4 rounded-lg px-3 py-3 transition-colors ${
                      parcela.semJuros
                        ? 'border border-green-500/20 bg-green-500/10'
                        : 'bg-zinc-950 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 text-sm font-bold tabular-nums ${
                          parcela.semJuros ? 'text-green-400' : 'text-zinc-400'
                        }`}
                      >
                        {parcela.numero}x
                      </span>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            parcela.semJuros ? 'text-green-400' : 'text-white'
                          }`}
                        >
                          {formatarMoeda(parcela.valorParcela)}
                        </p>
                        {parcela.semJuros ? (
                          <p className="text-xs font-medium text-green-500">sem juros</p>
                        ) : (
                          <p className="text-xs text-zinc-500">por mês</p>
                        )}
                      </div>
                    </div>

                    {!parcela.semJuros && (
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">Total</p>
                        <p className="text-sm font-medium text-zinc-400">
                          {formatarMoeda(parcela.valorTotal)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-zinc-600">
              💳 Valores calculados com base nas taxas de parcelamento no cartão de crédito
            </p>
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900">
            <CreditCard className="h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">Digite um valor acima para ver as parcelas</p>
          </div>
        )}
      </div>
    </>
  )
}