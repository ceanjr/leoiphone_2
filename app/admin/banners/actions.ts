'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getBanners() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('ordem', { ascending: true })

  if (error) {
    console.error('Erro ao buscar banners:', error)
    return { banners: [], error: 'Erro ao carregar banners' }
  }

  return { banners: data || [], error: null }
}

export async function createBanner(data: {
  titulo: string
  subtitulo?: string
  link?: string
  imagem_url: string
  tipo: 'banner' | 'produtos_destaque'
  produtos_destaque?: Array<{ produto_id: string; preco_promocional: number }>
  countdown_ends_at?: string | null
  ativo?: boolean
}) {
  const supabase = await createClient()

  if (!data.titulo || data.titulo.trim().length < 2) {
    return { success: false, error: 'Título é obrigatório (mínimo 2 caracteres)' }
  }

  if (data.tipo === 'banner' && !data.imagem_url) {
    return { success: false, error: 'Imagem é obrigatória para banner tipo imagem' }
  }

  if (data.tipo === 'produtos_destaque' && (!data.produtos_destaque || data.produtos_destaque.length === 0)) {
    return { success: false, error: 'Selecione pelo menos 1 produto para destaque' }
  }

  // Buscar a maior ordem existente
  const { data: banners } = await supabase
    .from('banners')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)

  // @ts-ignore
  const novaOrdem = banners && banners.length > 0 ? (banners[0].ordem || 0) + 1 : 1

  const { data: banner, error } = await (supabase as any)
    .from('banners')
    .insert({
      titulo: data.titulo.trim(),
      subtitulo: data.subtitulo?.trim() || null,
      link: data.link?.trim() || null,
      tipo_link: 'externo',
      imagem_url: data.imagem_url || null,
      tipo: data.tipo,
      produtos_destaque: data.produtos_destaque || [],
      countdown_ends_at: data.countdown_ends_at || null,
      ativo: data.ativo ?? true,
      ordem: novaOrdem,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar banner:', error)
    console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
    return { success: false, error: `Erro ao criar banner: ${error.message || 'Erro desconhecido'}` }
  }

  revalidatePath('/admin/banners')
  revalidatePath('/')
  return { success: true, banner }
}

export async function updateBanner(
  id: string,
  data: {
    titulo: string
    subtitulo?: string
    link?: string
    imagem_url: string
    tipo: 'banner' | 'produtos_destaque'
    produtos_destaque?: Array<{ produto_id: string; preco_promocional: number }>
    countdown_ends_at?: string | null
    ativo?: boolean
  }
) {
  const supabase = await createClient()

  if (!data.titulo || data.titulo.trim().length < 2) {
    return { success: false, error: 'Título é obrigatório (mínimo 2 caracteres)' }
  }

  if (data.tipo === 'banner' && !data.imagem_url) {
    return { success: false, error: 'Imagem é obrigatória para banner tipo imagem' }
  }

  const { error } = await (supabase as any)
    .from('banners')
    .update({
      titulo: data.titulo.trim(),
      subtitulo: data.subtitulo?.trim() || null,
      link: data.link?.trim() || null,
      tipo_link: 'externo',
      imagem_url: data.imagem_url || null,
      tipo: data.tipo,
      produtos_destaque: data.produtos_destaque || [],
      countdown_ends_at: data.countdown_ends_at || null,
      ativo: data.ativo ?? true,
    })
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar banner:', error)
    return { success: false, error: 'Erro ao atualizar banner' }
  }

  revalidatePath('/admin/banners')
  revalidatePath('/')
  return { success: true }
}

export async function deleteBanner(id: string) {
  const supabase = await createClient()

  const { error } = await (supabase as any).from('banners').delete().eq('id', id)

  if (error) {
    console.error('Erro ao deletar banner:', error)
    return { success: false, error: 'Erro ao deletar banner' }
  }

  revalidatePath('/admin/banners')
  revalidatePath('/')
  return { success: true }
}

export async function updateOrdemBanner(id: string, novaOrdem: number) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('banners')
    .update({ ordem: novaOrdem })
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar ordem:', error)
    return { success: false, error: 'Erro ao atualizar ordem' }
  }

  revalidatePath('/admin/banners')
  revalidatePath('/')
  return { success: true }
}

export async function toggleBannerAtivo(id: string, ativo: boolean) {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('banners')
    .update({ ativo })
    .eq('id', id)

  if (error) {
    console.error('Erro ao alterar status do banner:', error)
    return { success: false, error: 'Erro ao alterar status' }
  }

  revalidatePath('/admin/banners')
  revalidatePath('/')
  return { success: true }
}
