'use server'

import { createClient } from '@/lib/supabase/server'
import { FacebookMarketplaceAPI, produtoToMarketplaceProduct } from '@/lib/api/facebook/graph-api'
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
 * Criar cliente da API do Facebook Marketplace
 */
async function createFacebookClient(): Promise<FacebookMarketplaceAPI | null> {
  const config = await getConfig()

  if (!config || !config.sync_enabled) {
    throw new Error('Integração com Facebook não está configurada ou ativa')
  }

  return new FacebookMarketplaceAPI(config.access_token, config.catalog_id)
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

    // Converter produto para formato Marketplace (com TODAS as fotos)
    const marketplaceProduct = produtoToMarketplaceProduct(produto, SITE_URL)

    // Criar produto no Facebook Marketplace
    const fbResponse = await fbClient.createProduct(marketplaceProduct)

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

      // Log de erro detalhado
      await (supabase.from('facebook_sync_log') as any).insert({
        acao: 'criar_marketplace',
        status: 'erro',
        mensagem: `${fbResponse.error.message} (Code: ${fbResponse.error.code || 'N/A'})`,
        request_payload: marketplaceProduct,
        response_data: fbResponse,
      })

      // Mensagem de erro amigável
      let errorMessage = 'Erro do Facebook: '
      
      if (fbResponse.error.code === 190) {
        errorMessage += 'Token inválido ou expirado. Gere um novo token nas configurações.'
      } else if (fbResponse.error.code === 10) {
        errorMessage += 'Sem permissão para acessar o catálogo. Verifique as configurações.'
      } else if (fbResponse.error.code === 200) {
        errorMessage += 'Sem permissão para criar produtos. Adicione a permissão "catalog_management" ao token.'
      } else if (fbResponse.error.message.includes('API access blocked')) {
        errorMessage += 'API bloqueada. Execute "Diagnosticar" para mais informações.'
      } else {
        errorMessage += fbResponse.error.message
      }

      return {
        success: false,
        error: errorMessage,
        code: fbResponse.error.code,
      }
    }

    // Sucesso - O Facebook retorna "handles" com os IDs criados
    const productId = fbResponse.handles?.[0] || marketplaceProduct.id

    // Salvar anúncio no banco
    const { data: anuncio, error: anuncioError } = await (supabase
      .from('facebook_anuncios') as any)
      .insert({
        produto_id: input.produto_id,
        facebook_product_id: productId,
        facebook_catalog_id: (await getConfig())?.catalog_id,
        titulo: input.titulo || produto.nome,
        descricao: input.descricao || produto.descricao,
        preco: produto.preco,
        url_imagem: produto.foto_principal,
        condicao: produto.condicao === 'novo' ? 'new' : 'used',
        disponibilidade: produto.estoque > 0 ? 'in stock' : 'out of stock',
        status: 'anunciado',
        status_facebook: 'pending_review', // Marketplace inicia em análise
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
      acao: 'criar_marketplace',
      status: 'sucesso',
      mensagem: `Anúncio criado no Marketplace com ${marketplaceProduct.additional_image_link?.length || 0} imagens adicionais`,
      request_payload: marketplaceProduct,
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

    // Preparar atualizações (campos do Marketplace)
    const updates: any = {}
    if (input.titulo) updates.title = input.titulo // Marketplace usa "title"
    if (input.descricao) updates.description = input.descricao
    if (input.preco) updates.price = `${input.preco.toFixed(2)} BRL` // Formato string
    if (input.disponibilidade) updates.availability = input.disponibilidade

    // Atualizar no Facebook Marketplace
    const fbResponse = await fbClient.updateProduct(anuncio.facebook_product_id, updates)

    if (fbResponse.error) {
      await (supabase.from('facebook_sync_log') as any).insert({
        anuncio_id: input.anuncio_id,
        acao: 'atualizar_marketplace',
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
      acao: 'atualizar_marketplace',
      status: 'sucesso',
      mensagem: 'Anúncio atualizado no Marketplace',
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
export async function removerAnuncio(anuncioId: string, forceLocal = false) {
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

    if (!anuncio) {
      return { success: false, error: 'Anúncio não encontrado' }
    }

    // Se forceLocal ou se não tem facebook_product_id, só remove localmente
    if (forceLocal || !anuncio.facebook_product_id) {
      await (supabase.from('facebook_anuncios') as any).delete().eq('id', anuncioId)
      
      await (supabase.from('facebook_sync_log') as any).insert({
        anuncio_id: anuncioId,
        acao: 'remover_local',
        status: 'sucesso',
        mensagem: 'Anúncio removido localmente (sem sincronizar com Facebook)',
      })

      revalidatePath('/admin/anuncios')
      return { success: true, message: 'Anúncio removido!' }
    }

    // Tentar remover do Facebook
    try {
      const fbClient = await createFacebookClient()
      if (!fbClient) {
        // Se não conseguir cliente, remove apenas localmente
        await (supabase.from('facebook_anuncios') as any).delete().eq('id', anuncioId)
        revalidatePath('/admin/anuncios')
        return { success: true, message: 'Anúncio removido localmente!' }
      }

      const fbResponse = await fbClient.deleteProduct(anuncio.facebook_product_id)

      // Se erro do Facebook (API bloqueada), remove localmente mesmo assim
      if (fbResponse.error) {
        await (supabase.from('facebook_anuncios') as any).delete().eq('id', anuncioId)
        
        await (supabase.from('facebook_sync_log') as any).insert({
          anuncio_id: anuncioId,
          acao: 'remover_local',
          status: 'sucesso',
          mensagem: `Anúncio removido localmente (Facebook retornou erro: ${fbResponse.error.message})`,
          response_data: fbResponse,
        })

        revalidatePath('/admin/anuncios')
        return { success: true, message: 'Anúncio removido localmente!' }
      }

      // Sucesso no Facebook
      await (supabase.from('facebook_anuncios') as any).delete().eq('id', anuncioId)

      await (supabase.from('facebook_sync_log') as any).insert({
        anuncio_id: anuncioId,
        acao: 'remover',
        status: 'sucesso',
        mensagem: 'Anúncio removido do Facebook e localmente',
        response_data: fbResponse,
      })

      revalidatePath('/admin/anuncios')
      return { success: true, message: 'Anúncio removido com sucesso!' }
    } catch (error: any) {
      // Qualquer erro, remove localmente
      await (supabase.from('facebook_anuncios') as any).delete().eq('id', anuncioId)
      
      await (supabase.from('facebook_sync_log') as any).insert({
        anuncio_id: anuncioId,
        acao: 'remover_local',
        status: 'sucesso',
        mensagem: `Anúncio removido localmente (erro ao conectar Facebook: ${error.message})`,
      })

      revalidatePath('/admin/anuncios')
      return { success: true, message: 'Anúncio removido localmente!' }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}

/**
 * Remover TODOS os anúncios (limpar tudo)
 * Use com cuidado!
 */
export async function limparTodosAnuncios() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Não autorizado' }
    }

    // Deletar todos os anúncios
    await (supabase.from('facebook_anuncios') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Deletar todos os logs
    await (supabase.from('facebook_sync_log') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000')

    await (supabase.from('facebook_sync_log') as any).insert({
      acao: 'limpar_todos',
      status: 'sucesso',
      mensagem: 'Todos os anúncios foram removidos',
    })

    revalidatePath('/admin/anuncios')
    return { success: true, message: 'Todos os anúncios foram removidos!' }
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
      .select('id, codigo_produto, nome, slug, preco, foto_principal, estoque, ativo, nivel_bateria, condicao')
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

/**
 * Diagnosticar configuração do Facebook
 */
export async function diagnosticarFacebook() {
  try {
    const { diagnosticarFacebookAPI } = await import('@/lib/api/facebook/diagnostics')
    const diagnostico = await diagnosticarFacebookAPI()
    return { success: true, data: diagnostico }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
