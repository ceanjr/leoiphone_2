'use server'

import { createClient } from '@/lib/supabase/server'
import { produtoCustoSchema } from '@/lib/validations/produto'
import type { ProdutoCusto, ProdutoCustoFormData } from '@/types/produto'

/**
 * Busca todos os custos de um produto específico
 */
export async function getProdutoCustos(produtoId: string): Promise<{ data: ProdutoCusto[] | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('produtos_custos')
      .select('*')
      .eq('produto_id', produtoId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar custos do produto:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erro ao buscar custos do produto:', error)
    return { data: null, error: 'Erro ao buscar custos do produto' }
  }
}

/**
 * Cria um novo custo para um produto
 */
export async function createProdutoCusto(
  produtoId: string,
  custoData: ProdutoCustoFormData
): Promise<{ data: ProdutoCusto | null; error: string | null }> {
  try {
    // Validar dados
    const validated = produtoCustoSchema.parse(custoData)

    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('produtos_custos')
      .insert({
        produto_id: produtoId,
        custo: validated.custo,
        estoque: validated.estoque,
        codigo: validated.codigo || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar custo do produto:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erro ao criar custo do produto:', error)
    if (error instanceof Error) {
      return { data: null, error: error.message }
    }
    return { data: null, error: 'Erro ao criar custo do produto' }
  }
}

/**
 * Atualiza um custo existente
 */
export async function updateProdutoCusto(
  custoId: string,
  custoData: Partial<ProdutoCustoFormData>
): Promise<{ data: ProdutoCusto | null; error: string | null }> {
  try {
    // Validar dados parcialmente
    const validated = produtoCustoSchema.partial().parse(custoData)

    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    if (validated.custo !== undefined) updateData.custo = validated.custo
    if (validated.estoque !== undefined) updateData.estoque = validated.estoque
    if (validated.codigo !== undefined) updateData.codigo = validated.codigo || null

    const { data, error } = await (supabase as any)
      .from('produtos_custos')
      .update(updateData)
      .eq('id', custoId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar custo do produto:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erro ao atualizar custo do produto:', error)
    if (error instanceof Error) {
      return { data: null, error: error.message }
    }
    return { data: null, error: 'Erro ao atualizar custo do produto' }
  }
}

/**
 * Deleta um custo
 */
export async function deleteProdutoCusto(custoId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('produtos_custos')
      .delete()
      .eq('id', custoId)

    if (error) {
      console.error('Erro ao deletar custo do produto:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Erro ao deletar custo do produto:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erro ao deletar custo do produto' }
  }
}

/**
 * Cria múltiplos custos para um produto de uma vez
 */
export async function createProdutosCustosEmLote(
  produtoId: string,
  custosData: ProdutoCustoFormData[]
): Promise<{ data: ProdutoCusto[] | null; error: string | null }> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[createProdutosCustosEmLote] Iniciando validação:', custosData)
    }

    // Validar todos os custos
    const validated = custosData.map((custo) => produtoCustoSchema.parse(custo))

    if (process.env.NODE_ENV === 'development') {
      console.log('[createProdutosCustosEmLote] Custos validados:', validated)
    }

    const supabase = await createClient()

    const insertData = validated.map((custo) => ({
      produto_id: produtoId,
      custo: custo.custo,
      estoque: custo.estoque,
      codigo: custo.codigo || null,
    }))

    if (process.env.NODE_ENV === 'development') {
      console.log('[createProdutosCustosEmLote] Dados para inserir:', insertData)
    }

    const { data, error } = await (supabase as any)
      .from('produtos_custos')
      .insert(insertData)
      .select()

    if (error) {
      console.error('❌ Erro ao criar custos em lote:', error)
      return { data: null, error: error.message }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Custos inseridos no banco:', data)
    }

    return { data, error: null }
  } catch (error) {
    console.error('❌ Erro ao criar custos em lote:', error)
    if (error instanceof Error) {
      return { data: null, error: error.message }
    }
    return { data: null, error: 'Erro ao criar custos em lote' }
  }
}

/**
 * Substitui todos os custos de um produto (deleta existentes e cria novos)
 */
export async function substituirProdutoCustos(
  produtoId: string,
  novosCustos: ProdutoCustoFormData[]
): Promise<{ data: ProdutoCusto[] | null; error: string | null }> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[substituirProdutoCustos] Iniciando:', {
        produtoId,
        quantidadeCustos: novosCustos.length,
        custos: novosCustos,
      })
    }

    const supabase = await createClient()

    // Deletar custos existentes
    const { error: deleteError } = await (supabase as any)
      .from('produtos_custos')
      .delete()
      .eq('produto_id', produtoId)

    if (deleteError) {
      console.error('❌ Erro ao deletar custos existentes:', deleteError)
      return { data: null, error: deleteError.message }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Custos existentes deletados com sucesso')
    }

    // Se não há novos custos, retornar array vazio
    if (novosCustos.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('ℹ️ Nenhum custo novo para adicionar')
      }
      return { data: [], error: null }
    }

    // Criar novos custos
    const result = await createProdutosCustosEmLote(produtoId, novosCustos)

    if (process.env.NODE_ENV === 'development') {
      if (result.error) {
        console.error('❌ Erro ao criar novos custos:', result.error)
      } else {
        console.log('✅ Novos custos criados com sucesso:', result.data)
      }
    }

    return result
  } catch (error) {
    console.error('❌ Erro ao substituir custos do produto:', error)
    if (error instanceof Error) {
      return { data: null, error: error.message }
    }
    return { data: null, error: 'Erro ao substituir custos do produto' }
  }
}
