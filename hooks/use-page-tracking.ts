'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Gerar ou recuperar ID único do visitante
function getVisitorId(): string {
  if (typeof window === 'undefined') return ''

  const key = 'visitor_id'
  let id = localStorage.getItem(key)

  if (!id) {
    id = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(key, id)
  }

  return id
}

// Apenas rastrear em produção
function shouldTrack(): boolean {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname.includes('leoiphone.com.br') || hostname.includes('vercel.app')
}

export function usePageTracking() {
  const pathname = usePathname()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const visitorId = useRef<string>('')
  const tracked = useRef(false)

  useEffect(() => {
    if (!shouldTrack()) {
      console.log('[Tracking] Desabilitado em desenvolvimento')
      return
    }

    visitorId.current = getVisitorId()
    const supabase = createClient()

    // Registrar page view inicial
    const trackView = async () => {
      try {
        console.log('[Tracking] Registrando view:', { pathname, visitorId: visitorId.current })
        await (supabase as any).rpc('track_page_view', {
          p_visitor_id: visitorId.current,
          p_path: pathname
        })
        tracked.current = true
        console.log('[Tracking] View registrada com sucesso')
      } catch (error) {
        console.error('[Tracking] Erro ao rastrear page view:', error)
      }
    }

    trackView()

    // Atualizar heartbeat a cada 30 segundos
    intervalRef.current = setInterval(async () => {
      if (!tracked.current) return

      try {
        await (supabase as any)
          .from('active_sessions')
          .update({ last_seen: new Date().toISOString(), page_path: pathname })
          .eq('visitor_id', visitorId.current)
      } catch (error) {
        console.error('[Tracking] Erro ao atualizar sessão:', error)
      }
    }, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [pathname])
}
