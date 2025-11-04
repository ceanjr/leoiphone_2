'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

export async function getCategorias() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('ordem', { ascending: true })

  if (error) {
    console.error('Erro ao buscar categorias:', error)
    return { categorias: [], error: 'Erro ao carregar categorias' }
  }

  return { categorias: data || [], error: null }
}

export async function createCategoria(data: { nome: string; descricao?: string; ativo?: boolean }) {
  const supabase = await createClient()

  if (!data.nome || data.nome.trim().length < 2) {
    return { success: false, error: 'Nome da categoria é obrigatório (mínimo 2 caracteres)' }
  }

  // Verificar se já existe
  const { data: existing } = await supabase
    .from('categorias')
    .select('id')
    .eq('nome', data.nome.trim())
    .single()

  if (existing) {
    return { success: false, error: 'Já existe uma categoria com este nome' }
  }

  // Buscar a maior ordem existente
  const { data: maxOrdem } = await supabase
    .from('categorias')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
    .single()

  // @ts-ignore
  const novaOrdem = (maxOrdem?.ordem || 0) + 1

  const slug = generateSlug(data.nome)

  const { data: categoria, error } = await (supabase as any)
    .from('categorias')
    .insert({
      nome: data.nome.trim(),
      slug,
      descricao: data.descricao?.trim() || null,
      ativo: data.ativo ?? true,
      ordem: novaOrdem,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar categoria:', error)
    return { success: false, error: 'Erro ao criar categoria' }
  }

  revalidatePath('/admin/categorias')
  return { success: true, categoria }
}

export async function updateCategoria(id: string, data: { nome: string; descricao?: string; ativo?: boolean }) {
  const supabase = await createClient()

  if (!data.nome || data.nome.trim().length < 2) {
    return { success: false, error: 'Nome da categoria é obrigatório (mínimo 2 caracteres)' }
  }

  // Verificar se já existe outra categoria com o mesmo nome
  const { data: existing } = await supabase
    .from('categorias')
    .select('id')
    .eq('nome', data.nome.trim())
    .neq('id', id)
    .single()

  if (existing) {
    return { success: false, error: 'Já existe uma categoria com este nome' }
  }

  const slug = generateSlug(data.nome)

  const { error } = await (supabase as any)
    .from('categorias')
    .update({
      nome: data.nome.trim(),
      slug,
      descricao: data.descricao?.trim() || null,
      ativo: data.ativo ?? true,
    })
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar categoria:', error)
    return { success: false, error: 'Erro ao atualizar categoria' }
  }

  revalidatePath('/admin/categorias')
  return { success: true }
}

export async function deleteCategoria(id: string) {
  const supabase = await createClient()

  // Verificar se há produtos usando esta categoria
  const { count } = await supabase
    .from('produtos')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', id)
    .is('deleted_at', null)

  if (count && count > 0) {
    return { success: false, error: `Não é possível excluir. Existem ${count} produto(s) usando esta categoria.` }
  }

  const { error } = await (supabase as any)
    .from('categorias')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar categoria:', error)
    return { success: false, error: 'Erro ao deletar categoria' }
  }

  revalidatePath('/admin/categorias')
  return { success: true }
}

export async function updateOrdemCategoria(id: string, novaOrdem: number) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('categorias')
    .update({ ordem: novaOrdem })
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar ordem:', error)
    return { success: false, error: 'Erro ao atualizar ordem' }
  }

  revalidatePath('/admin/categorias')
  return { success: true }
}

export async function toggleCategoriaAtivo(id: string, ativo: boolean) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('categorias')
    .update({ ativo })
    .eq('id', id)

  if (error) {
    console.error('Erro ao alterar status da categoria:', error)
    return { success: false, error: 'Erro ao alterar status' }
  }

  revalidatePath('/admin/categorias')
  return { success: true }
}
