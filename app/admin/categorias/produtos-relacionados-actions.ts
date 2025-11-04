'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CategoriaProdutosRelacionados } from '@/types/produto'
import { gerarDescontoConsistente } from '@/lib/utils/desconto-colors'

const CATEGORIA_DESTAQUE_ID = '00000000-0000-0000-0000-000000000001'

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
      console.error('Erro ao buscar configuração global:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erro ao buscar configuração global:', error)
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
      console.error('Erro ao salvar configuração global:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categorias')
    revalidatePath('/', 'layout')

    return { success: true, error: null }
  } catch (error) {
    console.error('Erro ao salvar configuração global:', error)
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
      console.error('Erro ao aplicar desconto global:', error)
      return { success: false, error: error.message, count: 0 }
    }

    revalidatePath('/admin/categorias')
    revalidatePath('/', 'layout')

    return { success: true, error: null, count: count || 0 }
  } catch (error) {
    console.error('Erro ao aplicar desconto global:', error)
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
      console.error('Erro ao buscar configuração de produtos relacionados:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erro ao buscar configuração de produtos relacionados:', error)
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
      console.error('Erro ao salvar configuração de produtos relacionados:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categorias')
    revalidatePath('/', 'layout')

    return { success: true, error: null }
  } catch (error) {
    console.error('Erro ao salvar configuração de produtos relacionados:', error)
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
      console.error('Erro ao resetar produtos relacionados:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categorias')
    revalidatePath('/', 'layout')

    return { success: true, error: null }
  } catch (error) {
    console.error('Erro ao resetar produtos relacionados:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro ao resetar produtos relacionados' }
  }
}

/**
 * Determina categorias relacionadas baseado na categoria do produto
 */
function getCategoriasRelacionadas(categoriaNome: string): string[] {
  const nome = categoriaNome.toLowerCase()

  // Para iPhones e Smartphones
  if (nome.includes('iphone') || nome.includes('smartphone') || nome.includes('celular')) {
    return ['cabo', 'carregador', 'fone', 'airpod', 'capinha', 'película', 'airtag', 'pencil']
  }

  // Para Apple Watch
  if (nome.includes('watch') || nome.includes('smartwatch')) {
    return ['carregador', 'cabo', 'pulseira', 'watch']
  }

  // Para iPad/Tablets
  if (nome.includes('ipad') || nome.includes('tablet')) {
    return ['pencil', 'capa', 'teclado', 'carregador', 'cabo']
  }

  // Para Cabos/Carregadores/Acessórios
  if (
    nome.includes('cabo') ||
    nome.includes('carregador') ||
    nome.includes('acessório') ||
    nome.includes('fone')
  ) {
    return ['cabo', 'carregador', 'power bank', 'adaptador', 'fone']
  }

  // Para AirPods
  if (nome.includes('airpod') || nome.includes('fone')) {
    return ['cabo', 'carregador', 'capinha', 'iphone', 'ipad']
  }

  // Padrão: retornar acessórios gerais
  return ['cabo', 'carregador', 'fone', 'acessório']
}

/**
 * Busca produtos relacionados para exibir na página do produto
 * Aplica lógica de seleção automática ou manual
 */
