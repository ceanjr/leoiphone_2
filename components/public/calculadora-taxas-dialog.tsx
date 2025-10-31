'use client'

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
import { calcularTodasParcelas, formatarMoeda } from '@/lib/utils/calcular-parcelas'
import { getConfiguracaoTaxas } from '@/app/admin/taxas/actions'
import type { TaxasConfig } from '@/lib/validations/taxas'
import { TAXAS_PADRAO } from '@/lib/validations/taxas'
import { toast } from 'sonner'

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
  const [valor, setValor] = useState('')
  const [taxas, setTaxas] = useState<TaxasConfig>(TAXAS_PADRAO)
  const [loading, setLoading] = useState(true)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

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

  const parcelas = valorNumerico > 0 ? calcularTodasParcelas(valorNumerico, taxas) : []

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '')
    if (input === '') {
      setValor('')
      return
    }
    const numero = parseInt(input, 10) / 100
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

    setIsGeneratingImage(true)

    try {
      const canvas = document.createElement('canvas')
      const width = 800 // Largura adequada para WhatsApp
      const padding = 30
      const headerHeight = 120
      const itemHeight = 42
      const footerHeight = 80
      const spacing = 2

      // Calcular altura total baseada no número de parcelas
      const contentHeight =
        parcelas.length * itemHeight + (parcelas.length - 1) * spacing + padding * 2
      const height = headerHeight + contentHeight + footerHeight

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Não foi possível criar contexto do canvas')

      // Background simples
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)

      // Header
      let yPos = 50

      // Logo
      ctx.fillStyle = '#ffcc00'
      ctx.font = 'bold 42px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Léo iPhone', width / 2, yPos)

      yPos += 35

      // Subtítulo com valor
      ctx.fillStyle = '#ffffff'
      ctx.font = '24px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`Parcelamento de R$ ${valor}`, width / 2, yPos)

      yPos += 50

      // Linha separadora
      ctx.strokeStyle = '#333333'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padding, yPos)
      ctx.lineTo(width - padding, yPos)
      ctx.stroke()

      yPos += padding

      // Tabela de parcelas - TODAS as 18 parcelas
      parcelas.forEach((parcela, index) => {
        // Background alternado para melhor leitura
        if (index % 2 === 0) {
          ctx.fillStyle = '#0a0a0a'
          ctx.fillRect(padding, yPos, width - padding * 2, itemHeight)
        }

        // Destaque para parcelas sem juros
        if (parcela.semJuros) {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.1)'
          ctx.fillRect(padding, yPos, width - padding * 2, itemHeight)
        }

        // Número de parcelas
        ctx.textAlign = 'left'
        ctx.fillStyle = parcela.semJuros ? '#4ade80' : '#bbbbbb'
        ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
        ctx.fillText(`${parcela.numero}x`, padding + 15, yPos + 27)

        // Valor da parcela
        ctx.fillStyle = parcela.semJuros ? '#86efac' : '#ffffff'
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
        ctx.fillText(formatarMoeda(parcela.valorParcela), padding + 80, yPos + 27)

        // Informação adicional (sem juros ou taxa)
        ctx.textAlign = 'right'
        if (parcela.semJuros) {
          ctx.fillStyle = '#4ade80'
          ctx.font = '14px system-ui, -apple-system, sans-serif'
          ctx.fillText('SEM JUROS', width - padding - 15, yPos + 27)
        } else {
          ctx.fillStyle = '#888888'
          ctx.font = '14px system-ui, -apple-system, sans-serif'
          ctx.fillText(
            `Total: ${formatarMoeda(parcela.valorTotal)}`,
            width - padding - 15,
            yPos + 27
          )
        }

        yPos += itemHeight + spacing
      })

      yPos += padding - spacing

      // Linha separadora
      ctx.strokeStyle = '#333333'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padding, yPos)
      ctx.lineTo(width - padding, yPos)
      ctx.stroke()

      yPos += 35

      // Footer
      ctx.fillStyle = '#888888'
      ctx.font = '13px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('💳 Valores calculados com taxas de cartão de crédito', width / 2, yPos)

      yPos += 20

      const dataAtual = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      ctx.fillText(`Gerado em ${dataAtual}`, width / 2, yPos)

      // Converter para blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Falha ao gerar blob da imagem'))
            }
          },
          'image/png',
          0.95
        )
      })

      if (isMobile && navigator.share) {
        try {
          const file = new File([blob], `simulacao-parcelas-${Date.now()}.png`, {
            type: 'image/png',
          })

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Simulação de Parcelamento - Léo iPhone',
              text: `Simulação de parcelamento para R$ ${valor}`,
              files: [file],
            })
            toast.success('Simulação compartilhada!')
          } else {
            downloadImage(blob)
          }
        } catch (shareError) {
          console.log('[Export] Erro no compartilhamento, usando download:', shareError)
          downloadImage(blob)
        }
      } else {
        downloadImage(blob)
      }
    } catch (error) {
      console.error('[Export] Erro ao gerar imagem:', error)
      if (error instanceof Error) {
        toast.error(`Erro: ${error.message}`)
      } else {
        toast.error('Erro ao gerar imagem da simulação')
      }
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const downloadImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `simulacao-parcelas-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Simulação baixada!')
  }

  return (
    <BottomSheet open={open} onOpenChange={setOpen}>
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
                  className="scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-[#0d0d0d] space-y-1.5 overflow-y-auto pr-2"
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
  )
}
