'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createLogger } from '@/lib/utils/logger'
import type { ProdutoComCategoria } from '@/types/produto'

const logger = createLogger('usePollingProdutos')

interface UsePollingProdutosOptions {
  enabled?: boolean
  interval?: number // em milissegundos (padrão: 10000ms = 10s)
  onUpdate?: (produtos: ProdutoComCategoria[]) => void
}

/**
 * Hook para sincronização de produtos via polling (verificação periódica)
 *
 * Alternativa ao Realtime quando não está disponível.
 * Verifica mudanças na lista de produtos a cada X milissegundos.
 *
 * @param options - Configurações do polling
 * @param options.enabled - Se o polling está ativo (padrão: true)
 * @param options.interval - Intervalo em ms (padrão: 10000ms = 10s)
 * @param options.onUpdate - Callback quando detectar mudança
 */
export function usePollingProdutos(options: UsePollingProdutosOptions = {}) {
  const { enabled = true, interval = 10000, onUpdate } = options // Otimizado para 10s (reduz tráfego em 80%)
  const lastHashRef = useRef<string | null>(null)
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
        // Buscar todos os produtos ativos com dados completos (otimização: única query)
        const { data, error } = await supabase
          .from('produtos')
          .select(`
            *,
            categoria:categorias(id, nome, slug)
          `)
          .eq('ativo', true)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })

        if (error) {
          logger.error('Erro ao buscar produtos:', error)
          return
        }

        if (data) {
          // Criar hash para detectar mudanças
          const currentHash = data
            .map((p: any) => `${p.id}:${p.updated_at}:${p.preco}:${p.ativo}`)
            .join('|')

          // Se os dados mudaram desde a última verificação
          if (lastHashRef.current !== null && lastHashRef.current !== currentHash) {
            logger.log('Mudança detectada nos produtos!', {
              antes: lastHashRef.current?.slice(0, 100),
              depois: currentHash.slice(0, 100),
            })

            // Dados já estão completos, não precisa buscar novamente (otimização: 50% menos queries)
            if (onUpdate) {
              onUpdate(data as ProdutoComCategoria[])
            }
          }

          // Atualizar referência
          lastHashRef.current = currentHash
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
