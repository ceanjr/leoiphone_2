'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createLogger } from '@/lib/utils/logger'
import type { TaxasConfig } from '@/lib/validations/taxas'

const logger = createLogger('usePollingTaxas')

interface ConfiguracaoTaxas {
  ativo: boolean
  taxas: TaxasConfig
}

interface UsePollingTaxasOptions {
  enabled?: boolean
  interval?: number // em milissegundos (padrão: 10000ms = 10s)
  onUpdate?: (config: ConfiguracaoTaxas) => void
}

/**
 * Hook para sincronização de taxas via polling (verificação periódica)
 *
 * Alternativa ao Realtime quando não está disponível.
 * Verifica mudanças a cada X milissegundos.
 *
 * @param options - Configurações do polling
 * @param options.enabled - Se o polling está ativo (padrão: true)
 * @param options.interval - Intervalo em ms (padrão: 10000ms)
 * @param options.onUpdate - Callback quando detectar mudança
 */
export function usePollingTaxas(options: UsePollingTaxasOptions = {}) {
  const { enabled = true, interval = 10000, onUpdate } = options
  const lastDataRef = useRef<string | null>(null)
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) {
      logger.log('Polling desabilitado')
      return
    }

    logger.log('Iniciando polling (intervalo:', interval, 'ms)')

    const supabase = createClient()

    const checkForUpdates = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracoes_taxas')
          .select('ativo, taxas, updated_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) {
          logger.error('Erro ao buscar taxas:', error)
          return
        }

        if (data) {
          const typedData = data as any
          // Criar hash dos dados para detectar mudanças
          const currentHash = JSON.stringify({
            ativo: typedData.ativo,
            taxas: typedData.taxas,
            updated_at: typedData.updated_at,
          })

          // Se é a primeira verificação (load inicial) OU se os dados mudaram
          const isFirstLoad = lastDataRef.current === null
          const hasChanged = lastDataRef.current !== currentHash

          if (isFirstLoad || hasChanged) {
            if (isFirstLoad) {
              logger.log('[usePollingTaxas] Carga inicial:', {
                ativo: typedData.ativo,
                taxas: typedData.taxas,
              })
            } else {
              logger.log('[usePollingTaxas] Mudança detectada!', {
                ativo: typedData.ativo,
                taxas: typedData.taxas,
              })
            }

            if (onUpdate) {
              onUpdate({
                ativo: typedData.ativo,
                taxas: typedData.taxas as TaxasConfig,
              })
            }
          }

          // Atualizar referência
          lastDataRef.current = currentHash
        }
      } catch (error) {
        logger.error('Erro no polling:', error)
      }
    }

    // Primeira verificação imediata
    checkForUpdates()

    // Configurar polling
    intervalIdRef.current = setInterval(checkForUpdates, interval)

    // Cleanup
    return () => {
      logger.log('Parando polling')
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
      }
    }
  }, [enabled, interval, onUpdate])

  return {
    stop: () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    },
  }
}
