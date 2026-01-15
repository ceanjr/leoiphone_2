'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/admin/header'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Link2 } from 'lucide-react'
import {
  getConfigGlobalProdutosRelacionados,
  updateConfigGlobalProdutosRelacionados
} from '@/app/admin/categorias/produtos-relacionados-actions'

export default function ProdutosRelacionadosPage() {
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<{
    desconto_min: number
    desconto_max: number
  }>({ desconto_min: 3, desconto_max: 7 })

  useEffect(() => {
    async function loadConfig() {
      try {
        const { data } = await getConfigGlobalProdutosRelacionados()

        if (data) {
          setEnabled(data.ativo)
          setConfig({
            desconto_min: data.desconto_min,
            desconto_max: data.desconto_max
          })
        }
      } catch {
        setEnabled(true)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  async function handleToggle(value: boolean) {
    setSaving(true)
    try {
      const { success, error } = await updateConfigGlobalProdutosRelacionados(
        value,
        config.desconto_min,
        config.desconto_max
      )

      if (!success) throw new Error(error || 'Erro ao salvar')

      setEnabled(value)
      toast.success(value ? 'Produtos relacionados ativados' : 'Produtos relacionados desativados')
    } catch {
      toast.error('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Header
        title="Produtos Relacionados"
        description="Configure a exibição de produtos relacionados no catálogo"
      />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-lg">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                <Link2 className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Exibição no Catálogo</h2>
                <p className="text-sm text-zinc-400">
                  Ative ou desative os produtos relacionados
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <Label htmlFor="produtos-relacionados" className="cursor-pointer">
                  <span className="text-white">Produtos relacionados</span>
                  <span className="block text-sm text-zinc-400">
                    {enabled ? 'Visível no catálogo' : 'Oculto no catálogo'}
                  </span>
                </Label>
                <Switch
                  id="produtos-relacionados"
                  checked={enabled}
                  onCheckedChange={handleToggle}
                  disabled={saving}
                />
              </div>
            )}

            <p className="mt-4 text-xs text-zinc-500">
              Quando ativado, produtos relacionados serão exibidos nas páginas de produto
              com base nas categorias configuradas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
