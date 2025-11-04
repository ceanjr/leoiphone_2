'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { Calculator, Share2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/bottom-sheet'
import { calcularTodasParcelas, formatarMoeda } from '@/lib/utils/produtos/parcelas'
import { getConfiguracaoTaxas } from '@/app/admin/taxas/actions'
import type { TaxasConfig } from '@/lib/validations/taxas'
import { TAXAS_PADRAO } from '@/lib/validations/taxas'
import { toast } from 'sonner'
import { trackMetric } from '@/lib/utils/metrics'
import { CalculadoraExportRenderer } from './calculadora-export-renderer'
import { exportSimulacao, downloadSimulacao, shareSimulacao } from './calculadora-export-utils'

interface CalculadoraTaxasDialogProps {
  triggerClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CalculadoraTaxasDialog({
  triggerClassName,
  open: controlledOpen,
  onOpenChange,
}: CalculadoraTaxasDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      trackMetric({ metricType: 'calculadora_taxas_open' })
    }
    setOpen(newOpen)
  }
  const [valor, setValor] = useState('')
  const [taxas, setTaxas] = useState<TaxasConfig>(TAXAS_PADRAO)
  const [loading, setLoading] = useState(true)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [showExportComponent, setShowExportComponent] = useState(false)

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

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '')
    if (input === '') {
      setValor('')
      return
    }
    const numero = parseInt(input, 10) / 100

    // Track calculation when user enters a value
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

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

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

    // Forçar renderização do componente
    setShowExportComponent(true)

    // Aguardar renderização
    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      const blob = await exportSimulacao(valor, parcelas)

      if (isMobile && (await navigator.share())) {
        const shared = await shareSimulacao(blob, valor)

        if (shared) {
          trackMetric({
            metricType: 'calculadora_taxas_share',
            metadata: { valor: valorNumerico },
          })
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
      logger.error('❌ Erro ao gerar imagem:', error)
      if (error instanceof Error) {
        toast.error(`Erro: ${error.message}`)
      } else {
        toast.error('Erro ao gerar imagem da simulação')
      }
    } finally {
      setIsGeneratingImage(false)
      // Esconder componente novamente
      setTimeout(() => setShowExportComponent(false), 500)
    }
  }

  return (
    <>
      {/* Componente oculto para exportação - renderiza quando necessário */}
      {showExportComponent && parcelas.length > 0 && (
        <CalculadoraExportRenderer valor={valor} parcelas={parcelas} visible={true} />
      )}

      <BottomSheet open={open} onOpenChange={handleOpenChange}>
        {triggerClassName !== 'hidden' && (
          <BottomSheetTrigger asChild>
            <Button variant="outline" className={triggerClassName}>
              <Calculator className="mr-2 h-4 w-4" />
              Calculadora de Taxas
            </Button>
          </BottomSheetTrigger>
        )}

        <BottomSheetContent className="max-w-6xl border-[#1f1f1f] bg-[#000000]">
          <BottomSheetHeader>
            <BottomSheetTitle className="text-xl font-semibold text-white">
              Calculadora de Parcelamento
            </BottomSheetTitle>
            <BottomSheetDescription className="text-[#a0a0a0]">
              Digite um valor e veja as opções de parcelamento disponíveis
            </BottomSheetDescription>
          </BottomSheetHeader>

          <div className="flex flex-col gap-6 px-6 pb-6">
            {/* Input de Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor" className="text-sm text-white">
                Valor da Simulação
              </Label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[#a0a0a0]">R$</span>
                <Input
                  id="valor"
                  type="text"
                  placeholder="0,00"
                  value={valor}
                  onChange={handleValorChange}
                  className="border-[#1f1f1f] bg-[#0d0d0d] pl-10 text-lg text-white shadow-[0_0_20px_rgba(255,255,255,0.03)] placeholder:text-[#666666]"
                />
              </div>
            </div>

            {/* Tabela de Parcelas */}
            {valorNumerico > 0 && parcelas.length > 0 ? (
              <div className="space-y-4">
                {/* Botão Enviar Simulação - ACIMA da tabela */}
                <Button
                  onClick={handleGerarImagem}
                  disabled={isGeneratingImage}
                  className="w-full bg-[#ffcc00] font-bold text-black shadow-[0_0_20px_rgba(255,204,0,0.1)] hover:bg-[#ffcc00]/90"
                >
                  {isGeneratingImage ? (
                    <>Gerando imagem...</>
                  ) : (
                    <>
                      {isMobile ? (
                        <>
                          <Share2 className="mr-2 h-4 w-4" />
                          Enviar Simulação
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Baixar Simulação
                        </>
                      )}
                    </>
                  )}
                </Button>

                <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-4 shadow-[0_0_20px_rgba(255,255,255,0.03)]">
                  <h3 className="mb-3 text-sm font-semibold text-white">Opções de Parcelamento</h3>

                  {/* Tabela com scroll - visual semelhante à página do produto */}
                  <div
                    className="custom-scrollbar scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-[#0d0d0d] space-y-1.5 overflow-y-auto pr-2"
                    style={{ maxHeight: '300px' }}
                  >
                    {parcelas.map((parcela) => (
                      <div
                        key={parcela.numero}
                        className={`flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors ${
                          parcela.semJuros
                            ? 'border border-green-500/20 bg-green-500/10'
                            : 'bg-[#111111] hover:bg-[#1a1a1a]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`min-w-[32px] text-sm font-semibold ${
                              parcela.semJuros ? 'text-green-400' : 'text-[#a0a0a0]'
                            }`}
                          >
                            {parcela.numero}x
                          </span>
                          <div>
                            <p
                              className={`text-sm font-medium ${
                                parcela.semJuros ? 'text-green-400' : 'text-white'
                              }`}
                            >
                              {formatarMoeda(parcela.valorParcela)}
                            </p>
                            {parcela.semJuros ? (
                              <p className="text-xs text-green-500">sem juros</p>
                            ) : (
                              <p className="text-xs text-[#666666]">Por mês</p>
                            )}
                          </div>
                        </div>

                        {!parcela.semJuros && (
                          <div className="text-right">
                            <p className="text-xs text-[#666666]">Total</p>
                            <p className="text-xs font-medium text-[#a0a0a0]">
                              {formatarMoeda(parcela.valorTotal)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nota */}
                <p className="text-xs text-[#666666]">
                  💳 Valores calculados com base nas taxas de parcelamento no cartão de crédito.
                </p>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] shadow-[0_0_20px_rgba(255,255,255,0.03)]">
                <p className="text-center text-sm text-[#666666]">
                  Digite um valor acima para ver as opções de parcelamento
                </p>
              </div>
            )}
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </>
  )
}
