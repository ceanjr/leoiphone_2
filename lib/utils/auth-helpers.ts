'use client'

import { resetClient } from '@/lib/supabase/client'
import { logout as serverLogout } from '@/app/(auth)/login/actions'

/**
 * Limpa todos os dados de autenticação do storage local
 */
export function clearAuthStorage() {
  try {
    // Remover itens do localStorage relacionados ao Supabase
    const localKeysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        localKeysToRemove.push(key)
      }
    }
    localKeysToRemove.forEach(key => localStorage.removeItem(key))

    // Remover itens do sessionStorage relacionados ao Supabase
    const sessionKeysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        sessionKeysToRemove.push(key)
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))

    // Resetar o singleton do Supabase client
    resetClient()
  } catch (e) {
    console.error('Erro ao limpar storage:', e)
  }
}

/**
 * Realiza logout completo: limpa storage local e faz logout no servidor
 */
export async function performLogout() {
  clearAuthStorage()
  await serverLogout()
}
