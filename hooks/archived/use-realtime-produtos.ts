'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { ProdutoComCategoria } from '@/types/produto'

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
      console.log('[useRealtimeProdutos] Realtime desabilitado')
      return
    }

    console.log('[useRealtimeProdutos] Iniciando subscrição de produtos...')
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
          console.log('[useRealtimeProdutos] INSERT recebido:', payload.new.id)

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
            console.error('[useRealtimeProdutos] Erro ao buscar produto:', error)
            return
          }

          if (data && onInsert) {
            console.log('[useRealtimeProdutos] Produto inserido:', (data as any).nome)
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
          console.log('[useRealtimeProdutos] UPDATE recebido:', payload.new.id)

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
            console.error('[useRealtimeProdutos] Erro ao buscar produto:', error)
            return
          }

          if (data && onUpdate) {
            console.log('[useRealtimeProdutos] Produto atualizado:', (data as any).nome)
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
          console.log('[useRealtimeProdutos] DELETE recebido:', payload.old.id)

          if (onDelete) {
            onDelete(payload.old.id)
          }
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeProdutos] Status da subscrição:', status)
      })

    setChannel(produtosChannel)

    // Cleanup
    return () => {
      console.log('[useRealtimeProdutos] Removendo subscrição de produtos')
      supabase.removeChannel(produtosChannel)
    }
  }, [enabled, onInsert, onUpdate, onDelete])

  return { channel }
}
