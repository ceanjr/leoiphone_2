'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { TaxasConfig } from '@/lib/validations/taxas'
import { calcularTodasParcelas, formatarMoeda } from '@/lib/utils/calcular-parcelas'

interface CalculadoraParcelasProps {
  preco: number
  taxas: TaxasConfig
}

export function CalculadoraParcelas({ preco, taxas }: CalculadoraParcelasProps) {
  const [expandido, setExpandido] = useState(false)

  // Calcular todas as parcelas
  const parcelas = calcularTodasParcelas(preco, taxas)
  const parcelaMaxima = parcelas[parcelas.length - 1]

  return (
    <div className="w-full">
      {/* Mini-tabela Colapsada */}
      <Card className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
        <CardContent className="p-4">
          <button
            onClick={() => setExpandido(!expandido)}
            className="w-full text-left"
            aria-expanded={expandido}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CreditCard className="h-5 w-5 text-[var(--brand-yellow)] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">
                    em até {parcelaMaxima.numero}x de{' '}
                    <span className="text-[var(--brand-yellow)]">
                      {formatarMoeda(parcelaMaxima.valorParcela)}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {expandido ? 'Ocultar' : 'Ver todas as'} parcelas
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-8 w-8 p-0 hover:bg-zinc-800"
              >
                {expandido ? (
                  <ChevronUp className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                )}
              </Button>
            </div>
          </button>

          {/* Tabela Expandida */}
          {expandido && (
            <div
              className="mt-4 pt-4 border-t border-zinc-800 space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200"
              role="region"
              aria-label="Opções de parcelamento"
            >
              {/* Título */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Opções de Parcelamento</h3>
                <Badge variant="secondary" className="text-xs">
                  {parcelas.length} opções
                </Badge>
              </div>

              {/* Lista de Parcelas */}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                {parcelas.map((parcela) => (
                  <div
                    key={parcela.numero}
                    className={`flex items-center justify-between gap-4 py-2.5 px-3 rounded-lg transition-colors ${
                      parcela.semJuros
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-zinc-950 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-semibold min-w-[32px] ${
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

              {/* Nota de Rodapé */}
              <p className="text-xs text-zinc-600 mt-3 pt-3 border-t border-zinc-800">
                💳 Valores calculados com base nas taxas de parcelamento no cartão de crédito.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
