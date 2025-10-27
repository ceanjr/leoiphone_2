import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

// Optimization Phase 2: Lazy singleton instance to reduce initial bundle impact
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Return existing instance if already created
  if (clientInstance) {
    return clientInstance
  }

  // Create new instance only when needed
  clientInstance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return clientInstance
}
