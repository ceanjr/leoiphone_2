'use client'

import { useState, useEffect, useRef } from 'react'
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
import html2canvas from 'html2canvas'
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
  const simulacaoRef = useRef<HTMLDivElement>(null)

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
  const parcelaMaxima = parcelas.length > 0 ? parcelas[parcelas.length - 1] : null

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
    if (!simulacaoRef.current || valorNumerico === 0) {
      toast.error('Nenhum conteúdo para exportar')
      return
    }

    setIsGeneratingImage(true)

    try {
      console.log('[Export] Iniciando captura da simulação...')
      console.log('[Export] Elemento ref:', simulacaoRef.current)

      await new Promise((resolve) => setTimeout(resolve, 300))

      // Encontrar todos os elementos com scroll e salvá-los
      const allDivs = simulacaoRef.current.querySelectorAll('div')
      const scrollData: Array<{ element: HTMLElement; maxHeight: string; overflowY: string }> = []

      allDivs.forEach((div) => {
        const style = (div as HTMLElement).style
        if (style.maxHeight || style.overflowY === 'auto') {
          scrollData.push({
            element: div as HTMLElement,
            maxHeight: style.maxHeight,
            overflowY: style.overflowY,
          })
          style.maxHeight = 'none'
          style.overflowY = 'visible'
        }
      })

      // Aguardar renderização
      await new Promise((resolve) => setTimeout(resolve, 100))

      const canvas = await html2canvas(simulacaoRef.current, {
        backgroundColor: '#09090b',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        removeContainer: true,
        imageTimeout: 15000,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        windowHeight: simulacaoRef.current.scrollHeight,
      })

      // Restaurar os estilos originais
      scrollData.forEach(({ element, maxHeight, overflowY }) => {
        element.style.maxHeight = maxHeight
        element.style.overflowY = overflowY
      })

      console.log('[Export] Canvas gerado:', canvas.width, 'x', canvas.height)

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log('[Export] Blob gerado:', blob.size, 'bytes')
              resolve(blob)
            } else {
              reject(new Error('Falha ao gerar blob da imagem'))
            }
          },
          'image/png',
          1.0
        )
      })

      if (isMobile && navigator.share) {
        try {
          const file = new File([blob], `simulacao-parcelas-${Date.now()}.png`, {
            type: 'image/png',
          })

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Simulação de Parcelamento',
              text: `Simulação de parcelamento para R$ ${valor}`,
              files: [file],
            })
            toast.success('Simulação compartilhada!')
          } else {
            console.log('[Export] Web Share API não suporta arquivos, usando download')
            downloadImage(blob)
          }
        } catch (shareError) {
          console.log('[Export] Erro no compartilhamento, usando download:', shareError)
          downloadImage(blob)
        }
      } else {
        console.log('[Export] Desktop mode, fazendo download')
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
            <Calculator style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} />
            Calculadora de Taxas
          </Button>
        </BottomSheetTrigger>
      )}

      <BottomSheetContent
        style={{
          borderColor: '#27272a',
          backgroundColor: 'rgba(9, 9, 11, 0.95)',
          color: 'white',
          boxShadow: '0 24px 80px -35px rgba(0,0,0,0.85)',
          maxWidth: '72rem',
        }}
      >
        <BottomSheetHeader>
          <BottomSheetTitle style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>
            Calculadora de Parcelamento
          </BottomSheetTitle>
          <BottomSheetDescription style={{ color: '#a1a1aa' }}>
            Digite um valor e veja as opções de parcelamento disponíveis
          </BottomSheetDescription>
        </BottomSheetHeader>

        <div
          style={{
            overflowX: 'hidden',
            overflowY: 'auto',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            paddingBottom: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: window.innerWidth >= 640 ? 'repeat(2, 1fr)' : '1fr',
            }}
          >
            {/* Coluna Esquerda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Input de Valor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Label htmlFor="valor" style={{ fontSize: '0.875rem', color: '#d4d4d8' }}>
                  Valor da Simulação
                </Label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '0.75rem',
                      transform: 'translateY(-50%)',
                      color: '#a1a1aa',
                      transition: 'color 0.2s',
                    }}
                  >
                    R$
                  </span>
                  <Input
                    id="valor"
                    type="text"
                    placeholder="0,00"
                    value={valor}
                    onChange={handleValorChange}
                    style={{
                      borderColor: '#27272a',
                      backgroundColor: '#18181b',
                      paddingLeft: '2.5rem',
                      fontSize: '1.125rem',
                      color: 'white',
                      transition: 'all 0.2s',
                    }}
                  />
                </div>
              </div>

              {/* Destaque */}
              {valorNumerico > 0 && parcelaMaxima && (
                <>
                  <div
                    style={{
                      animation: 'zoomIn 0.3s ease-out',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      backgroundColor: 'rgba(251, 191, 36, 0.1)',
                      padding: '1rem',
                    }}
                  >
                    <p
                      style={{
                        marginBottom: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#a1a1aa',
                        margin: 0,
                      }}
                    >
                      Parcele em até
                    </p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fbbf24', margin: 0 }}>
                      {parcelaMaxima.numero}x de {formatarMoeda(parcelaMaxima.valorParcela)}
                    </p>
                    <p
                      style={{
                        marginTop: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#a1a1aa',
                        margin: '0.25rem 0 0 0',
                      }}
                    >
                      Total: {formatarMoeda(parcelaMaxima.valorTotal)}
                    </p>
                  </div>

                  {/* Nota */}
                  <p
                    style={{
                      animation: 'fadeIn 0.3s ease-out',
                      fontSize: '0.75rem',
                      color: '#52525b',
                      margin: 0,
                    }}
                  >
                    💳 Valores calculados com base nas taxas de parcelamento no cartão de crédito.
                  </p>

                  {/* Botão Enviar Simulação */}
                  <Button
                    onClick={handleGerarImagem}
                    disabled={isGeneratingImage}
                    style={{
                      animation: 'slideUp 0.3s ease-out',
                      width: '100%',
                      backgroundColor: 'var(--brand-yellow)',
                      color: 'var(--brand-black)',
                    }}
                  >
                    {isGeneratingImage ? (
                      <>Gerando imagem...</>
                    ) : (
                      <>
                        {isMobile ? (
                          <>
                            <Share2
                              style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }}
                            />
                            Enviar Simulação
                          </>
                        ) : (
                          <>
                            <Download
                              style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }}
                            />
                            Baixar Simulação
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </>
              )}

              {/* Mensagem quando não há valor */}
              {valorNumerico === 0 && (
                <div
                  style={{
                    animation: 'fadeIn 0.3s ease-out',
                    display: 'flex',
                    height: '8rem',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '0.5rem',
                    border: '1px solid #27272a',
                    backgroundColor: 'rgba(24, 24, 27, 0.5)',
                  }}
                >
                  <p
                    style={{
                      animation: 'slideUp 0.5s ease-out',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: '#71717a',
                      margin: 0,
                    }}
                  >
                    Digite um valor acima para ver as opções de parcelamento
                  </p>
                </div>
              )}
            </div>

            {/* Coluna Direita */}
            {valorNumerico > 0 && parcelaMaxima && (
              <div
                ref={simulacaoRef}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: window.innerWidth >= 640 ? '1rem' : '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#09090b',
                  padding: window.innerWidth >= 640 ? '1rem' : '0',
                  color: '#ffffff',
                }}
              >
                {/* Header para imagem exportada */}
                <div
                  style={{
                    borderRadius: '0.5rem',
                    border: '1px solid #27272a',
                    backgroundColor: '#18181b',
                    padding: window.innerWidth >= 640 ? '1rem' : '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: window.innerWidth >= 640 ? '0' : '0.75rem',
                      alignItems: window.innerWidth >= 640 ? 'center' : 'flex-start',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: window.innerWidth >= 640 ? '1.125rem' : '1rem',
                          fontWeight: 700,
                          color: '#fbbf24',
                        }}
                      >
                        Léo iPhone
                      </h3>
                      <p
                        style={{
                          marginTop: '0.25rem',
                          fontSize: '0.75rem',
                          color: '#a1a1aa',
                          margin: '0.25rem 0 0 0',
                        }}
                      >
                        Simulação de Parcelamento
                      </p>
                    </div>
                    <div style={{ textAlign: window.innerWidth >= 640 ? 'right' : 'left' }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#71717a' }}>
                        Valor simulado
                      </p>
                      <p
                        style={{
                          marginTop: '0.25rem',
                          fontSize: window.innerWidth >= 640 ? '1.25rem' : '1.125rem',
                          fontWeight: 700,
                          color: '#fbbf24',
                          margin: '0.25rem 0 0 0',
                        }}
                      >
                        R$ {valor}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabela de Parcelas */}
                <div
                  style={{
                    borderRadius: '0.5rem',
                    border: '1px solid #27272a',
                    backgroundColor: '#18181b',
                    padding: window.innerWidth >= 640 ? '1rem' : '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: window.innerWidth >= 640 ? 'repeat(2, 1fr)' : '1fr',
                      gap: '0.5rem',
                      maxHeight: window.innerWidth >= 640 ? '400px' : '350px',
                      overflowY: 'auto',
                      paddingRight: window.innerWidth >= 640 ? '0.5rem' : '0.25rem',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#27272a #18181b',
                    }}
                  >
                    {parcelas.map((parcela) => (
                      <div
                        key={parcela.numero}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          borderRadius: '0.5rem',
                          backgroundColor: '#09090b',
                          padding: window.innerWidth >= 640 ? '0.625rem' : '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              minWidth: '24px',
                              fontSize: window.innerWidth >= 640 ? '0.875rem' : '0.75rem',
                              fontWeight: 600,
                              color: '#a1a1aa',
                            }}
                          >
                            {parcela.numero}x
                          </span>
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: window.innerWidth >= 640 ? '1rem' : '0.875rem',
                                fontWeight: 500,
                                color: 'white',
                              }}
                            >
                              {formatarMoeda(parcela.valorParcela)}
                            </p>
                            <p
                              style={{
                                marginTop: '0.125rem',
                                fontSize: window.innerWidth >= 640 ? '0.75rem' : '0.6875rem',
                                color: '#71717a',
                                margin: '0.125rem 0 0 0',
                              }}
                            >
                              {parcela.taxa.toFixed(2)}% a.m.
                            </p>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.6875rem',
                              color: '#71717a',
                            }}
                          >
                            Total
                          </p>
                          <p
                            style={{
                              marginTop: '0.125rem',
                              fontSize: window.innerWidth >= 640 ? '0.875rem' : '0.75rem',
                              fontWeight: 500,
                              color: '#a1a1aa',
                              margin: '0.125rem 0 0 0',
                            }}
                          >
                            {formatarMoeda(parcela.valorTotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes zoomIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(0.5rem);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </BottomSheetContent>
    </BottomSheet>
  )
}
