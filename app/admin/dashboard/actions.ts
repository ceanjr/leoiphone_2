'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
      console.error('Erro ao zerar visualizações:', error)
      return { success: false, error: error.message }
    }

    // Revalidar dashboard
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      message: 'Visualizações zeradas com sucesso!',
    }
  } catch (error: any) {
    console.error('Erro ao zerar visualizações:', error)
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
      console.error('Erro ao aleatorizar produtos relacionados:', error)
      return { success: false, error: error.message }
    }

    // Revalidar todas as páginas de produtos
    revalidatePath('/', 'layout')

    return {
      success: true,
      message: 'Produtos relacionados aleatorizados com sucesso!',
    }
  } catch (error: any) {
    console.error('Erro ao aleatorizar produtos relacionados:', error)
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    }
  }
}
