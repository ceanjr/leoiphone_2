'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createLogger } from '@/lib/utils/logger'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { ProdutoComCategoria } from '@/types/produto'

const logger = createLogger('useRealtimeProdutos')

interface UseRealtimeProdutosOptions {
  enabled?: boolean
  onInsert?: (produto: ProdutoComCategoria) => void
  onUpdate?: (produto: ProdutoComCategoria) => void
  onDelete?: (id: string) => void
}

export function useRealtimeProdutos(options: UseRealtimeProdutosOptions = {}) {
  const { enabled = true, onInsert, onUpdate, onDelete } = options
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) {
      logger.log('Realtime desabilitado')
      return
    }

    logger.log('Iniciando subscrição de produtos...')
    const supabase = createClient()

    // Criar canal de realtime para produtos
    const produtosChannel = supabase
      .channel('produtos-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'produtos',
        },
        async (payload) => {
          logger.log('INSERT recebido:', payload.new.id)

          // Buscar produto completo com categoria
          const { data, error } = await supabase
            .from('produtos')
            .select(`
              *,
              categoria:categorias(id, nome, slug)
            `)
            .eq('id', payload.new.id)
            .single()

          if (error) {
            logger.error('Erro ao buscar produto:', error)
            return
          }

          if (data && onInsert) {
            logger.log('Produto inserido:', (data as any).nome)
            onInsert(data as ProdutoComCategoria)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'produtos',
        },
        async (payload) => {
          logger.log('UPDATE recebido:', payload.new.id)

          // Buscar produto completo com categoria
          const { data, error } = await supabase
            .from('produtos')
            .select(`
              *,
              categoria:categorias(id, nome, slug)
            `)
            .eq('id', payload.new.id)
            .single()

          if (error) {
            logger.error('Erro ao buscar produto:', error)
            return
          }

          if (data && onUpdate) {
            logger.log('Produto atualizado:', (data as any).nome)
            onUpdate(data as ProdutoComCategoria)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'produtos',
        },
        (payload) => {
          logger.log('DELETE recebido:', payload.old.id)

          if (onDelete) {
            onDelete(payload.old.id)
          }
        }
      )
      .subscribe((status) => {
        logger.log('Status da subscrição:', status)
      })

    setChannel(produtosChannel)

    // Cleanup
    return () => {
      logger.log('Removendo subscrição de produtos')
      supabase.removeChannel(produtosChannel)
    }
  }, [enabled, onInsert, onUpdate, onDelete])

  return { channel }
}
