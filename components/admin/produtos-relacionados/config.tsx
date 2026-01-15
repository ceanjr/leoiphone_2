'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Info, Eye, EyeOff } from 'lucide-react'

const CONFIG_KEY = 'produtos_relacionados_enabled'

export function ProdutosRelacionadosConfig() {
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    try {
      const stored = localStorage.getItem(CONFIG_KEY)
      if (stored !== null) {
        setEnabled(stored === 'true')
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(checked: boolean) {
    setSaving(true)
    try {
      localStorage.setItem(CONFIG_KEY, checked.toString())
      setEnabled(checked)
      toast.success(
        checked ? 'Produtos relacionados ativados' : 'Produtos relacionados desativados'
      )
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      toast.error('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-zinc-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Card de Configuração com Botão Toggle Destacado */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Exibir Produtos Relacionados</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Quando ativo, os usuários verão produtos relacionados ao final das páginas de
              produtos.
            </p>
          </div>

          {/* Botão Toggle Destacado */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900 p-1">
              <button
                onClick={() => handleToggle(true)}
                disabled={saving}
                className={`flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  enabled
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                <Eye className="h-5 w-5" />
                Exibir
              </button>
              <button
                onClick={() => handleToggle(false)}
                disabled={saving}
                className={`flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  !enabled
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                <EyeOff className="h-5 w-5" />
                Ocultar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Informações sobre a Funcionalidade */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-6">
        <div className="flex gap-3">
          <Info className="h-5 w-5 shrink-0 text-blue-400" />
          <div className="space-y-2 text-sm text-zinc-300">
            <p className="font-medium text-white">Como funciona:</p>
            <ul className="list-inside list-disc space-y-1 text-zinc-400">
              <li>
                <strong className="text-zinc-300">Produtos de celulares</strong> (iPhone, Motorola,
                etc.): mostram acessórios relacionados
              </li>
              <li>
                <strong className="text-zinc-300">Produtos de acessórios</strong>: mostram produtos
                de qualquer categoria
              </li>
              <li>Exibe até 3 produtos relacionados</li>
              <li>A lógica é automática baseada nas categorias</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preview de Status */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">Status Atual</h3>
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-zinc-600'}`} />
          <span className="text-sm text-white">
            {enabled
              ? 'Os produtos relacionados estão sendo exibidos no site'
              : 'Os produtos relacionados estão ocultos no site'}
          </span>
        </div>
      </div>
    </div>
  )
}
