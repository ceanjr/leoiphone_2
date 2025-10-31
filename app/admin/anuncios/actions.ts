'use server'

import { createClient } from '@/lib/supabase/server'
import { FacebookGraphAPI, produtoToFacebookProduct } from '@/lib/facebook/graph-api'
import { revalidatePath } from 'next/cache'
import type { CriarAnuncioInput, AtualizarAnuncioInput, FacebookConfig } from '@/types/facebook'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://leoiphone.com.br'

/**
 * Buscar configuração do Facebook
 */
async function getConfig(): Promise<FacebookConfig | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase.from('facebook_config') as any).select('*').single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Criar cliente da API do Facebook
 */
async function createFacebookClient(): Promise<FacebookGraphAPI | null> {
  const config = await getConfig()

  if (!config || !config.sync_enabled) {
    throw new Error('Integração com Facebook não está configurada ou ativa')
  }

  return new FacebookGraphAPI(config.access_token, config.catalog_id)
}

/**
 * Criar anúncio no Facebook Marketplace
 */
export async function criarAnuncio(input: CriarAnuncioInput) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Não autorizado' }
    }

    // Buscar produto
    const { data: produto, error: produtoError } = await (supabase
      .from('produtos')
      .select('*')
      .eq('id', input.produto_id)
      .single() as any)

    if (produtoError || !produto) {
      return { success: false, error: 'Produto não encontrado' }
    }

    // Verificar se já existe anúncio para este produto
    const { data: anuncioExistente } = await supabase
      .from('facebook_anuncios')
      .select('id, status')
      .eq('produto_id', input.produto_id)
      .maybeSingle()

    if (anuncioExistente && (anuncioExistente as any).status === 'anunciado') {
      return { success: false, error: 'Este produto já está anunciado no Facebook' }
    }

    // Criar cliente Facebook
    const fbClient = await createFacebookClient()
    if (!fbClient) {
      return { success: false, error: 'Cliente Facebook não configurado' }
    }

    // Converter produto para formato Facebook
    const fbProduct = produtoToFacebookProduct(produto, SITE_URL)

    // Criar produto no Facebook
    const fbResponse = await fbClient.createProduct(fbProduct)

    if (fbResponse.error) {
      // Salvar erro no banco
      await (supabase.from('facebook_anuncios') as any).insert({
        produto_id: input.produto_id,
        titulo: input.titulo || produto.nome,
        descricao: input.descricao || produto.descricao,
        preco: produto.preco,
        url_imagem: produto.foto_principal,
        condicao: produto.condicao === 'novo' ? 'new' : 'used',
        status: 'erro',
        erro_mensagem: fbResponse.error.message,
      })

      // Log de erro
      await (supabase.from('facebook_sync_log') as any).insert({
        acao: 'criar',
        status: 'erro',
        mensagem: fbResponse.error.message,
        request_payload: fbProduct,
        response_data: fbResponse,
      })

      return {
        success: false,
        error: `Erro do Facebook: ${fbResponse.error.message}`,
      }
    }

    // Sucesso - Salvar anúncio no banco
    const { data: anuncio, error: anuncioError } = await (supabase
      .from('facebook_anuncios') as any)
      .insert({
        produto_id: input.produto_id,
        facebook_product_id: fbResponse.id,
        facebook_catalog_id: (await getConfig())?.catalog_id,
        titulo: input.titulo || produto.nome,
        descricao: input.descricao || produto.descricao,
        preco: produto.preco,
        url_imagem: produto.foto_principal,
        condicao: produto.condicao === 'novo' ? 'new' : 'used',
        disponibilidade: produto.estoque > 0 ? 'in stock' : 'out of stock',
        status: 'anunciado',
        sincronizado_em: new Date().toISOString(),
      })
      .select()
      .single()

    if (anuncioError) {
      return { success: false, error: 'Erro ao salvar anúncio no banco de dados' }
    }

    // Log de sucesso
    await (supabase.from('facebook_sync_log') as any).insert({
      anuncio_id: anuncio.id,
      acao: 'criar',
      status: 'sucesso',
      mensagem: 'Anúncio criado com sucesso',
      request_payload: fbProduct,
      response_data: fbResponse,
    })

    revalidatePath('/admin/anuncios')

    return {
      success: true,
      data: anuncio,
      message: 'Anúncio criado com sucesso no Facebook Marketplace!',
    }
  } catch (error: any) {
    console.error('Erro ao criar anúncio:', error)
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao criar anúncio',
    }
  }
}

/**
 * Atualizar anúncio existente
 */
