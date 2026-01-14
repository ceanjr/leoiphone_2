'use client'

import { useSyncExternalStore } from 'react'

/**
 * Hook para detectar media queries usando useSyncExternalStore
 * Evita problemas de hydration e cascading renders
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    const mediaQuery = window.matchMedia(query)
    mediaQuery.addEventListener('change', callback)
    return () => mediaQuery.removeEventListener('change', callback)
  }

  const getSnapshot = () => {
    return window.matchMedia(query).matches
  }

  const getServerSnapshot = () => {
    // No servidor, assumir mobile para evitar hydration mismatch
    return false
  }

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Hook para detectar se é desktop (md breakpoint do Tailwind = 768px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)')
}

/**
 * Hook para detectar se é mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}
