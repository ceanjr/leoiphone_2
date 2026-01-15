'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('BannersActions')

export async function getBanners() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('ordem', { ascending: true })

  if (error) {
    logger.error('Erro ao buscar banners:', error)
    return { banners: [], error: 'Erro ao carregar banners' }
  }

  return { banners: data || [], error: null }
}

export async function getBannerById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from('banners').select('*').eq('id', id).single()

  if (error) {
    logger.error('Erro ao buscar banner:', error)
    return { banner: null, error: 'Erro ao carregar banner' }
  }

  return { banner: data, error: null }
}

export async function createBanner(data: {
  titulo: string
  subtitulo?: string
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
    logger.error('Erro ao criar banner:', error)
    logger.error('Detalhes do erro:', JSON.stringify(error, null, 2))
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
      imagem_url: data.imagem_url || null,
      tipo: data.tipo,
      produtos_destaque: data.produtos_destaque || [],
      countdown_ends_at: data.countdown_ends_at || null,
      ativo: data.ativo ?? true,
    })
    .eq('id', id)

  if (error) {
    logger.error('Erro ao atualizar banner:', error)
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
    logger.error('Erro ao deletar banner:', error)
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
    logger.error('Erro ao atualizar ordem:', error)
    return { success: false, error: 'Erro ao atualizar ordem' }
  }

  revalidatePath('/admin/banners')
  revalidatePath('/')
  return { success: true }
}

export async function toggleBannerAtivo(id: string, ativo: boolean) {
  const supabase = await createClient()

  // Se estiver ativando um banner, primeiro desativa todos os outros
  if (ativo) {
    const { error: deactivateError } = await (supabase as any)
      .from('banners')
      .update({ ativo: false })
      .neq('id', id)

    if (deactivateError) {
      logger.error('Erro ao desativar outros banners:', deactivateError)
      return { success: false, error: 'Erro ao desativar outros banners' }
    }
  }

  // Atualiza o banner selecionado
  const { error } = await (supabase as any)
    .from('banners')
    .update({ ativo })
    .eq('id', id)

  if (error) {
    logger.error('Erro ao alterar status do banner:', error)
    return { success: false, error: 'Erro ao alterar status' }
  }

  // Se ativou o banner, move para ordem 1 e ajusta os outros
  if (ativo) {
    // Buscar ordem atual do banner
    const { data: currentBanner } = await supabase
      .from('banners')
      .select('ordem')
      .eq('id', id)
      .single<{ ordem: number }>()

    if (currentBanner && currentBanner.ordem !== 1) {
      // Incrementar ordem de todos os banners com ordem < ordem_atual
      await (supabase as any)
        .from('banners')
        .update({ ordem: supabase.rpc('increment_ordem') as any })
        .lt('ordem', currentBanner.ordem)

      // Mover banner ativado para ordem 1
      await (supabase as any)
        .from('banners')
        .update({ ordem: 1 })
        .eq('id', id)
    }
  }

  revalidatePath('/admin/banners')
  revalidatePath('/')
  return { success: true }
}

/**
 * Desativa automaticamente um banner quando o countdown expira
 * Chamado pelo componente CountdownTimer no client-side
 */
export async function autoDisableBannerOnExpire(bannerId: string) {
  const supabase = await createClient()

  try {
    // Buscar banner para verificar se realmente expirou
    const { data: banner, error: fetchError } = await (supabase as any)
      .from('banners')
      .select('id, ativo, countdown_ends_at')
      .eq('id', bannerId)
      .single()

    if (fetchError || !banner) {
      return { success: false, error: 'Banner não encontrado ou já desativado' }
    }

    if (!banner.ativo || !banner.countdown_ends_at) {
      return { success: false, error: 'Banner não encontrado ou já desativado' }
    }

    // Verificar se realmente expirou
    const now = new Date()
    const expiryDate = new Date(banner.countdown_ends_at)

    if (expiryDate > now) {
      return { success: false, error: 'Countdown ainda não expirou' }
    }

    // Desativar banner
    const { error } = await (supabase as any)
      .from('banners')
      .update({ ativo: false })
      .eq('id', bannerId)

    if (error) {
      logger.error('Erro ao desativar banner expirado:', error)
      return { success: false, error: 'Erro ao desativar banner' }
    }

    logger.info(`Banner ${bannerId} desativado automaticamente (countdown expirado)`)

    revalidatePath('/admin/banners')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    logger.error('Exceção ao desativar banner:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}
