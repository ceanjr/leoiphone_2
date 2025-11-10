import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { logger } from '@/lib/utils/logger'

// Optimization Phase 2: Lazy singleton instance to reduce initial bundle impact
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

// Função para resetar o singleton (útil após logout)
export function resetClient() {
  clientInstance = null
}

export function createClient() {
  // Return existing instance if already created
  if (clientInstance) {
    return clientInstance
  }

  // Create new instance only when needed
  clientInstance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Fallback para localStorage se cookies não estiverem disponíveis no PWA
          if (typeof document === 'undefined') return null
          
          const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
          
          if (cookie) {
            return cookie.split('=')[1]
          }
          
          // Fallback: tentar localStorage
          try {
            return localStorage.getItem(name)
          } catch {
            return null
          }
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return
          
          // Salvar em cookie
          const expires = options?.maxAge
            ? new Date(Date.now() + options.maxAge * 1000).toUTCString()
            : ''
          
          document.cookie = `${name}=${value}; path=/; ${expires ? `expires=${expires};` : ''} SameSite=Lax; Secure`
          
          // Fallback: salvar também em localStorage para PWA
          try {
            localStorage.setItem(name, value)
          } catch (e) {
            logger.error('[Supabase] Failed to save to localStorage:', e)
          }
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return
          
          // Remover do cookie
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
          
          // Remover do localStorage
          try {
            localStorage.removeItem(name)
          } catch (e) {
            logger.error('[Supabase] Failed to remove from localStorage:', e)
          }
        },
      },
    }
  )

  return clientInstance
}
