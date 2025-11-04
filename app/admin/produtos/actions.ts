'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { produtoSchema } from '@/lib/validations/produto'
import type { ProdutoFormData } from '@/types/produto'

function generateSlug(nome: string): string {
  const baseSlug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  // Adicionar sufixo aleatório para garantir unicidade (importante para rotas)
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${baseSlug}-${randomSuffix}`
}

export async function getProdutos() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('produtos')
    .select(`id, codigo_produto, nome, slug, descricao, preco, nivel_bateria, condicao, categoria_id, garantia, cor_oficial, cores, acessorios, fotos, foto_principal, ativo, estoque, visualizacoes_total, created_at, updated_at, deleted_at, categoria:categorias(id, nome, slug, ordem)`)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar produtos:', error)
    return { produtos: [], error: 'Erro ao carregar produtos' }
  }

  return { produtos: data || [], error: null }
}

export async function getProdutoById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('produtos')
    .select(`id, codigo_produto, nome, slug, descricao, preco, nivel_bateria, condicao, categoria_id, garantia, cor_oficial, cores, acessorios, fotos, foto_principal, ativo, estoque, visualizacoes_total, created_at, updated_at, deleted_at, categoria:categorias(id, nome, slug, ordem)`)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Erro ao buscar produto:', error)
    return { produto: null, error: 'Produto não encontrado' }
  }

  return { produto: data, error: null }
}

export async function createProduto(data: ProdutoFormData) {
  const supabase = await createClient()

  // Validar dados
  const validatedData = produtoSchema.safeParse(data)

  if (!validatedData.success) {
    const firstError = validatedData.error.issues[0]?.message
    return {
      success: false,
      error: firstError || 'Dados inválidos',
    }
  }

  // Gerar slug
  const slug = generateSlug(validatedData.data.nome)

  // Preparar dados para inserção
  const insertData: any = {
    ...validatedData.data,
    slug,
    foto_principal: validatedData.data.fotos[0] || null,
  }

  // Garantir que cores seja um array (vazio ou com valores)
  if (!insertData.cores) {
    insertData.cores = []
  }

  // Debug: ver o que está sendo inserido
  if (process.env.NODE_ENV === 'development') {
    console.log('[createProduto] Inserindo:', {
      nome: insertData.nome,
      cores: insertData.cores,
      cor_oficial: insertData.cor_oficial
    })
  }

  // Inserir produto
  const { data: produto, error } = await (supabase as any)
    .from('produtos')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('❌ Erro ao criar produto:', error)
    return {
      success: false,
      error: error.message || 'Erro ao criar produto',
    }
  }

  // Debug: ver o que foi inserido
  if (process.env.NODE_ENV === 'development') {
    console.log('[createProduto] Produto criado:', {
      id: produto.id,
      nome: produto.nome,
      cores: produto.cores,
      cor_oficial: produto.cor_oficial
    })
  }

  // Revalidar páginas admin e públicas
  revalidatePath('/admin/produtos', 'page')
  revalidatePath('/', 'layout') // Revalidar layout inteiro para pegar mudanças em todos os lugares
  revalidatePath(`/produto/${slug}`, 'page') // Revalidar página específica do produto

  return {
    success: true,
    produto,
  }
}

export async function updateProduto(id: string, data: ProdutoFormData) {
  const supabase = await createClient()

  // Validar dados
  const validatedData = produtoSchema.safeParse(data)

  if (!validatedData.success) {
    const firstError = validatedData.error.issues[0]?.message
    return {
      success: false,
      error: firstError || 'Dados inválidos',
    }
  }

  // Buscar produto existente para manter o slug
  const { data: produtoExistente } = await (supabase as any)
    .from('produtos')
    .select('slug')
    .eq('id', id)
    .single()

  // Manter slug existente ou gerar novo se não existir
  const slug = produtoExistente?.slug || generateSlug(validatedData.data.nome)

  // Preparar dados para atualização
  const updateData: any = {
    ...validatedData.data,
    slug,
    foto_principal: validatedData.data.fotos[0] || null,
    updated_at: new Date().toISOString(),
  }

  // Garantir que campos opcionais vazios sejam null (não undefined)
  // Isso força o Supabase a atualizar o campo para null
  if (updateData.descricao === undefined || updateData.descricao === '') {
    updateData.descricao = null
  }
  if (updateData.codigo_produto === undefined || updateData.codigo_produto === '') {
    updateData.codigo_produto = null
  }
  if (updateData.nivel_bateria === undefined) {
    updateData.nivel_bateria = null
  }

  // Garantir que cores seja um array (vazio ou com valores)
  // Isso permite remover todas as cores ao editar
  if (!updateData.cores) {
    updateData.cores = []
  }

  // Debug: ver o que está sendo atualizado
  if (process.env.NODE_ENV === 'development') {
    console.log('[updateProduto] Atualizando produto:', {
      id,
      nome: updateData.nome,
      slug: updateData.slug,
      cores: updateData.cores,
      ativo: updateData.ativo,
      estoque: updateData.estoque,
      preco: updateData.preco,
      fotos_count: updateData.fotos?.length || 0,
    })
  }

  // Atualizar produto
  const { data: produto, error } = await (supabase as any)
    .from('produtos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('❌ Erro ao atualizar produto:', {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      id,
      updateData: {
        nome: updateData.nome,
        ativo: updateData.ativo,
        estoque: updateData.estoque,
      }
    })
    return {
      success: false,
      error: error.message || 'Erro ao atualizar produto',
    }
  }

  // Debug: ver o que foi atualizado
  if (process.env.NODE_ENV === 'development') {
    console.log('[updateProduto] Produto atualizado:', {
      id: produto.id,
      nome: produto.nome,
      cores: produto.cores,
      cor_oficial: produto.cor_oficial
    })
  }

  // Revalidar páginas admin e públicas
  revalidatePath('/admin/produtos', 'page')
  revalidatePath('/', 'layout') // Revalidar layout inteiro para pegar mudanças em todos os lugares
  revalidatePath(`/produto/${slug}`, 'page') // Revalidar página específica do produto

  return {
    success: true,
    produto,
  }
}

export async function deleteProduto(id: string) {
  const supabase = await createClient()

  // Soft delete
  const { error } = await (supabase as any)
    .from('produtos')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar produto:', error)
    return {
      success: false,
      error: 'Erro ao deletar produto',
    }
  }

  revalidatePath('/admin/produtos')
  return {
    success: true,
  }
}

export async function updateProdutoPreco(id: string, preco: number) {
  const supabase = await createClient()

  if (!Number.isFinite(preco) || preco <= 0) {
    return {
      success: false,
      error: 'Preço inválido',
    }
  }

  const { error } = await (supabase as any)
    .from('produtos')
    .update({
      preco,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar preço do produto:', error)
    return {
      success: false,
      error: 'Erro ao atualizar preço',
    }
  }

  revalidatePath('/admin/produtos')
  return {
    success: true,
    preco,
  }
}

export async function toggleProdutoAtivo(id: string, ativo: boolean) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('produtos')
    .update({
      ativo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Erro ao alterar status do produto:', error)
    return {
      success: false,
      error: 'Erro ao alterar status',
    }
  }

  revalidatePath('/admin/produtos')
  return {
    success: true,
  }
}

export async function getCategorias() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  if (error) {
    console.error('Erro ao buscar categorias:', error)
    return { categorias: [], error: 'Erro ao carregar categorias' }
  }

  return { categorias: data || [], error: null }
}
