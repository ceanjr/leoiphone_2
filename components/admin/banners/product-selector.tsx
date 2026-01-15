'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Produto {
  id: string
  nome: string
  codigo_produto: string
  preco: number
  foto_principal: string
  categoria_id?: string
}

interface ProdutoSelecionado extends Produto {
  preco_promocional: number
}

interface Categoria {
  id: string
  nome: string
}

interface ProductSelectorProps {
  selectedProdutos: ProdutoSelecionado[]
  onUpdateProdutos: (produtos: ProdutoSelecionado[]) => void
  disabled?: boolean
}

export function ProductSelector({
  selectedProdutos,
  onUpdateProdutos,
  disabled = false,
}: ProductSelectorProps) {
  const [availableProdutos, setAvailableProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [selectedCategoria, setSelectedCategoria] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCategorias()
  }, [])

  async function loadCategorias() {
    const supabase = createClient()
    const { data } = await supabase
      .from('categorias')
      .select('id, nome')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    setCategorias(data || [])
  }

  async function loadProdutos(categoriaId: string) {
    if (!categoriaId) {
      setAvailableProdutos([])
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('produtos')
      .select('id, nome, codigo_produto, preco, foto_principal, categoria_id')
      .eq('categoria_id', categoriaId)
      .eq('ativo', true)
      .is('deleted_at', null)
      .order('nome', { ascending: true })

    setAvailableProdutos(data || [])
    setLoading(false)
  }

  function handleAddProduto(produto: Produto) {
    if (selectedProdutos.length >= 4) {
      toast.error('Máximo de 4 produtos permitidos')
      return
    }

    if (selectedProdutos.find((p) => p.id === produto.id)) {
      toast.error('Produto já adicionado')
      return
    }

    onUpdateProdutos([...selectedProdutos, { ...produto, preco_promocional: produto.preco }])
  }

  function handleRemoveProduto(produtoId: string) {
    onUpdateProdutos(selectedProdutos.filter((p) => p.id !== produtoId))
  }

  function handleUpdatePrecoPromocional(produtoId: string, preco: number) {
    onUpdateProdutos(
      selectedProdutos.map((p) => (p.id === produtoId ? { ...p, preco_promocional: preco } : p))
    )
  }

  function handleCategoriaChange(categoriaId: string) {
    setSelectedCategoria(categoriaId)
    void loadProdutos(categoriaId)
  }

  return (
    <div className="space-y-6">
      {/* Filtro de Categoria */}
      <div className="relative">
        <Filter className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <select
          value={selectedCategoria}
          onChange={(e) => handleCategoriaChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pr-10 pl-10 text-sm text-white transition-colors focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        >
          <option value="">Selecione uma categoria</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
          <svg
            className="h-5 w-5 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Produtos em Destaque Selecionados */}
      {selectedProdutos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-400">
            Produtos Selecionados ({selectedProdutos.length}/4)
          </h3>
          {selectedProdutos.map((produto) => (
            <div
              key={produto.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/90 p-3"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded bg-zinc-900">
                {produto.foto_principal ? (
                  <Image
                    src={produto.foto_principal}
                    alt={produto.nome}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                    Sem foto
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <div className="truncate text-sm font-medium text-white">{produto.nome}</div>
                  <div className="truncate text-xs text-zinc-500">{produto.codigo_produto}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`preco-${produto.id}`}
                    className="text-xs whitespace-nowrap text-zinc-400"
                  >
                    Preço promocional:
                  </Label>
                  <Input
                    id={`preco-${produto.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={produto.preco_promocional}
                    onChange={(event) =>
                      handleUpdatePrecoPromocional(produto.id, parseFloat(event.target.value) || 0)
                    }
                    className="h-8 w-20 border-zinc-800 bg-zinc-900 text-right text-sm text-white sm:w-28"
                    disabled={disabled}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveProduto(produto.id)}
                className="h-8 w-8 text-zinc-400 hover:text-red-400"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Lista de Produtos Disponíveis */}
      {selectedCategoria && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-400">
            Produtos em Destaque
            {availableProdutos.length > 0 && ` (${availableProdutos.length})`}
          </h3>

          {loading ? (
            <div className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/50 p-8">
              <p className="text-sm text-zinc-500">Carregando produtos...</p>
            </div>
          ) : availableProdutos.length > 0 ? (
            <div
              className="max-h-[400px] space-y-2 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgb(63 63 70) transparent',
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 8px;
                }
                div::-webkit-scrollbar-track {
                  background: transparent;
                }
                div::-webkit-scrollbar-thumb {
                  background-color: rgb(63 63 70);
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background-color: rgb(82 82 91);
                }
              `}</style>
              {availableProdutos.map((produto) => {
                const isSelected = selectedProdutos.some((p) => p.id === produto.id)
                const isDisabled = disabled || (selectedProdutos.length >= 4 && !isSelected)

                return (
                  <button
                    key={produto.id}
                    type="button"
                    onClick={() => handleAddProduto(produto)}
                    disabled={isSelected || isDisabled}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? 'cursor-default border-green-500/30 bg-green-500/10'
                        : isDisabled
                          ? 'cursor-not-allowed border-zinc-800 bg-zinc-900/50 opacity-50'
                          : 'border-zinc-800 bg-zinc-900/50 hover:border-yellow-500/50 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded bg-zinc-950">
                      {produto.foto_principal ? (
                        <Image
                          src={produto.foto_principal}
                          alt={produto.nome}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-zinc-500">
                          Sem foto
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{produto.nome}</div>
                      <div className="text-xs text-zinc-500">{produto.codigo_produto}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-sm text-zinc-400">R$ {produto.preco.toFixed(2)}</div>
                      {isSelected && <span className="text-xs text-green-400">✓ Selecionado</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-8 text-center">
              <p className="text-sm text-zinc-500">Nenhum produto encontrado nesta categoria.</p>
            </div>
          )}
        </div>
      )}

      {!selectedCategoria && selectedProdutos.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-8 text-center">
          <p className="text-sm text-zinc-500">
            Selecione uma categoria para ver os produtos disponíveis (máximo 4).
          </p>
        </div>
      )}
    </div>
  )
}
