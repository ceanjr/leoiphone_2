'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('DashboardActions')

/**
 * Zerar visualizações de todos os produtos
 */
export async function zerarVisualizacoes() {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Não autorizado' }
    }

    // Zerar visualizações de todos os produtos usando RPC
    const { error } = await supabase.rpc('zerar_visualizacoes_produtos')

    if (error) {
      logger.error('Erro ao zerar visualizações:', error)
      return { success: false, error: error.message }
    }

    // Revalidar dashboard
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      message: 'Visualizações zeradas com sucesso!',
    }
  } catch (error: any) {
    logger.error('Erro ao zerar visualizações:', error)
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    }
  }
}

/**
 * Aleatorizar produtos relacionados
 */
export async function aleatorizarProdutosRelacionados() {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Não autorizado' }
    }

    // Aleatorizar produtos relacionados usando RPC
    const { error } = await supabase.rpc('aleatorizar_produtos_relacionados')

    if (error) {
      logger.error('Erro ao aleatorizar produtos relacionados:', error)
      return { success: false, error: error.message }
    }

    // Revalidar todas as páginas de produtos
    revalidatePath('/', 'layout')

    return {
      success: true,
      message: 'Produtos relacionados aleatorizados com sucesso!',
    }
  } catch (error: any) {
    logger.error('Erro ao aleatorizar produtos relacionados:', error)
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    }
  }
}

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