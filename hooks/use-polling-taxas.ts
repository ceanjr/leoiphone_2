'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TaxasConfig } from '@/lib/validations/taxas'

interface ConfiguracaoTaxas {
  ativo: boolean
  taxas: TaxasConfig
}

interface UsePollingTaxasOptions {
  enabled?: boolean
  interval?: number // em milissegundos (padrão: 2000ms = 2s)
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
 * @param options.interval - Intervalo em ms (padrão: 2000ms)
 * @param options.onUpdate - Callback quando detectar mudança
 */
export function usePollingTaxas(options: UsePollingTaxasOptions = {}) {
  const { enabled = true, interval = 2000, onUpdate } = options
  const lastDataRef = useRef<string | null>(null)
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) {
      console.log('[usePollingTaxas] Polling desabilitado')
      return
    }

    console.log('[usePollingTaxas] Iniciando polling (intervalo:', interval, 'ms)')

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
          console.error('[usePollingTaxas] Erro ao buscar taxas:', error)
          return
        }

        if (data) {
          // Criar hash dos dados para detectar mudanças
          const currentHash = JSON.stringify({
            ativo: data.ativo,
            taxas: data.taxas,
            updated_at: data.updated_at,
          })

          // Se os dados mudaram desde a última verificação
          if (lastDataRef.current !== null && lastDataRef.current !== currentHash) {
            console.log('[usePollingTaxas] Mudança detectada!', {
              ativo: data.ativo,
              taxas: data.taxas,
            })

            if (onUpdate) {
              onUpdate({
                ativo: data.ativo,
                taxas: data.taxas as TaxasConfig,
              })
            }
          }

          // Atualizar referência
          lastDataRef.current = currentHash
        }
      } catch (error) {
        console.error('[usePollingTaxas] Erro no polling:', error)
      }
    }

    // Primeira verificação imediata
    checkForUpdates()

    // Configurar polling
    intervalIdRef.current = setInterval(checkForUpdates, interval)

    // Cleanup
    return () => {
      console.log('[usePollingTaxas] Parando polling')
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
