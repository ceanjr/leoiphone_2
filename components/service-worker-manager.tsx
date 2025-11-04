'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

/**
 * Componente para gerenciar service workers
 * - Em desenvolvimento: desregistra service workers automaticamente
 * - Em produção: permite atualizações automáticas
 */
export function ServiceWorkerManager() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const isDevelopment = process.env.NODE_ENV === 'development'

    if (isDevelopment) {
      // Em desenvolvimento: desregistrar service workers para evitar cache problems
      unregisterServiceWorkers()
    } else {
      // Em produção: gerenciar atualizações
      handleServiceWorkerUpdates()
    }
  }, [])

  return null
}

/**
 * Desregistra todos os service workers (útil em desenvolvimento)
 */
async function unregisterServiceWorkers() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()

    for (const registration of registrations) {
      const success = await registration.unregister()
      if (success) {
        logger.debug('🧹 [DEV] Service worker desregistrado:', registration.scope)
      }
    }

    // Limpar caches antigos em desenvolvimento
    const cacheNames = await caches.keys()
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName)
      logger.debug('🧹 [DEV] Cache removido:', cacheName)
    }
  } catch (error) {
    logger.error('❌ Erro ao desregistrar service workers:', error)
  }
}

/**
 * Gerencia atualizações de service workers em produção
 */
async function handleServiceWorkerUpdates() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()

    for (const registration of registrations) {
      // Verificar atualizações a cada 1 hora
      setInterval(() => {
        registration.update().catch(console.error)
      }, 60 * 60 * 1000)

      // Detectar quando há uma nova versão esperando
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Há uma nova versão disponível
              logger.debug('🔄 Nova versão do app disponível!')

              // Mostrar notificação ao usuário (opcional)
              if (window.confirm('Nova versão disponível! Deseja atualizar?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' })
                window.location.reload()
              }
            }
          })
        }
      })
    }

    // Recarregar quando um novo service worker assumir o controle
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      logger.debug('🔄 Service worker atualizado! Recarregando...')
      window.location.reload()
    })

  } catch (error) {
    logger.error('❌ Erro ao gerenciar service worker:', error)
  }
}