export async function getProdutosRelacionados(
  produtoId: string,
  categoriaId: string,
  limit: number = 3
): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const supabase = await createClient()

    // Verificar se o sistema está ativo globalmente (com fallback)
    const { data: configGlobal } = await getConfigGlobalProdutosRelacionados()

    console.log('[getProdutosRelacionados] Config global:', configGlobal)

    // Se a tabela não existe ou não está configurada, assumir que está ativo por padrão
    const sistemaAtivo = configGlobal ? configGlobal.ativo : true

    console.log('[getProdutosRelacionados] Sistema ativo:', sistemaAtivo)

    if (!sistemaAtivo) {
      console.log('[getProdutosRelacionados] Sistema desativado, retornando vazio')
      return { data: [], error: null }
    }

    // Primeiro, verificar se o produto tem configuração individual (produtos em destaque)
    // Isso tem prioridade sobre a configuração da categoria
    const { data: configIndividual } = await getCategoriaProdutosRelacionados(produtoId)
    
    // Se não tem config individual, buscar configuração global de destaque (se o produto está em destaque)
    // ou a configuração da categoria
    let configGlobalDestaque = null
    
    // Verificar se o produto está em algum banner de destaque
    const { data: banners } = await (supabase as any)
      .from('banners')
      .select('produtos_destaque')
      .eq('ativo', true)
      .eq('tipo', 'produtos_destaque')
    
    const estEmDestaque = banners?.some((banner: any) => 
      banner.produtos_destaque?.some((pd: any) => pd.produto_id === produtoId)
    )
    
    console.log('[getProdutosRelacionados] Produto está em destaque?', estEmDestaque)
    
    // Se está em destaque e não tem config individual, buscar config global de destaque
    if (estEmDestaque && !configIndividual?.id) {
      const { data } = await getCategoriaProdutosRelacionados(CATEGORIA_DESTAQUE_ID)
      configGlobalDestaque = data
      console.log('[getProdutosRelacionados] Config global destaque:', configGlobalDestaque)
    }
    
    // Se não tem config individual, buscar configuração da categoria
    const { data: configCategoria } = await getCategoriaProdutosRelacionados(categoriaId)

    // Priorizar: config individual > config global destaque > config categoria
    const config = configIndividual?.id 
      ? configIndividual 
      : (configGlobalDestaque?.id ? configGlobalDestaque : configCategoria)

    console.log('[getProdutosRelacionados] Config individual:', configIndividual)
    console.log('[getProdutosRelacionados] Config global destaque:', configGlobalDestaque)
    console.log('[getProdutosRelacionados] Config categoria:', configCategoria)
    console.log('[getProdutosRelacionados] Config final usada:', config)

    if (!config) {
      console.log('[getProdutosRelacionados] Sem config, retornando vazio')
      return { data: [], error: null }
    }

    // Buscar informações da categoria atual
    const { data: categoriaAtual } = await (supabase as any)
      .from('categorias')
      .select('nome')
      .eq('id', categoriaId)
      .single()

    console.log('[getProdutosRelacionados] Categoria atual:', categoriaAtual)

    let produtosRelacionados: any[] = []

    // Se tem produtos selecionados manualmente e não é auto_select, priorizar manual
    if (!config.auto_select && config.produtos_selecionados.length > 0) {
      // Buscar produtos selecionados manualmente
      const { data: produtosManuais } = await (supabase as any)
        .from('produtos')
        .select('*, categoria:categorias(id, nome, slug)')
        .in('id', config.produtos_selecionados)
        .eq('ativo', true)
        .is('deleted_at', null)
        .neq('id', produtoId)

      if (produtosManuais && produtosManuais.length > 0) {
        produtosRelacionados = produtosManuais
      }
    }

    // Se não tem produtos suficientes, complementar com seleção automática inteligente
    if (produtosRelacionados.length < limit) {
      const needed = limit - produtosRelacionados.length
      const existingIds = produtosRelacionados.map((p: any) => p.id)

      // Buscar todas as categorias
      const { data: todasCategorias } = await (supabase as any)
        .from('categorias')
        .select('id, nome')
        .eq('ativo', true)

      if (todasCategorias && categoriaAtual) {
        // Determinar categorias relacionadas
        const palavrasChave = getCategoriasRelacionadas(categoriaAtual.nome)

        // Filtrar categorias que contenham as palavras-chave
        const categoriasRelacionadas = todasCategorias.filter((cat: any) =>
          palavrasChave.some((palavra) => cat.nome.toLowerCase().includes(palavra))
        )

        const categoriasIds = categoriasRelacionadas.map((c: any) => c.id)

        // Se temos categorias relacionadas, buscar produtos delas
        if (categoriasIds.length > 0) {
          let query = (supabase as any)
            .from('produtos')
            .select('*, categoria:categorias(id, nome, slug)')
            .in('categoria_id', categoriasIds)
            .eq('ativo', true)
            .is('deleted_at', null)
            .neq('id', produtoId)

          // Excluir produtos já selecionados
          if (existingIds.length > 0) {
            query = query.not('id', 'in', `(${existingIds.join(',')})`)
          }

          const { data: produtosAuto } = await query.limit(needed * 5)

          if (produtosAuto && produtosAuto.length > 0) {
            // Usar ordem aleatória como seed para consistência
            const seed = configGlobal?.ordem_aleatoria || 0
            const shuffled = produtosAuto.sort((a: any, b: any) => {
              // Usar IDs + seed para gerar ordem determinística mas que muda com seed
              const hashA = (a.id.charCodeAt(0) + seed) % 100
              const hashB = (b.id.charCodeAt(0) + seed) % 100
              return hashA - hashB
            })
            produtosRelacionados = [...produtosRelacionados, ...shuffled.slice(0, needed)]
          }
        }

        // Se ainda não tem produtos suficientes, buscar qualquer produto (exceto da mesma categoria)
        if (produtosRelacionados.length < limit) {
          const stillNeeded = limit - produtosRelacionados.length
          const allExistingIds = produtosRelacionados.map((p: any) => p.id)

          let fallbackQuery = (supabase as any)
            .from('produtos')
            .select('*, categoria:categorias(id, nome, slug)')
            .eq('ativo', true)
            .is('deleted_at', null)
            .neq('id', produtoId)
            .neq('categoria_id', categoriaId)

          if (allExistingIds.length > 0) {
            fallbackQuery = fallbackQuery.not('id', 'in', `(${allExistingIds.join(',')})`)
          }

          const { data: produtosFallback } = await fallbackQuery.limit(stillNeeded * 3)

          if (produtosFallback && produtosFallback.length > 0) {
            // Usar seed consistente
            const seed = configGlobal?.ordem_aleatoria || 0
            const shuffled = produtosFallback.sort((a: any, b: any) => {
              const hashA = (a.id.charCodeAt(0) + seed) % 100
              const hashB = (b.id.charCodeAt(0) + seed) % 100
              return hashA - hashB
            })
            produtosRelacionados = [...produtosRelacionados, ...shuffled.slice(0, stillNeeded)]
          }
        }
      }
    }

    // Aplicar desconto consistente para cada produto
    // O desconto será sempre o mesmo para o mesmo produto + configuração
    const produtosComDesconto = produtosRelacionados.slice(0, limit).map((produto) => {
      // Criar seed único baseado no ID do produto + config (para mudar quando config mudar)
      const seed = `${produto.id}-${config.desconto_min}-${config.desconto_max}`
      const descontoConsistente = gerarDescontoConsistente(seed, config.desconto_min, config.desconto_max)
      
      return {
        ...produto,
        preco_original: produto.preco,
        preco_com_desconto: produto.preco * (1 - descontoConsistente / 100),
        desconto_percentual: descontoConsistente,
      }
    })

    console.log(
      '[getProdutosRelacionados] Retornando',
      produtosComDesconto.length,
      'produtos relacionados'
    )

    return { data: produtosComDesconto, error: null }
  } catch (error) {
    console.error('[getProdutosRelacionados] Erro:', error)
    if (error instanceof Error) {
      return { data: null, error: error.message }
    }
    return { data: null, error: 'Erro ao buscar produtos relacionados' }
  }
}