export async function atualizarAnuncio(input: AtualizarAnuncioInput) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Não autorizado' }
    }

    // Buscar anúncio
    const { data: anuncio, error: anuncioError } = await (supabase
      .from('facebook_anuncios')
      .select('*')
      .eq('id', input.anuncio_id)
      .single() as any)

    if (anuncioError || !anuncio) {
      return { success: false, error: 'Anúncio não encontrado' }
    }

    if (!anuncio.facebook_product_id) {
      return { success: false, error: 'Anúncio não tem ID do Facebook' }
    }

    // Criar cliente Facebook
    const fbClient = await createFacebookClient()
    if (!fbClient) {
      return { success: false, error: 'Cliente Facebook não configurado' }
    }

    // Preparar atualizações
    const updates: any = {}
    if (input.titulo) updates.name = input.titulo
    if (input.descricao) updates.description = input.descricao
    if (input.preco) updates.price = input.preco
    if (input.disponibilidade) updates.availability = input.disponibilidade

    // Atualizar no Facebook
    const fbResponse = await fbClient.updateProduct(anuncio.facebook_product_id, updates)

    if (fbResponse.error) {
      await (supabase.from('facebook_sync_log') as any).insert({
        anuncio_id: input.anuncio_id,
        acao: 'atualizar',
        status: 'erro',
        mensagem: fbResponse.error.message,
        request_payload: updates,
        response_data: fbResponse,
      })

      return { success: false, error: `Erro do Facebook: ${fbResponse.error.message}` }
    }

    // Atualizar no banco local
    const localUpdates: any = { sincronizado_em: new Date().toISOString() }
    if (input.titulo) localUpdates.titulo = input.titulo
    if (input.descricao) localUpdates.descricao = input.descricao
    if (input.preco) localUpdates.preco = input.preco
    if (input.disponibilidade) localUpdates.disponibilidade = input.disponibilidade

    await (supabase.from('facebook_anuncios') as any).update(localUpdates).eq('id', input.anuncio_id)

    // Log de sucesso
    await (supabase.from('facebook_sync_log') as any).insert({
      anuncio_id: input.anuncio_id,
      acao: 'atualizar',
      status: 'sucesso',
      mensagem: 'Anúncio atualizado com sucesso',
      request_payload: updates,
      response_data: fbResponse,
    })

    revalidatePath('/admin/anuncios')

    return { success: true, message: 'Anúncio atualizado com sucesso!' }
  } catch (error: any) {
    console.error('Erro ao atualizar anúncio:', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}

/**
 * Remover anúncio do Facebook
 */
export async function removerAnuncio(anuncioId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Não autorizado' }
    }

    // Buscar anúncio
    const { data: anuncio } = await (supabase.from('facebook_anuncios') as any).select('*').eq('id', anuncioId).single()

    if (!anuncio || !anuncio.facebook_product_id) {
      return { success: false, error: 'Anúncio não encontrado' }
    }

    // Criar cliente Facebook
    const fbClient = await createFacebookClient()
    if (!fbClient) {
      return { success: false, error: 'Cliente Facebook não configurado' }
    }

    // Remover do Facebook
    const fbResponse = await fbClient.deleteProduct(anuncio.facebook_product_id)

    if (fbResponse.error) {
      return { success: false, error: `Erro do Facebook: ${fbResponse.error.message}` }
    }

    // Atualizar status local
    await (supabase.from('facebook_anuncios') as any).update({ status: 'removido' }).eq('id', anuncioId)

    // Log
    await (supabase.from('facebook_sync_log') as any).insert({
      anuncio_id: anuncioId,
      acao: 'remover',
      status: 'sucesso',
      mensagem: 'Anúncio removido do Facebook',
      response_data: fbResponse,
    })

    revalidatePath('/admin/anuncios')

    return { success: true, message: 'Anúncio removido do Facebook!' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}

/**
 * Listar todos os anúncios
 */
export async function listarAnuncios() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from('v_anuncios_facebook_com_produto').select('*').order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Buscar produtos disponíveis para anunciar
 */
export async function buscarProdutosDisponiveis(busca?: string) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('produtos')
      .select('id, codigo_produto, nome, slug, preco, foto_principal, estoque, ativo')
      .eq('ativo', true)
      .is('deleted_at', null)

    // Excluir produtos já anunciados
    const { data: anunciados } = await (supabase.from('facebook_anuncios') as any).select('produto_id').in('status', ['anunciado', 'pendente'])

    if (anunciados && anunciados.length > 0) {
      const idsAnunciados = anunciados.map((a: any) => a.produto_id)
      query = query.not('id', 'in', `(${idsAnunciados.join(',')})`)
    }

    // Aplicar busca
    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,codigo_produto.ilike.%${busca}%`)
    }

    const { data, error } = await query.limit(20)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Salvar configuração do Facebook
 */
export async function salvarConfig(config: Partial<FacebookConfig>) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Não autorizado' }
    }

    // Verificar se já existe configuração
    const { data: existing } = await (supabase.from('facebook_config') as any).select('id').single()

    if (existing) {
      // Atualizar
      const { error } = await (supabase.from('facebook_config') as any).update(config).eq('id', existing.id)

      if (error) {
        return { success: false, error: error.message }
      }
    } else {
      // Criar
      const { error } = await (supabase.from('facebook_config') as any).insert(config)

      if (error) {
        return { success: false, error: error.message }
      }
    }

    revalidatePath('/admin/anuncios')

    return { success: true, message: 'Configuração salva com sucesso!' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Buscar configuração
 */
export async function buscarConfig() {
  try {
    const config = await getConfig()
    return { success: true, data: config }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
