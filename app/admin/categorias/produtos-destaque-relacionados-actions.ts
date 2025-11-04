'use server'
import { logger } from '@/lib/utils/logger'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const CATEGORIA_DESTAQUE_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Buscar configuração de produtos relacionados para produtos em destaque
 */
export async function getConfigProdutosRelacionadosDestaque() {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('categoria_produtos_relacionados')
      .select('*')
      .eq('categoria_id', CATEGORIA_DESTAQUE_ID)
      .single()

    if (error) {
      // Se não existir, retornar configuração padrão
      if (error.code === 'PGRST116') {
        return {
          data: {
            id: '',
            categoria_id: CATEGORIA_DESTAQUE_ID,
            auto_select: true,
            produtos_selecionados: [],
            desconto_min: 3.0,
            desconto_max: 7.0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }
      }
      logger.error('Erro ao buscar config produtos relacionados destaque:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    logger.error('Erro ao buscar config produtos relacionados destaque:', error)
    return { data: null, error: 'Erro ao buscar configuração' }
  }
}

/**
 * Atualizar configuração GLOBAL de produtos relacionados para produtos em destaque
 */
export async function updateConfigProdutosRelacionadosDestaque(
  autoSelect: boolean,
  produtosSelecionados: string[],
  descontoMin: number,
  descontoMax: number
) {
  try {
    const supabase = await createClient()

    // Validar que min <= max
    if (descontoMin > descontoMax) {
      return { success: false, error: 'Desconto mínimo não pode ser maior que o máximo' }
    }

    // Verificar se já existe configuração
    const { data: existing } = await (supabase as any)
      .from('categoria_produtos_relacionados')
      .select('id')
      .eq('categoria_id', CATEGORIA_DESTAQUE_ID)
      .single()

    const configData = {
      categoria_id: CATEGORIA_DESTAQUE_ID,
      auto_select: autoSelect,
      produtos_selecionados: produtosSelecionados,
      desconto_min: descontoMin,
      desconto_max: descontoMax,
      updated_at: new Date().toISOString(),
    }

    let error

    if (existing) {
      // Atualizar existente
      const result = await (supabase as any)
        .from('categoria_produtos_relacionados')
        .update(configData)
        .eq('categoria_id', CATEGORIA_DESTAQUE_ID)

      error = result.error
    } else {
      // Criar novo
      const result = await (supabase as any)
        .from('categoria_produtos_relacionados')
        .insert(configData)

      error = result.error
    }

    if (error) {
      logger.error('Erro ao salvar config produtos relacionados destaque:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categorias')
    revalidatePath('/', 'layout')

    return { success: true, error: null }
  } catch (error) {
    logger.error('Erro ao salvar config produtos relacionados destaque:', error)
    return { success: false, error: 'Erro ao salvar configuração' }
  }
}

/**
 * Aplicar configuração para cada produto em destaque individualmente
 * Cria entradas separadas na tabela para cada produto
 */
export async function aplicarConfigIndividualProdutosDestaque(
  produtosSelecionados: string[],
  descontoMin: number,
  descontoMax: number
) {
  try {
    const supabase = await createClient()

    // Validar que min <= max
    if (descontoMin > descontoMax) {
      return { success: false, error: 'Desconto mínimo não pode ser maior que o máximo' }
    }

    // Buscar todos os produtos em destaque
    const { data: produtosDestaque, error: fetchError } = await (supabase as any)
      .from('produtos_destaque')
      .select('produto_id')
      .eq('ativo', true)

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    if (!produtosDestaque || produtosDestaque.length === 0) {
      return { success: false, error: 'Nenhum produto em destaque encontrado' }
    }

    // Para cada produto em destaque, criar/atualizar configuração individual
    let successCount = 0
    for (const item of produtosDestaque) {
      // Usar produto_id como se fosse uma "categoria" única
      // Na verdade, estamos configurando produtos relacionados para esse produto específico
      const { error: upsertError } = await (supabase as any)
        .from('categoria_produtos_relacionados')
        .upsert({
          categoria_id: item.produto_id, // Usa o ID do produto como categoria
          auto_select: produtosSelecionados.length === 0,
          produtos_selecionados: produtosSelecionados,
          desconto_min: descontoMin,
          desconto_max: descontoMax,
          updated_at: new Date().toISOString(),
        })

      if (!upsertError) {
        successCount++
      }
    }

    revalidatePath('/admin/categorias')
    revalidatePath('/', 'layout')

    return {
      success: true,
      error: null,
      count: successCount,
    }
  } catch (error) {
    logger.error('Erro ao aplicar config individual:', error)
    return { success: false, error: 'Erro ao aplicar configuração individual' }
  }
}

/**
 * Buscar produtos disponíveis para produtos relacionados (excluindo produtos já em destaque)
 */
export async function buscarProdutosParaRelacionados() {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('produtos')
      .select('id, codigo_produto, nome, slug, preco, foto_principal, estoque, nivel_bateria, categoria:categorias(nome)')
      .eq('ativo', true)
      .is('deleted_at', null)
      .neq('categoria_id', CATEGORIA_DESTAQUE_ID) // Excluir produtos em destaque
      .gt('estoque', 0)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      logger.error('Erro ao buscar produtos para relacionados:', error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    logger.error('Erro ao buscar produtos para relacionados:', error)
    return { data: [], error: 'Erro ao buscar produtos' }
  }
}

/**
 * Listar produtos que estão em destaque (para configuração individual)
 * Busca produtos dos banners ativos do tipo 'produtos_destaque'
 */
export async function listarProdutosEmDestaque() {
  try {
    const supabase = await createClient()

    // Buscar banners ativos do tipo produtos_destaque
    const { data: banners, error: bannersError } = await (supabase as any)
      .from('banners')
      .select('id, titulo, produtos_destaque')
      .eq('ativo', true)
      .eq('tipo', 'produtos_destaque')
      .order('ordem', { ascending: true })

    if (bannersError) {
      logger.error('Erro ao buscar banners:', bannersError)
      return { data: [], error: bannersError.message }
    }

    if (!banners || banners.length === 0) {
      return { data: [], error: null }
    }

    // Coletar todos os IDs de produtos em destaque
    const produtoIds = new Set<string>()
    for (const banner of banners) {
      if (banner.produtos_destaque && Array.isArray(banner.produtos_destaque)) {
        banner.produtos_destaque.forEach((pd: any) => {
          if (pd.produto_id) produtoIds.add(pd.produto_id)
        })
      }
    }

    if (produtoIds.size === 0) {
      return { data: [], error: null }
    }

    // Buscar informações dos produtos
    const { data: produtos, error: produtosError } = await (supabase as any)
      .from('produtos')
      .select('id, codigo_produto, nome, slug, preco, foto_principal, nivel_bateria')
      .in('id', Array.from(produtoIds))
      .eq('ativo', true)
      .is('deleted_at', null)

    if (produtosError) {
      logger.error('Erro ao buscar produtos:', produtosError)
      return { data: [], error: produtosError.message }
    }

    // Para cada produto, buscar sua configuração individual se existir
    const produtosComConfig = await Promise.all(
      (produtos || []).map(async (produto: any) => {
        const { data: config } = await (supabase as any)
          .from('categoria_produtos_relacionados')
          .select('*')
          .eq('categoria_id', produto.id)
          .single()

        return {
          produto_id: produto.id,
          codigo_produto: produto.codigo_produto,
          produto_nome: produto.nome,
          produto_slug: produto.slug,
          produto_preco: produto.preco,
          foto_principal: produto.foto_principal,
          nivel_bateria: produto.nivel_bateria,
          config_individual: config || null,
        }
      })
    )

    return { data: produtosComConfig, error: null }
  } catch (error) {
    logger.error('Erro ao listar produtos em destaque:', error)
    return { data: [], error: 'Erro ao listar produtos' }
  }
}

/**
 * Deletar configuração individual de um produto (para usar config global)
 */
export async function deleteConfigProdutoDestaqueIndividual(produtoId: string) {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('categoria_produtos_relacionados')
      .delete()
      .eq('categoria_id', produtoId)

    if (error) {
      logger.error('Erro ao deletar config individual:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categorias')
    revalidatePath('/', 'layout')

    return { success: true, error: null }
  } catch (error) {
    logger.error('Erro ao deletar config individual:', error)
    return { success: false, error: 'Erro ao deletar configuração' }
  }
}
export async function updateConfigProdutoDestaqueIndividual(
  produtoId: string,
  autoSelect: boolean,
  produtosSelecionados: string[],
  descontoMin: number,
  descontoMax: number
) {
  try {
    const supabase = await createClient()

    // Validar que min <= max
    if (descontoMin > descontoMax) {
      return { success: false, error: 'Desconto mínimo não pode ser maior que o máximo' }
    }

    // Verificar se já existe configuração para este produto
    const { data: existing } = await (supabase as any)
      .from('categoria_produtos_relacionados')
      .select('id')
      .eq('categoria_id', produtoId)
      .single()

    const configData = {
      categoria_id: produtoId,
      auto_select: autoSelect,
      produtos_selecionados: produtosSelecionados,
      desconto_min: descontoMin,
      desconto_max: descontoMax,
      updated_at: new Date().toISOString(),
    }

    let error

    if (existing) {
      const result = await (supabase as any)
        .from('categoria_produtos_relacionados')
        .update(configData)
        .eq('categoria_id', produtoId)

      error = result.error
    } else {
      const result = await (supabase as any)
        .from('categoria_produtos_relacionados')
        .insert(configData)

      error = result.error
    }

    if (error) {
      logger.error('Erro ao salvar config individual:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categorias')
    revalidatePath('/', 'layout')

    return { success: true, error: null }
  } catch (error) {
    logger.error('Erro ao salvar config individual:', error)
    return { success: false, error: 'Erro ao salvar configuração' }
  }
}
