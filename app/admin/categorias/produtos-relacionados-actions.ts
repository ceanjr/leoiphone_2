'use server'
import { logger } from '@/lib/utils/logger'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CategoriaProdutosRelacionados } from '@/types/produto'

/**
 * Busca a configuração global de produtos relacionados
 */
export async function getConfigGlobalProdutosRelacionados(): Promise<{
  data: { id: string; ativo: boolean; desconto_min: number; desconto_max: number; ordem_aleatoria?: number } | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('config_produtos_relacionados')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      // Se não existir, retornar configuração padrão
      if (error.code === 'PGRST116') {
        return {
          data: {
            id: '',
            ativo: true,
            desconto_min: 3.0,
            desconto_max: 7.0,
            ordem_aleatoria: 0,
          },
          error: null,
        }
      }
      logger.error('Erro ao buscar configuração global:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    logger.error('Erro ao buscar configuração global:', error)
    if (error instanceof Error) {
      return { data: null, error: error.message }
    }
    return { data: null, error: 'Erro ao buscar configuração global' }
  }
}

/**
 * Atualiza a configuração global de produtos relacionados
 */
export async function updateConfigGlobalProdutosRelacionados(
  ativo: boolean,
  descontoMin: number,
  descontoMax: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    // Validar que min <= max
    if (descontoMin > descontoMax) {
      return { success: false, error: 'Desconto mínimo não pode ser maior que o máximo' }
    }

    // Buscar configuração existente
    const { data: existing } = await (supabase as any)
      .from('config_produtos_relacionados')
      .select('id')
      .limit(1)
      .single()

    const configData = {
      ativo,
      desconto_min: descontoMin,
      desconto_max: descontoMax,
      updated_at: new Date().toISOString(),
    }

    let error

    if (existing) {
      // Atualizar
      const result = await (supabase as any)
        .from('config_produtos_relacionados')
        .update(configData)
        .eq('id', existing.id)

      error = result.error
    } else {
      // Criar
      const result = await (supabase as any)
        .from('config_produtos_relacionados')
        .insert(configData)

      error = result.error
    }

    if (error) {
      logger.error('Erro ao salvar configuração global:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categorias')
    revalidatePath('/', 'layout')

    return { success: true, error: null }
  } catch (error) {
    logger.error('Erro ao salvar configuração global:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro ao salvar configuração global' }
  }
}

/**
 * Aplica o desconto global a todas as categorias
 */
