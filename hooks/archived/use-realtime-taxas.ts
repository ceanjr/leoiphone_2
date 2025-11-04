'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createLogger } from '@/lib/utils/logger'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { TaxasConfig } from '@/lib/validations/taxas'

const logger = createLogger('useRealtimeTaxas')

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
      logger.log('Realtime desabilitado')
      return
    }

    logger.log('Iniciando subscrição de taxas...')
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
          logger.log('Evento recebido:', payload.eventType)
          logger.log('Payload:', payload)

          // Buscar configuração mais recente
          const { data, error } = await supabase
            .from('configuracoes_taxas')
            .select('ativo, taxas')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (error) {
            logger.error('Erro ao buscar taxas:', error)
            return
          }

          if (data) {
            const typedData = data as any
            logger.log('Taxas atualizadas:', {
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
        logger.log('Status da subscrição:', status)
      })

    setChannel(taxasChannel)

    // Cleanup
    return () => {
      logger.log('Removendo subscrição de taxas')
      supabase.removeChannel(taxasChannel)
    }
  }, [enabled, onUpdate])

  return { channel }
}
