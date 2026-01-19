'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void
  loading?: boolean
  hasMore: boolean
  /** Distância em pixels antes do elemento para disparar o carregamento */
  threshold?: number
}

/**
 * Componente que dispara carregamento automático quando visível na tela.
 * Usa IntersectionObserver para detectar quando o usuário está próximo do fim.
 * Mantém botão como fallback caso o observer não funcione.
 */
export const InfiniteScrollTrigger = memo(function InfiniteScrollTrigger({
  onLoadMore,
  loading = false,
  hasMore,
  threshold = 200,
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    // Verificar suporte ao IntersectionObserver
    if (typeof IntersectionObserver === 'undefined') {
      setIsSupported(false)
      return
    }

    const triggerElement = triggerRef.current
    if (!triggerElement || !hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loading) {
          onLoadMore()
        }
      },
      {
        // rootMargin positivo faz o callback disparar antes do elemento aparecer
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    )

    observer.observe(triggerElement)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, loading, onLoadMore, threshold])

  // Não renderiza nada se não há mais produtos
  if (!hasMore) return null

  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-4">
      {/* Elemento trigger para o IntersectionObserver */}
      <div ref={triggerRef} className="h-1 w-full" aria-hidden="true" />

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-2 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-yellow)]" />
          <span className="text-sm">Carregando mais produtos...</span>
        </div>
      )}

      {/* Botão fallback - aparece se IntersectionObserver não for suportado ou como opção manual */}
      {!loading && !isSupported && (
        <Button
          onClick={onLoadMore}
          size="lg"
          className="min-w-[200px]"
          style={{
            backgroundColor: 'var(--brand-yellow)',
            color: 'var(--brand-black)',
          }}
        >
          Ver Mais Produtos
        </Button>
      )}
    </div>
  )
})