export async function aplicarDescontoGlobalTodasCategorias(
  descontoMin: number,
  descontoMax: number
): Promise<{ success: boolean; error: string | null; count: number }> {
  try {
    const supabase = await createClient()

    // Validar que min <= max
    if (descontoMin > descontoMax) {
      return {
        success: false,
        error: 'Desconto mínimo não pode ser maior que o máximo',
        count: 0,
      }
    }

    // Atualizar todas as categorias com o desconto global
    const { error, count } = await (supabase as any)
      .from('categoria_produtos_relacionados')
      .update({
        desconto_min: descontoMin,
        desconto_max: descontoMax,
        updated_at: new Date().toISOString(),
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Atualizar todas

    if (error) {
      logger.error('Erro ao aplicar desconto global:', error)
      return { success: false, error: error.message, count: 0 }
    }

    revalidatePath('/admin/categorias')
    revalidatePath('/', 'layout')

    return { success: true, error: null, count: count || 0 }
  } catch (error) {
    logger.error('Erro ao aplicar desconto global:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message, count: 0 }
    }
    return { success: false, error: 'Erro ao aplicar desconto global', count: 0 }
  }
}

/**
 * Busca a configuração de produtos relacionados de uma categoria
 */
export async function getCategoriaProdutosRelacionados(
  categoriaId: string
): Promise<{ data: CategoriaProdutosRelacionados | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('categoria_produtos_relacionados')
      .select('*')
      .eq('categoria_id', categoriaId)
      .single()

    if (error) {
      // Se não existir configuração, retornar configuração padrão
      if (error.code === 'PGRST116') {
        return {
          data: {
            id: '',
            categoria_id: categoriaId,
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
      logger.error('Erro ao buscar configuração de produtos relacionados:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    logger.error('Erro ao buscar configuração de produtos relacionados:', error)
    if (error instanceof Error) {
      return { data: null, error: error.message }
    }
    return { data: null, error: 'Erro ao buscar configuração' }
  }
}

/**
 * Atualiza ou cria configuração de produtos relacionados para uma categoria
 */
export async function updateCategoriaProdutosRelacionados(
  categoriaId: string,
  autoSelect: boolean,
  produtosSelecionados: string[],
  descontoMin: number,
  descontoMax: number
): Promise<{ success: boolean; error: string | null }> {
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
      .eq('categoria_id', categoriaId)
      .single()

    const configData = {
      categoria_id: categoriaId,
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
        .eq('categoria_id', categoriaId)

      error = result.error
    } else {
      // Criar novo
      const result = await (supabase as any)
        .from('categoria_produtos_relacionados')
        .insert(configData)

      error = result.error
    }

    if (error) {
      logger.error('Erro ao salvar configuração de produtos relacionados:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categorias')
    revalidatePath('/', 'layout')

    return { success: true, error: null }
  } catch (error) {
    logger.error('Erro ao salvar configuração de produtos relacionados:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro ao salvar configuração' }
  }
}

/**
 * Reseta produtos relacionados para seleção automática
 */
export async function resetProdutosRelacionados(
  categoriaId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('categoria_produtos_relacionados')
      .update({
        auto_select: true,
        produtos_selecionados: [],
        updated_at: new Date().toISOString(),
      })
      .eq('categoria_id', categoriaId)

    if (error) {
      logger.error('Erro ao resetar produtos relacionados:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categorias')
    revalidatePath('/', 'layout')

    return { success: true, error: null }
  } catch (error) {
    logger.error('Erro ao resetar produtos relacionados:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro ao resetar produtos relacionados' }
  }
}

// Categorias de acessórios (mostrarão produtos de qualquer categoria)
const CATEGORIAS_ACESSORIOS = [
  'acessórios apple',
  'amazon',
  'apple watch',
  'cabos e carregadores',
  'caixas de som',
  'fones de ouvido',
  'ipad',
  'tablet',
  'smartwatch',
  'videogames',
]

// Categorias de celulares/smartphones (mostrarão apenas acessórios)
const CATEGORIAS_CELULARES_KEYWORDS = [
  'iphone',
  'motorola',
  'realme',
  'samsung',
  'xiaomi',
  'lacrado',
]

/**
 * Determina se uma categoria é de celulares/smartphones
 */
function isCategoriacelular(categoriaNome: string): boolean {
  const nome = categoriaNome.toLowerCase()
  return CATEGORIAS_CELULARES_KEYWORDS.some((keyword) => nome.includes(keyword))
}

/**
 * Determina se uma categoria é de acessórios
 */
function isCategoriaAcessorio(categoriaNome: string): boolean {
  const nome = categoriaNome.toLowerCase()
  return CATEGORIAS_ACESSORIOS.some((acessorio) => nome.includes(acessorio))
}

/**
 * Busca produtos relacionados para exibir na página do produto
 * Nova lógica simplificada:
 * - Categorias de celulares (iPhone, Motorola, etc.): mostram produtos de acessórios
 * - Categorias de acessórios: mostram produtos de qualquer categoria
 * - Sem descontos aplicados
 */
export async function getProdutosRelacionados(
  produtoId: string,
  categoriaId: string,
  limit: number = 3
): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const supabase = await createClient()

    // Verificar se o sistema está ativo globalmente
    const { data: configGlobal } = await getConfigGlobalProdutosRelacionados()
    const sistemaAtivo = configGlobal ? configGlobal.ativo : true

    if (!sistemaAtivo) {
      return { data: [], error: null }
    }

    // Buscar informações da categoria atual
    const { data: categoriaAtual } = await (supabase as any)
      .from('categorias')
      .select('nome')
      .eq('id', categoriaId)
      .single()

    if (!categoriaAtual) {
      return { data: [], error: null }
    }

    // Buscar todas as categorias ativas
    const { data: todasCategorias } = await (supabase as any)
      .from('categorias')
      .select('id, nome')
      .eq('ativo', true)

    if (!todasCategorias || todasCategorias.length === 0) {
      return { data: [], error: null }
    }

    let categoriasAlvo: string[] = []
    const ehCelular = isCategoriacelular(categoriaAtual.nome)
    const ehAcessorio = isCategoriaAcessorio(categoriaAtual.nome)

    if (ehCelular) {
      // Se é categoria de celular, mostrar produtos de categorias de acessórios
      categoriasAlvo = todasCategorias
        .filter((cat: any) => isCategoriaAcessorio(cat.nome))
        .map((cat: any) => cat.id)
    } else if (ehAcessorio) {
      // Se é categoria de acessório, mostrar produtos de qualquer categoria (exceto a própria)
      categoriasAlvo = todasCategorias
        .filter((cat: any) => cat.id !== categoriaId)
        .map((cat: any) => cat.id)
    } else {
      // Fallback: mostrar produtos de acessórios
      categoriasAlvo = todasCategorias
        .filter((cat: any) => isCategoriaAcessorio(cat.nome))
        .map((cat: any) => cat.id)
    }

    if (categoriasAlvo.length === 0) {
      return { data: [], error: null }
    }

    // Buscar produtos das categorias alvo
    const { data: produtos } = await (supabase as any)
      .from('produtos')
      .select('*, categoria:categorias(id, nome, slug)')
      .in('categoria_id', categoriasAlvo)
      .eq('ativo', true)
      .is('deleted_at', null)
      .neq('id', produtoId)
      .limit(limit * 5)

    if (!produtos || produtos.length === 0) {
      return { data: [], error: null }
    }

    // Usar seed para ordem determinística mas que pode mudar
    const seed = configGlobal?.ordem_aleatoria || 0
    const shuffled = produtos.sort((a: any, b: any) => {
      const hashA = (a.id.charCodeAt(0) + seed) % 100
      const hashB = (b.id.charCodeAt(0) + seed) % 100
      return hashA - hashB
    })

    // Retornar produtos sem desconto
    const produtosFinais = shuffled.slice(0, limit)

    logger.log(
      '[getProdutosRelacionados] Retornando',
      produtosFinais.length,
      'produtos relacionados'
    )

    return { data: produtosFinais, error: null }
  } catch (error) {
    logger.error('[getProdutosRelacionados] Erro:', error)
    if (error instanceof Error) {
      return { data: null, error: error.message }
    }
    return { data: null, error: 'Erro ao buscar produtos relacionados' }
  }
}
