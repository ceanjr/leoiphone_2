'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ProdutoComCategoria } from '@/types/produto'

interface UsePollingProdutosOptions {
  enabled?: boolean
  interval?: number // em milissegundos (padrão: 5000ms = 5s)
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
 * @param options.interval - Intervalo em ms (padrão: 5000ms)
 * @param options.onUpdate - Callback quando detectar mudança
 */
export function usePollingProdutos(options: UsePollingProdutosOptions = {}) {
  const { enabled = true, interval = 5000, onUpdate } = options
  const lastHashRef = useRef<string | null>(null)
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) {
      console.log('[usePollingProdutos] Polling desabilitado')
      return
    }

    console.log('[usePollingProdutos] Iniciando polling (intervalo:', interval, 'ms)')

    const supabase = createClient()

    const checkForUpdates = async () => {
      try {
        // Buscar todos os produtos ativos
        const { data, error } = await supabase
          .from('produtos')
          .select(`
            id,
            nome,
            preco,
            updated_at,
            ativo,
            deleted_at,
            categoria:categorias(id, nome, slug)
          `)
          .eq('ativo', true)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })

        if (error) {
          console.error('[usePollingProdutos] Erro ao buscar produtos:', error)
          return
        }

        if (data) {
          // Criar hash dos IDs e timestamps para detectar mudanças
          const currentHash = data
            .map((p: any) => `${p.id}:${p.updated_at}`)
            .join('|')

          // Se os dados mudaram desde a última verificação
          if (lastHashRef.current !== null && lastHashRef.current !== currentHash) {
            console.log('[usePollingProdutos] Mudança detectada nos produtos!')

            // Buscar produtos completos
            const { data: produtosCompletos } = await supabase
              .from('produtos')
              .select(`
                *,
                categoria:categorias(id, nome, slug)
              `)
              .eq('ativo', true)
              .is('deleted_at', null)

            if (produtosCompletos && onUpdate) {
              onUpdate(produtosCompletos as ProdutoComCategoria[])
            }
          }

          // Atualizar referência
          lastHashRef.current = currentHash
        }
      } catch (error) {
        console.error('[usePollingProdutos] Erro no polling:', error)
      }
    }

    // Primeira verificação imediata
    checkForUpdates()

    // Configurar polling
    intervalIdRef.current = setInterval(checkForUpdates, interval)

    // Cleanup
    return () => {
      console.log('[usePollingProdutos] Parando polling')
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
