'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import type { ProdutoCustoFormData } from '@/types/produto'

interface CustosManagerProps {
  custos: { custo: number; estoque: number; codigo: string | null }[]
  onChange: (custos: { custo: number; estoque: number; codigo: string | null }[]) => void
  disabled?: boolean
}

export function CustosManager({ custos, onChange, disabled = false }: CustosManagerProps) {
  const [expandido, setExpandido] = useState(custos.length > 0)

  const adicionarCusto = () => {
    onChange([
      ...custos,
      {
        custo: 0,
        estoque: 1,
        codigo: null,
      },
    ])
    setExpandido(true)
  }

  const removerCusto = (index: number) => {
    const novosCustos = custos.filter((_, i) => i !== index)
    onChange(novosCustos)
  }

  const atualizarCusto = (index: number, campo: 'custo' | 'estoque' | 'codigo', valor: any) => {
    const novosCustos = [...custos]
    novosCustos[index] = {
      ...novosCustos[index],
      [campo]: valor,
    }
    onChange(novosCustos)
  }

  return (
    <section className="rounded-xl border border-zinc-800/70 bg-zinc-950/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-6">
      <header className="mb-6 flex flex-col gap-1">
        <span className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
          Gestão de Custos
        </span>
        <h3 className="text-lg font-semibold text-white">Custos e Estoque</h3>
        <p className="text-sm text-zinc-400">
          Adicione um ou mais custos com seus respectivos estoques. Útil quando há diferentes
          fornecedores ou lotes.
        </p>
      </header>

      <div className="space-y-4">
        {custos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50 p-6 text-center">
            <p className="mb-4 text-sm text-zinc-400">Nenhum custo adicionado ainda</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={adicionarCusto}
              disabled={disabled}
              className="border-zinc-700 text-zinc-200 hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Custo
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {custos.map((custo, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-800/70 bg-zinc-950/80 p-4 transition hover:border-zinc-700"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-400">
                      Variação {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removerCusto(index)}
                      disabled={disabled}
                      className="h-8 w-8 p-0 text-red-400 hover:bg-red-950/50 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`custo-${index}`} className="text-zinc-200">
                        Custo (R$)
                      </Label>
                      <Input
                        id={`custo-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={custo.custo || ''}
                        onChange={(e) =>
                          atualizarCusto(
                            index,
                            'custo',
                            e.target.value ? parseFloat(e.target.value) : 0
                          )
                        }
                        disabled={disabled}
                        className="border-zinc-800/70 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`estoque-${index}`} className="text-zinc-200">
                        Estoque (un.)
                      </Label>
                      <Input
                        id={`estoque-${index}`}
                        type="number"
                        min="1"
                        value={custo.estoque || ''}
                        onChange={(e) =>
                          atualizarCusto(
                            index,
                            'estoque',
                            e.target.value ? parseInt(e.target.value, 10) : 1
                          )
                        }
                        disabled={disabled}
                        className="border-zinc-800/70 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                        placeholder="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`codigo-${index}`} className="text-zinc-200">
                        Código (opcional)
                      </Label>
                      <Input
                        id={`codigo-${index}`}
                        type="text"
                        value={custo.codigo || ''}
                        onChange={(e) => atualizarCusto(index, 'codigo', e.target.value || null)}
                        disabled={disabled}
                        className="border-zinc-800/70 bg-zinc-950 text-white focus-visible:ring-yellow-500/70"
                        placeholder="Ex: 9951"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={adicionarCusto}
              disabled={disabled}
              className="w-full border-zinc-700 text-zinc-200 hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Outro Custo
            </Button>

            {/* Resumo */}
            {custos.length > 0 && (
              <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-400">Total em Estoque:</span>
                    <p className="font-semibold text-white">
                      {custos.reduce((sum, c) => sum + (c.estoque || 0), 0)} unidades
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Custo Médio:</span>
                    <p className="font-semibold text-white">
                      R${' '}
                      {custos.length > 0
                        ? (
                            custos.reduce((sum, c) => sum + (c.custo || 0) * (c.estoque || 0), 0) /
                            custos.reduce((sum, c) => sum + (c.estoque || 0), 0)
                          ).toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
