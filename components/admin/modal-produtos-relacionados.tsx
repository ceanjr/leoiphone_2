'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Settings, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import {
  getCategoriaProdutosRelacionados,
  updateCategoriaProdutosRelacionados,
  resetProdutosRelacionados,
} from '@/app/admin/categorias/produtos-relacionados-actions'
import { ProdutosRelacionadosForm } from './produtos-relacionados-form'
import type { Produto } from '@/types/produto'

interface ModalProdutosRelacionadosProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoriaId: string
  categoriaNome: string
}

export function ModalProdutosRelacionados({
  open,
  onOpenChange,
  categoriaId,
  categoriaNome,
}: ModalProdutosRelacionadosProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  const [autoSelect, setAutoSelect] = useState(true)
  const [descontoMin, setDescontoMin] = useState(3)
  const [descontoMax, setDescontoMax] = useState(7)
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([])

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, categoriaId])

  useEffect(() => {
    if (searchTerm) {
      const filtered = produtos.filter(
        (p) =>
          p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.codigo_produto?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProdutos(filtered)
    } else {
      setFilteredProdutos(produtos)
    }
  }, [searchTerm, produtos])

  async function loadData() {
    setLoading(true)

    try {
      const supabase = createClient()

      // Buscar configuração existente
      const { data: config } = await getCategoriaProdutosRelacionados(categoriaId)

      if (config) {
        setAutoSelect(config.auto_select)
        setDescontoMin(config.desconto_min)
        setDescontoMax(config.desconto_max)
        setProdutosSelecionados(config.produtos_selecionados)
      }

      // Buscar todos os produtos ativos
      const { data: produtosData } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .is('deleted_at', null)
        .order('nome')

      if (produtosData) {
        setProdutos(produtosData)
        setFilteredProdutos(produtosData)
      }
    } catch (error) {
      logger.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    // Validar que min <= max
    if (descontoMin > descontoMax) {
      toast.error('Desconto mínimo não pode ser maior que o máximo')
      return
    }

    setSaving(true)

    try {
      const { success, error } = await updateCategoriaProdutosRelacionados(
        categoriaId,
        autoSelect,
        produtosSelecionados,
        descontoMin,
        descontoMax
      )

      if (success) {
        toast.success('Configuração salva com sucesso!')
        onOpenChange(false)
      } else {
        toast.error(error || 'Erro ao salvar configuração')
      }
    } catch (error) {
      logger.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setResetting(true)

    try {
      const { success, error } = await resetProdutosRelacionados(categoriaId)

      if (success) {
        toast.success('Produtos relacionados resetados!')
        setAutoSelect(true)
        setProdutosSelecionados([])
        setDescontoMin(3)
        setDescontoMax(7)
      } else {
        toast.error(error || 'Erro ao resetar')
      }
    } catch (error) {
      logger.error('Erro ao resetar:', error)
      toast.error('Erro ao resetar produtos relacionados')
    } finally {
      setResetting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-zinc-800 bg-zinc-900 text-white sm:max-h-[80vh]">
        <DialogHeader className="px-4 sm:px-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-[var(--brand-yellow)]" />
                Configurar Produtos Relacionados
              </DialogTitle>
              <DialogDescription className="mt-2 text-zinc-400">
                Configure quais produtos serão sugeridos para {categoriaNome}
              </DialogDescription>
            </div>
            {/* Badge indicando modo */}
            <div
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                autoSelect
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'bg-purple-600/20 text-purple-400'
              }`}
            >
              {autoSelect ? '🤖 Automático' : '✋ Manual'}
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex h-64 items-center justify-center px-4">
            <div className="text-center">
              <div className="relative mx-auto h-8 w-8 animate-pulse">
                <div className="h-full w-full rounded-full border-4 border-zinc-700 opacity-40 brightness-150 grayscale" />
              </div>
              <p className="mt-4 text-sm text-zinc-400">Carregando...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-6 px-4 py-4 sm:px-0">
              <ProdutosRelacionadosForm
                autoSelect={autoSelect}
                onAutoSelectChange={setAutoSelect}
                descontoMin={descontoMin}
                onDescontoMinChange={setDescontoMin}
                descontoMax={descontoMax}
                onDescontoMaxChange={setDescontoMax}
                produtosSelecionados={produtosSelecionados}
                onProdutosSelecionadosChange={setProdutosSelecionados}
                produtos={produtos}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                filteredProdutos={filteredProdutos}
              />

              {/* Botão Reset */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-white">Resetar Configuração</h4>
                    <p className="mt-1 text-xs text-zinc-500">
                      Volta para seleção automática e remove produtos selecionados manualmente
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    disabled={resetting}
                    className="shrink-0 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
                  >
                    <RotateCcw className={`mr-2 h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
                    {resetting ? 'Resetando...' : 'Resetar'}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 px-4 sm:px-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-zinc-700 text-white hover:border-zinc-600 hover:bg-zinc-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: 'var(--brand-yellow)',
                  color: 'var(--brand-black)',
                }}
                className="hover:opacity-90"
              >
                {saving ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
