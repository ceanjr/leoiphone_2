'use client'

import { memo } from 'react'
import { Search, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BatteryIcon } from '@/components/shared/battery-icon'
import type { Produto } from '@/types/produto'
import Image from 'next/image'

interface ProdutosRelacionadosFormProps {
  autoSelect: boolean
  onAutoSelectChange: (value: boolean) => void
  descontoMin: number
  onDescontoMinChange: (value: number) => void
  descontoMax: number
  onDescontoMaxChange: (value: number) => void
  produtosSelecionados: string[]
  onProdutosSelecionadosChange: (produtos: string[]) => void
  produtos: Produto[]
  searchTerm: string
  onSearchTermChange: (term: string) => void
  filteredProdutos: Produto[]
  showBatteryIcon?: boolean
  compact?: boolean
}

function ProdutosRelacionadosFormComponent({
  autoSelect,
  onAutoSelectChange,
  descontoMin,
  onDescontoMinChange,
  descontoMax,
  onDescontoMaxChange,
  produtosSelecionados,
  onProdutosSelecionadosChange,
  produtos,
  searchTerm,
  onSearchTermChange,
  filteredProdutos,
  showBatteryIcon = false,
  compact = false,
}: ProdutosRelacionadosFormProps) {
  function handleToggleProduto(produtoId: string) {
    const novos = produtosSelecionados.includes(produtoId)
      ? produtosSelecionados.filter((id) => id !== produtoId)
      : [...produtosSelecionados, produtoId]
    onProdutosSelecionadosChange(novos)
  }

  return (
    <div className="space-y-4">
      {/* Faixa de Desconto */}
      <div>
        <Label className={compact ? 'text-xs' : 'text-sm font-medium'}>
          Faixa de Desconto Aleatório (%)
        </Label>
        <div className={`mt-2 grid grid-cols-2 gap-3`}>
          <div>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={descontoMin}
              onChange={(e) => onDescontoMinChange(parseFloat(e.target.value) || 0)}
              className={`border-zinc-800 bg-zinc-950 text-white ${compact ? 'h-8 text-xs' : ''}`}
              placeholder="Mínimo"
            />
            <p className={`mt-1 text-zinc-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>Mínimo</p>
          </div>
          <div>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={descontoMax}
              onChange={(e) => onDescontoMaxChange(parseFloat(e.target.value) || 0)}
              className={`border-zinc-800 bg-zinc-950 text-white ${compact ? 'h-8 text-xs' : ''}`}
              placeholder="Máximo"
            />
            <p className={`mt-1 text-zinc-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>Máximo</p>
          </div>
        </div>
        <p className={`mt-2 text-zinc-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          Cada produto receberá um desconto aleatório entre os valores mínimo e máximo
        </p>
      </div>

      {/* Seleção Automática */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex-1">
          <Label htmlFor="auto-select" className={compact ? 'text-xs font-semibold' : 'font-medium'}>
            Seleção Automática
          </Label>
          <p className={`mt-1 text-zinc-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            Produtos serão selecionados automaticamente de forma inteligente
          </p>
        </div>
        <Switch
          id="auto-select"
          checked={autoSelect}
          onCheckedChange={onAutoSelectChange}
          className={compact ? 'data-[state=checked]:bg-green-600' : ''}
        />
      </div>

      {/* Seleção Manual de Produtos */}
      {!autoSelect && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className={compact ? 'text-xs font-semibold' : 'text-sm font-medium'}>
              Produtos Selecionados ({produtosSelecionados.length})
            </Label>
            {produtosSelecionados.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onProdutosSelecionadosChange([])}
                className={`text-zinc-400 hover:text-white ${compact ? 'h-6 text-[10px]' : 'h-8 text-xs'}`}
              >
                Limpar seleção
              </Button>
            )}
          </div>

          <div className="relative">
            <Search className={`absolute left-3 top-3 text-zinc-500 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className={`border-zinc-800 bg-zinc-950 pl-10 text-white ${compact ? 'h-8 text-xs' : ''}`}
            />
          </div>

          <ScrollArea className={compact ? 'h-[200px]' : 'max-h-[300px]'}>
            <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              {filteredProdutos.length === 0 ? (
                <p className={`py-8 text-center text-zinc-500 ${compact ? 'text-[10px]' : 'text-sm'}`}>
                  Nenhum produto encontrado
                </p>
              ) : compact ? (
                // Layout compacto com checkboxes
                filteredProdutos.map((produto) => {
                  const isSelected = produtosSelecionados.includes(produto.id)
                  return (
                    <div
                      key={produto.id}
                      className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900/50 p-1.5 hover:bg-zinc-800/50"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleProduto(produto.id)}
                      />
                      {produto.foto_principal && (
                        <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded">
                          <Image
                            src={produto.foto_principal}
                            alt={produto.nome}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <p className="flex-1 truncate text-[10px] font-medium text-white">{produto.nome}</p>
                      {showBatteryIcon && produto.nivel_bateria && (
                        <Badge className="flex items-center gap-1 bg-zinc-800 px-1 py-0.5 text-[9px]">
                          <BatteryIcon level={produto.nivel_bateria} />
                          {produto.nivel_bateria}%
                        </Badge>
                      )}
                    </div>
                  )
                })
              ) : (
                // Layout normal com botões
                filteredProdutos.map((produto) => {
                  const isSelected = produtosSelecionados.includes(produto.id)
                  return (
                    <button
                      key={produto.id}
                      type="button"
                      onClick={() => handleToggleProduto(produto.id)}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-[var(--brand-yellow)] bg-[var(--brand-yellow)]/10'
                          : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                          isSelected
                            ? 'border-[var(--brand-yellow)] bg-[var(--brand-yellow)]'
                            : 'border-zinc-600 bg-zinc-800'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-black" strokeWidth={3} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{produto.nome}</span>
                          {produto.codigo_produto && (
                            <Badge variant="outline" className="border-zinc-700 text-xs text-zinc-400">
                              {produto.codigo_produto}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-zinc-400">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(produto.preco)}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

export const ProdutosRelacionadosForm = memo(ProdutosRelacionadosFormComponent)
