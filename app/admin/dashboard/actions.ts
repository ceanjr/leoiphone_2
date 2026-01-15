'use server'

import { createClient } from '@/lib/supabase/server'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('DashboardActions')

export async function trackBannerProductClick(
  bannerId: string, 
  produtoId: string, 
  visitorId: string
) {
  try {
    const supabase = await createClient() // ✅ Correto - server-side
    
    // Inserir clique diretamente na tabela
    const { error } = await supabase
      .from('banner_produtos_clicks')
      .insert({
        banner_id: bannerId,
        produto_id: produtoId,
        visitor_id: visitorId,
      } as any)

    if (error) {
      logger.error('[trackBannerProductClick] Erro ao registrar:', error)
      return { success: false, error: error.message }
    }

    logger.info('[trackBannerProductClick] Clique registrado:', { bannerId, produtoId, visitorId })
    return { success: true, visitorId }
  } catch (error: any) {
    logger.error('[trackBannerProductClick] Exceção:', error)
    return { success: false, error: error.message }
  }
}