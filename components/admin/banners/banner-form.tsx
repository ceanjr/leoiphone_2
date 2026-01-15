'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ImageUpload } from '@/components/admin/image-upload'
import { ProductSelector } from './product-selector'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

interface BannerFormData {
  titulo: string
  subtitulo: string
  imagem_url: string
  ativo: boolean
  tipo: 'banner' | 'produtos_destaque'
  produtos_destaque: Array<{ produto_id: string; preco_promocional: number }>
  countdown_ends_at: string | null
  _selectedProdutos?: Array<{
    id: string
    nome: string
    codigo_produto: string
    preco: number
    foto_principal: string
    preco_promocional: number
  }>
}

interface BannerFormProps {
  initialData?: BannerFormData
  onSubmit: (data: BannerFormData) => Promise<{ success: boolean; error?: string }>
  submitLabel: string
}

export function BannerForm({ initialData, onSubmit, submitLabel }: BannerFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [formData, setFormData] = useState<BannerFormData>(
    initialData || {
      titulo: '',
      subtitulo: '',
      imagem_url: '',
      ativo: false,
      tipo: 'banner',
      produtos_destaque: [],
      countdown_ends_at: null,
    }
  )

  const [selectedProdutos, setSelectedProdutos] = useState<
    Array<{
      id: string
      nome: string
      codigo_produto: string
      preco: number
      foto_principal: string
      preco_promocional: number
    }>
  >(initialData?._selectedProdutos || [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const dataToSave: BannerFormData = {
      ...formData,
      produtos_destaque: selectedProdutos.map((p) => ({
        produto_id: p.id,
        preco_promocional: p.preco_promocional,
      })),
    }

    try {
      const result = await onSubmit(dataToSave)
      if (result.success) {
        toast.success(
          submitLabel === 'Criar' ? 'Banner criado com sucesso!' : 'Banner atualizado com sucesso!'
        )
        router.push('/admin/banners')
      } else {
        toast.error(result.error || 'Erro ao salvar banner')
      }
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setShowCancelDialog(true)
  }

  function confirmCancel() {
    router.push('/admin/banners')
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Informações Básicas</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">
                Título <span className="text-yellow-500">*</span>
              </Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="border-zinc-800 bg-zinc-900 text-white"
                placeholder="Ex: Promoção de Verão"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitulo">Subtítulo</Label>
              <Input
                id="subtitulo"
                value={formData.subtitulo}
                onChange={(e) => setFormData({ ...formData, subtitulo: e.target.value })}
                className="border-zinc-800 bg-zinc-900 text-white"
                placeholder="Ex: Até 30% de desconto"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Tipo de Banner */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Tipo de Banner <span className="text-yellow-500">*</span>
          </h3>
          <RadioGroup
            value={formData.tipo}
            onValueChange={(value) => {
              setFormData({
                ...formData,
                tipo: value as 'banner' | 'produtos_destaque',
                imagem_url: value === 'produtos_destaque' ? '' : formData.imagem_url,
              })
            }}
            className="space-y-3"
            disabled={saving}
          >
            <label
              htmlFor="tipo-banner"
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 p-3 transition hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <RadioGroupItem value="banner" id="tipo-banner" className="mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-white">Banner (Imagem)</div>
                <p className="text-xs text-zinc-500">Exibe uma imagem no carrossel</p>
              </div>
            </label>
            <label
              htmlFor="tipo-produtos"
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 p-3 transition hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <RadioGroupItem value="produtos_destaque" id="tipo-produtos" className="mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-white">Produtos em Destaque</div>
                <p className="text-xs text-zinc-500">
                  Mostra até 4 produtos com preços promocionais
                </p>
              </div>
            </label>
          </RadioGroup>

          <div className="mt-4 flex items-center gap-2">
            <Checkbox
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: !!checked })}
              disabled={saving}
            />
            <Label htmlFor="ativo" className="cursor-pointer text-sm text-zinc-200">
              Banner ativo
            </Label>
          </div>
        </div>

        {/* Conteúdo Específico */}
        {formData.tipo === 'banner' ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Imagem <span className="text-yellow-500">*</span>
            </h3>
            <p className="mb-4 text-sm text-zinc-400">
              Recomendamos imagens no formato 1920x600 (landscape)
            </p>
            <ImageUpload
              images={formData.imagem_url ? [formData.imagem_url] : []}
              onChange={(images) => setFormData({ ...formData, imagem_url: images[0] || '' })}
              maxImages={1}
              disabled={saving}
            />
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Produtos em Destaque</h3>
              <p className="mb-4 text-sm text-zinc-400">
                Selecione até 4 produtos e defina preços promocionais
              </p>
              <ProductSelector
                selectedProdutos={selectedProdutos}
                onUpdateProdutos={setSelectedProdutos}
                disabled={saving}
              />
            </div>

            {/* Countdown */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Prazo da Promoção (opcional)
              </h3>
              <p className="mb-4 text-sm text-zinc-400">
                Defina quando a promoção termina para exibir contagem regressiva
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="countdown_days" className="text-xs text-zinc-400">
                    Dias a partir de agora
                  </Label>
                  <Input
                    id="countdown_days"
                    type="number"
                    min="0"
                    max="365"
                    placeholder="Ex: 7"
                    value={
                      formData.countdown_ends_at
                        ? Math.floor(
                            (new Date(formData.countdown_ends_at).getTime() - Date.now()) /
                              (1000 * 60 * 60 * 24)
                          ).toString()
                        : ''
                    }
                    onChange={(e) => {
                      const days = parseInt(e.target.value) || 0
                      const now = new Date()
                      const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

                      if (formData.countdown_ends_at) {
                        const currentDate = new Date(formData.countdown_ends_at)
                        endDate.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0)
                      } else {
                        endDate.setHours(23, 59, 0, 0)
                      }

                      setFormData({
                        ...formData,
                        countdown_ends_at: e.target.value ? endDate.toISOString() : null,
                      })
                    }}
                    className="border-zinc-800 bg-zinc-900 text-white"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countdown_time" className="text-xs text-zinc-400">
                    Hora do dia
                  </Label>
                  <Input
                    id="countdown_time"
                    type="time"
                    value={
                      formData.countdown_ends_at
                        ? new Date(formData.countdown_ends_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })
                        : ''
                    }
                    onChange={(e) => {
                      const timeValue = e.target.value
                      if (!timeValue) return

                      const [hours, minutes] = timeValue.split(':').map(Number)
                      let endDate = formData.countdown_ends_at
                        ? new Date(formData.countdown_ends_at)
                        : new Date(Date.now() + 24 * 60 * 60 * 1000)

                      endDate.setHours(hours, minutes, 0, 0)
                      setFormData({ ...formData, countdown_ends_at: endDate.toISOString() })
                    }}
                    className="border-zinc-800 bg-zinc-900 text-white"
                    disabled={saving}
                  />
                </div>
              </div>

              {formData.countdown_ends_at && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                  <div className="text-xs">
                    <span className="text-zinc-500">Termina em: </span>
                    <span className="font-medium text-white">
                      {new Date(formData.countdown_ends_at).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, countdown_ends_at: null })}
                    className="text-xs text-red-500 hover:text-red-400"
                    disabled={saving}
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-900"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              saving ||
              !formData.titulo.trim() ||
              (formData.tipo === 'banner' && !formData.imagem_url)
            }
            className="flex-1"
            style={{
              backgroundColor: 'var(--brand-yellow)',
              color: 'var(--brand-black)',
            }}
          >
            {saving ? 'Salvando...' : submitLabel}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Cancelar edição"
        description="Tem certeza que deseja cancelar? Todas as alterações não salvas serão perdidas."
        confirmText="Sim, cancelar"
        cancelText="Continuar editando"
        onConfirm={confirmCancel}
        variant="destructive"
      />
    </>
  )
}
