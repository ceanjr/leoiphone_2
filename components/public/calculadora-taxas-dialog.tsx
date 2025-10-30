'use client'

import { useState, useEffect } from 'react'
import { Calculator } from 'lucide-react'
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

  // Usar estado controlado se fornecido, senão usar estado interno
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen
  const [valor, setValor] = useState('')
  const [taxas, setTaxas] = useState<TaxasConfig>(TAXAS_PADRAO)
  const [loading, setLoading] = useState(true)

  // Carregar taxas do servidor
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

  // Converter valor digitado para número
  const valorNumerico = parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0

  // Calcular todas as parcelas
  const parcelas = valorNumerico > 0 ? calcularTodasParcelas(valorNumerico, taxas) : []
  const parcelaMaxima = parcelas.length > 0 ? parcelas[parcelas.length - 1] : null

  // Formatar valor enquanto digita
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

      <BottomSheetContent className="max-w-2xl border-zinc-800 bg-zinc-950/95 text-white shadow-[0_24px_80px_-35px_rgba(0,0,0,0.85)]">
        <BottomSheetHeader>
          <BottomSheetTitle className="text-xl font-semibold text-white">
            Calculadora de Parcelamento
          </BottomSheetTitle>
          <BottomSheetDescription className="text-zinc-400">
            Digite um valor e veja as opções de parcelamento disponíveis
          </BottomSheetDescription>
        </BottomSheetHeader>

        <div className="space-y-6 overflow-y-auto px-6 pb-6">
          {/* Input de Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor" className="text-sm text-zinc-300">
              Valor do produto
            </Label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400 transition-colors duration-200">R$</span>
              <Input
                id="valor"
                type="text"
                placeholder="0,00"
                value={valor}
                onChange={handleValorChange}
                className="border-zinc-800 bg-zinc-900 pl-10 text-lg text-white placeholder:text-zinc-600 transition-all duration-200 focus:border-[var(--brand-yellow)]/50 focus:ring-2 focus:ring-[var(--brand-yellow)]/20"
              />
            </div>
          </div>

          {/* Resultado */}
          {valorNumerico > 0 && parcelaMaxima && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Destaque */}
              <div className="rounded-lg border border-[var(--brand-yellow)]/30 bg-[var(--brand-yellow)]/10 p-4 animate-in zoom-in-95 duration-300 delay-75">
                <p className="mb-1 text-xs text-zinc-400">Parcele em até</p>
                <p className="text-2xl font-bold text-[var(--brand-yellow)]">
                  {parcelaMaxima.numero}x de {formatarMoeda(parcelaMaxima.valorParcela)}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Total: {formatarMoeda(parcelaMaxima.valorTotal)}
                </p>
              </div>

              {/* Tabela de Parcelas */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
                <div className="max-h-[400px] overflow-y-auto p-4">
                  <div className="space-y-2">
                    {parcelas.map((parcela, index) => (
                      <div
                        key={parcela.numero}
                        className={`flex items-center justify-between gap-4 rounded-lg p-3 transition-all duration-200 animate-in fade-in slide-in-from-left-1 ${
                          parcela.semJuros
                            ? 'border border-green-500/20 bg-green-500/10'
                            : 'bg-zinc-950 hover:bg-zinc-900 hover:scale-[1.02]'
                        }`}
                        style={{ animationDelay: `${200 + index * 30}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`min-w-[32px] text-sm font-semibold ${
                              parcela.semJuros ? 'text-green-400' : 'text-zinc-400'
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
                              <p className="text-xs text-zinc-500">
                                {parcela.taxa.toFixed(2)}% a.m.
                              </p>
                            )}
                          </div>
                        </div>

                        {!parcela.semJuros && (
                          <div className="text-right">
                            <p className="text-xs text-zinc-500">Total</p>
                            <p className="text-xs font-medium text-zinc-400">
                              {formatarMoeda(parcela.valorTotal)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nota */}
              <p className="text-xs text-zinc-600 animate-in fade-in duration-300 delay-300">
                💳 Valores calculados com base nas taxas de parcelamento no cartão de crédito.
              </p>
            </div>
          )}

          {/* Mensagem quando não há valor */}
          {valorNumerico === 0 && (
            <div className="flex h-32 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 animate-in fade-in duration-300">
              <p className="text-center text-sm text-zinc-500 animate-in fade-in slide-in-from-bottom-2 duration-500">
                Digite um valor acima para ver as opções de parcelamento
              </p>
            </div>
          )}
        </div>
      </BottomSheetContent>
    </BottomSheet>
  )
}
