'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { produtoSchema } from '@/lib/validations/produto'
import type { ProdutoFormData } from '@/types/produto'

function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function getProdutos() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('produtos')
    .select(`id, codigo_produto, nome, slug, descricao, preco, nivel_bateria, condicao, categoria_id, garantia, acessorios, fotos, foto_principal, ativo, estoque, visualizacoes_total, created_at, updated_at, deleted_at, cor_oficial, categoria:categorias(id, nome, slug, ordem)`)
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
    .select(`id, codigo_produto, nome, slug, descricao, preco, nivel_bateria, condicao, categoria_id, garantia, acessorios, fotos, foto_principal, ativo, estoque, visualizacoes_total, created_at, updated_at, deleted_at, cor_oficial, categoria:categorias(id, nome, slug, ordem)`)
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

  // Inserir produto
  const { data: produto, error } = await (supabase as any)
    .from('produtos')
    .insert({
      ...validatedData.data,
      slug,
      foto_principal: validatedData.data.fotos[0] || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar produto:', error)
    return {
      success: false,
      error: 'Erro ao criar produto',
    }
  }

  revalidatePath('/admin/produtos')
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

  // Gerar slug
  const slug = generateSlug(validatedData.data.nome)

  // Atualizar produto
  const { data: produto, error } = await (supabase as any)
    .from('produtos')
    .update({
      ...validatedData.data,
      slug,
      foto_principal: validatedData.data.fotos[0] || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar produto:', error)
    return {
      success: false,
      error: 'Erro ao atualizar produto',
    }
  }

  revalidatePath('/admin/produtos')
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
