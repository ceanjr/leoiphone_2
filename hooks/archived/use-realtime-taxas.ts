'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { TaxasConfig } from '@/lib/validations/taxas'

interface ConfiguracaoTaxas {
  ativo: boolean
  taxas: TaxasConfig
}

interface UseRealtimeTaxasOptions {
  enabled?: boolean
  onUpdate?: (config: ConfiguracaoTaxas) => void
}

export function useRealtimeTaxas(options: UseRealtimeTaxasOptions = {}) {
  const { enabled = true, onUpdate } = options
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) {
      console.log('[useRealtimeTaxas] Realtime desabilitado')
      return
    }

    console.log('[useRealtimeTaxas] Iniciando subscrição de taxas...')
    const supabase = createClient()

    // Criar canal de realtime para configurações de taxas
    const taxasChannel = supabase
      .channel('taxas-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'configuracoes_taxas',
        },
        async (payload) => {
          console.log('[useRealtimeTaxas] Evento recebido:', payload.eventType)
          console.log('[useRealtimeTaxas] Payload:', payload)

          // Buscar configuração mais recente
          const { data, error } = await supabase
            .from('configuracoes_taxas')
            .select('ativo, taxas')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (error) {
            console.error('[useRealtimeTaxas] Erro ao buscar taxas:', error)
            return
          }

          if (data) {
            const typedData = data as any
            console.log('[useRealtimeTaxas] Taxas atualizadas:', {
              ativo: typedData.ativo,
              taxas: typedData.taxas,
            })

            if (onUpdate) {
              onUpdate({
                ativo: typedData.ativo,
                taxas: typedData.taxas as TaxasConfig,
              })
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeTaxas] Status da subscrição:', status)
      })

    setChannel(taxasChannel)

    // Cleanup
    return () => {
      console.log('[useRealtimeTaxas] Removendo subscrição de taxas')
      supabase.removeChannel(taxasChannel)
    }
  }, [enabled, onUpdate])

  return { channel }
}
