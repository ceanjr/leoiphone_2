'use client'

import { useState, useEffect } from 'react'
import { Save, ExternalLink, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { salvarConfig } from '@/app/admin/anuncios/actions'
import { toast } from 'sonner'
import type { FacebookConfig } from '@/types/facebook'
import { Card } from '@/components/ui/card'

interface ConfiguracaoDialogProps {
  open: boolean
  onClose: () => void
  config: FacebookConfig | null
  onSave: () => void
}

export function ConfiguracaoDialog({ open, onClose, config, onSave }: ConfiguracaoDialogProps) {
  const [formData, setFormData] = useState({
    app_id: '',
    app_secret: '',
    access_token: '',
    catalog_id: '',
    page_id: '',
    business_id: '',
    sync_enabled: false,
    auto_sync: false,
    sync_interval_minutes: 60,
  })

  const [salvando, setSalvando] = useState(false)

  // Calcular dias restantes do token
  const diasRestantes = config?.token_expires_at
    ? Math.max(
        0,
        Math.ceil((new Date(config.token_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : null

  useEffect(() => {
    if (config) {
      setFormData({
        app_id: config.app_id || '',
        app_secret: config.app_secret || '',
        access_token: config.access_token || '',
        catalog_id: config.catalog_id || '',
        page_id: config.page_id || '',
        business_id: config.business_id || '',
        sync_enabled: config.sync_enabled || false,
        auto_sync: config.auto_sync || false,
        sync_interval_minutes: config.sync_interval_minutes || 60,
      })
    }
  }, [config])

  function handleChange(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSalvar() {
    // Validar campos obrigatórios
    if (!formData.app_id || !formData.app_secret || !formData.access_token || !formData.catalog_id) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setSalvando(true)

    // Calcular data de expiração (60 dias a partir de hoje)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)

    const result = await salvarConfig({
      ...formData,
      token_expires_at: expiresAt.toISOString(),
    })

    setSalvando(false)

    if (result.success) {
      toast.success(result.message)
      onSave()
    } else {
      toast.error(result.error || 'Erro ao salvar configuração')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[95vh] w-[95vw] flex-col gap-0 p-0 sm:max-h-[90vh] sm:max-w-2xl sm:gap-6 sm:p-6">
        <DialogHeader className="border-b border-zinc-800 px-4 pb-3 pt-4 sm:border-none sm:p-0 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg">Configurações Facebook</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Configure a integração com Facebook Marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-0 sm:pb-0">
          <div className="space-y-3 sm:space-y-4">
          {/* Instruções */}
          <Card className="border-blue-500/30 bg-blue-500/5 p-3 sm:p-4">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold sm:text-sm">
              <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Como obter as credenciais?
            </h4>
            <ol className="list-inside list-decimal space-y-1 text-[11px] text-muted-foreground sm:text-xs">
              <li>Acesse <a href="https://developers.facebook.com" target="_blank" className="text-blue-500 underline">Facebook Developers</a></li>
              <li>Crie um App e adicione o produto "Commerce"</li>
              <li>Em Business Manager, crie um Catálogo de Produtos</li>
              <li>Copie o App ID, App Secret, Access Token e Catalog ID</li>
            </ol>
          </Card>

          {/* Formulário */}
          <div className="space-y-3 sm:space-y-4">
            {/* App ID */}
            <div className="space-y-2">
              <Label htmlFor="app_id">
                App ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="app_id"
                value={formData.app_id}
                onChange={(e) => handleChange('app_id', e.target.value)}
                placeholder="123456789012345"
              />
            </div>

            {/* App Secret */}
            <div className="space-y-2">
              <Label htmlFor="app_secret">
                App Secret <span className="text-red-500">*</span>
              </Label>
              <Input
                id="app_secret"
                type="password"
                value={formData.app_secret}
                onChange={(e) => handleChange('app_secret', e.target.value)}
                placeholder="a1b2c3d4e5f6..."
              />
            </div>

            {/* Access Token */}
            <div className="space-y-2">
              <Label htmlFor="access_token">
                Access Token (Long-lived) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="access_token"
                type="password"
                value={formData.access_token}
                onChange={(e) => handleChange('access_token', e.target.value)}
                placeholder="EAABwz..."
              />
              <p className="text-xs text-muted-foreground">
                Use um token de longa duração (60 dias)
              </p>

              {/* Contador de dias restantes */}
              {diasRestantes !== null && (
                <Card
                  className={`border-2 p-3 ${
                    diasRestantes <= 7
                      ? 'border-red-500/30 bg-red-500/5'
                      : diasRestantes <= 14
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-blue-500/30 bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full p-1.5 ${
                      diasRestantes <= 7
                        ? 'bg-red-500/20'
                        : diasRestantes <= 14
                        ? 'bg-yellow-500/20'
                        : 'bg-blue-500/20'
                    }`}>
                      <Clock
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                          diasRestantes <= 7
                            ? 'text-red-500'
                            : diasRestantes <= 14
                            ? 'text-yellow-500'
                            : 'text-blue-500'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-xs font-semibold sm:text-sm ${
                          diasRestantes <= 7
                            ? 'text-red-500'
                            : diasRestantes <= 14
                            ? 'text-yellow-500'
                            : 'text-blue-500'
                        }`}
                      >
                        {diasRestantes === 0
                          ? '🚨 Token expirou!'
                          : diasRestantes === 1
                          ? '⚠️ Expira amanhã!'
                          : `Expira em ${diasRestantes} dias`}
                      </p>
                      <p className="text-[11px] text-muted-foreground sm:text-xs">
                        {config?.token_expires_at &&
                          `Vencimento: ${new Date(config.token_expires_at).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                  </div>
                  {diasRestantes <= 14 && (
                    <p className="mt-2 text-[11px] text-muted-foreground sm:text-xs">
                      {diasRestantes <= 7
                        ? '⚠️ Urgente: Renove o token imediatamente!'
                        : '⚠️ Atenção: Renove o token em breve.'}
                    </p>
                  )}
                </Card>
              )}
            </div>

            {/* Catalog ID */}
            <div className="space-y-2">
              <Label htmlFor="catalog_id">
                Catalog ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="catalog_id"
                value={formData.catalog_id}
                onChange={(e) => handleChange('catalog_id', e.target.value)}
                placeholder="123456789012345"
              />
            </div>

            {/* Page ID (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="page_id">Page ID (opcional)</Label>
              <Input
                id="page_id"
                value={formData.page_id}
                onChange={(e) => handleChange('page_id', e.target.value)}
                placeholder="123456789012345"
              />
            </div>

            {/* Business ID (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="business_id">Business ID (opcional)</Label>
              <Input
                id="business_id"
                value={formData.business_id}
                onChange={(e) => handleChange('business_id', e.target.value)}
                placeholder="123456789012345"
              />
            </div>

            {/* Configurações de sincronização */}
            <div className="space-y-3 border-t border-zinc-800 pt-3 sm:space-y-4 sm:pt-4">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor="sync_enabled" className="text-xs font-semibold sm:text-sm">
                    Ativar Integração
                  </Label>
                  <p className="text-[11px] text-muted-foreground sm:text-xs">
                    Habilita a criação de anúncios no Facebook
                  </p>
                </div>
                <Switch
                  id="sync_enabled"
                  checked={formData.sync_enabled}
                  onCheckedChange={(checked) => handleChange('sync_enabled', checked)}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor="auto_sync" className="text-xs font-semibold sm:text-sm">
                    Sincronização Automática
                  </Label>
                  <p className="text-[11px] text-muted-foreground sm:text-xs">
                    Sincroniza produtos automaticamente
                  </p>
                </div>
                <Switch
                  id="auto_sync"
                  checked={formData.auto_sync}
                  onCheckedChange={(checked) => handleChange('auto_sync', checked)}
                  disabled={!formData.sync_enabled}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              {formData.auto_sync && (
                <div className="space-y-2">
                  <Label htmlFor="sync_interval" className="text-xs sm:text-sm">
                    Intervalo de Sincronização (minutos)
                  </Label>
                  <Input
                    id="sync_interval"
                    type="number"
                    min={5}
                    max={1440}
                    value={formData.sync_interval_minutes}
                    onChange={(e) => handleChange('sync_interval_minutes', parseInt(e.target.value))}
                    className="h-10"
                  />
                  <p className="text-[11px] text-muted-foreground sm:text-xs">
                    Recomendado: 60 minutos (1 hora)
                  </p>
                </div>
              )}
            </div>
          </div>

            {/* Ações */}
            <div className="flex flex-col gap-2 border-t border-zinc-800 bg-zinc-950/50 px-4 py-3 sm:flex-row sm:border-none sm:bg-transparent sm:px-0 sm:py-0">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={salvando}
                className="h-10 w-full sm:flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={handleSalvar} disabled={salvando} className="h-10 w-full bg-blue-600 hover:bg-blue-700 sm:flex-1">
                <Save className="mr-2 h-4 w-4" />
                {salvando ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
