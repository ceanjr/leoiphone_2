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

export async function trackBannerProductClick(bannerId: string, produtoId: string, visitorId?: string) {
  try {
    const supabase = await createClient()
    
    // Se não receber visitor_id, criar um baseado no timestamp
    const finalVisitorId = visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Usar RPC function criada na migration
    const { error } = await (supabase as any).rpc('record_banner_click', {
      p_banner_id: bannerId,
      p_produto_id: produtoId,
      p_visitor_id: finalVisitorId,
    })

    if (error) {
      logger.error('Erro ao registrar clique no banner:', error)
      return { success: false, error: error.message }
    }

    return { success: true, visitorId: finalVisitorId }
  } catch (error: any) {
    logger.error('Erro ao registrar clique no banner:', error)
    return { success: false, error: error.message }
  }
}