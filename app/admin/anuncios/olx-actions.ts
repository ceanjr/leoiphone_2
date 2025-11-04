'use server'
import { logger } from '@/lib/utils/logger'

import { createClient } from '@/lib/supabase/server'
import { OlxAPIClient, produtoToOlxAdvert } from '@/lib/api/olx/api-client'
import { revalidatePath } from 'next/cache'
import type { CriarAnuncioOlxInput, AtualizarAnuncioOlxInput, OlxConfig } from '@/types/olx'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://leoiphone.com.br'

/**
 * Buscar configuração da OLX
 */
async function getConfig(): Promise<OlxConfig | null> {
  const supabase = await createClient()
  const { data, error } = await (supabase.from('olx_config') as any).select('*').single()
  if (error || !data) return null
  return data
}

/**
 * Criar cliente da API OLX
 */
async function createOlxClient(): Promise<OlxAPIClient | null> {
  const config = await getConfig()
  if (!config || !config.sync_enabled) {
    throw new Error('Integração com OLX não está configurada ou ativa')
  }
  return new OlxAPIClient(config.access_token)
}

/**
 * Criar anúncio na OLX
 */
export async function criarAnuncioOlx(input: CriarAnuncioOlxInput) {
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
      .from('olx_anuncios')
      .select('id, status')
      .eq('produto_id', input.produto_id)
      .maybeSingle()

    if (anuncioExistente && (anuncioExistente as any).status === 'anunciado') {
      return { success: false, error: 'Este produto já está anunciado na OLX' }
    }

    // Criar cliente OLX
    const olxClient = await createOlxClient()
    if (!olxClient) {
      return { success: false, error: 'Cliente OLX não configurado' }
    }

    // Buscar config para pegar o access_token
    const config = await getConfig()
    if (!config || !config.access_token) {
      return { success: false, error: 'Access Token não configurado' }
    }

    // VALIDAR PERMISSÕES ANTES DE CRIAR
    logger.log('[OLX-ACTION] Validando permissões do token...')
    const validation = await validarPermissoesToken()

    if (!validation.success) {
      return {
        success: false,
        error: `❌ Token inválido: ${validation.error}\n\n💡 Gere um novo token no portal OLX com permissão "autoupload"`,
      }
    }

    if (!validation.can_create_ads) {
      return {
        success: false,
        error: validation.warning || 'Não é possível criar anúncios no momento',
      }
    }

    logger.log('[OLX-ACTION] ✅ Token validado com sucesso')
    if (validation.plan === 'professional') {
      logger.log(
        `[OLX-ACTION] Plano: Profissional (${validation.ads_available} anúncios disponíveis)`
      )
    } else if (validation.plan === 'basic') {
      logger.log('[OLX-ACTION] Plano: Básico')
    }

    // Converter produto para formato OLX
    const olxAdvert = produtoToOlxAdvert(produto, SITE_URL, config.access_token)

    logger.log('[OLX-ACTION] Produto convertido para OLX:', olxAdvert)
    logger.log('[OLX-ACTION] Produto raw:', JSON.stringify(produto, null, 2))

    // Sobrescrever com dados personalizados se fornecidos
    if (input.titulo) {
      olxAdvert.ad_list[0].subject = input.titulo.substring(0, 90)
    }
    if (input.descricao) {
      olxAdvert.ad_list[0].body = input.descricao
    }
    if (input.categoria_olx) {
      olxAdvert.ad_list[0].category = parseInt(input.categoria_olx)
    }

    logger.log('[OLX-ACTION] Dados finais para envio:', olxAdvert)

    // Criar anúncio na OLX
    const olxResponse = await olxClient.createAd(olxAdvert)

    logger.log('[OLX-ACTION] Resposta completa da OLX:', olxResponse)

    if (olxResponse.error) {
      logger.error('[OLX-ACTION] Erro detectado:', olxResponse.error)
      logger.error(
        '[OLX-ACTION] Detalhes completos do erro:',
        JSON.stringify(olxResponse.error, null, 2)
      )

      // Salvar erro no banco
      await (supabase.from('olx_anuncios') as any).insert({
        produto_id: input.produto_id,
        titulo: input.titulo || produto.nome,
        descricao: input.descricao || produto.descricao,
        preco: produto.preco,
        url_imagem: produto.foto_principal,
        categoria_olx: input.categoria_olx || '23',
        status: 'erro',
        erro_mensagem: olxResponse.error.message,
      })

      // Log de erro
      await (supabase.from('olx_sync_log') as any).insert({
        acao: 'criar',
        status: 'erro',
        mensagem: `${olxResponse.error.message} (Code: ${olxResponse.error.code || 'N/A'})`,
        request_payload: olxAdvert,
        response_data: olxResponse,
      })

      // Mensagem de erro amigável
      let errorMessage = 'Erro da OLX: '

      const errorCode = typeof olxResponse.error.code === 'number' ? olxResponse.error.code : 0

      if (errorCode === 401 || olxResponse.error.code === 401) {
        errorMessage += 'Token inválido ou expirado. Gere um novo token nas configurações.'
      } else if (errorCode === 403 || olxResponse.error.code === 403) {
        errorMessage += 'Sem permissão. Verifique suas credenciais.'
      } else if (errorCode === 400 || olxResponse.error.code === 400) {
        errorMessage += 'Dados inválidos. Verifique o payload nos logs do console.'
      } else if (errorCode === 404 || olxResponse.error.code === 404) {
        errorMessage += 'Endpoint não encontrado. Verifique a URL da API.'
      } else if (errorCode === 543) {
        errorMessage += 'Erro de validação da OLX (543). '
        if (olxResponse.error.details) {
          const details = olxResponse.error.details
          logger.error('[OLX-ACTION] Detalhes do erro 543:', JSON.stringify(details, null, 2))

          if (details.message) {
            errorMessage += details.message
          } else if (details.error_description) {
            errorMessage += details.error_description
          } else if (typeof details === 'string') {
            errorMessage += details
          } else {
            errorMessage +=
              'Verifique: imagens acessíveis, localização completa (CEP), parâmetros da categoria.'
          }
        } else {
          errorMessage +=
            'Possíveis causas: imagens inacessíveis, falta de CEP, ou parâmetros inválidos. Verifique os logs.'
        }
      } else if (errorCode >= 500 && errorCode < 600) {
        errorMessage += `Erro no servidor da OLX (${errorCode}). Tente novamente mais tarde.`
        if (olxResponse.error.details) {
          const details = JSON.stringify(olxResponse.error.details)
          logger.error('[OLX-ACTION] Detalhes do erro 5xx:', details)
          if (olxResponse.error.details.message) {
            errorMessage += ` Detalhes: ${olxResponse.error.details.message}`
          }
        }
      } else if (olxResponse.error.code === 'TIMEOUT_ERROR') {
        errorMessage += 'Requisição demorou muito. Tente novamente.'
      } else if (olxResponse.error.code === 'CONNECTION_ERROR') {
        errorMessage += 'Não foi possível conectar à API da OLX. Verifique se a API está acessível.'
      } else if (olxResponse.error.code === 'NETWORK_ERROR') {
        errorMessage += 'Erro de rede. Verifique sua conexão com a internet.'
      } else if (olxResponse.error.code === 'PARSE_ERROR') {
        errorMessage += 'Resposta inválida da OLX (não é JSON). Verifique os logs do console.'
      } else {
        errorMessage += olxResponse.error.message || 'Erro desconhecido'
      }

      return {
        success: false,
        error: errorMessage,
        code: olxResponse.error.code,
        debug: {
          payload: olxAdvert,
          responseError: olxResponse.error,
        },
      }
    }

    // Verificar se a resposta indica erro de permissão (statusCode: -6)
    if (
      olxResponse.data?.statusCode === -6 ||
      olxResponse.data?.statusMessage === 'Without permission'
    ) {
      logger.error('[OLX-ACTION] ❌ Erro de permissão detectado')
      logger.error('[OLX-ACTION] Status:', olxResponse.data?.statusMessage)
      logger.error('[OLX-ACTION] Errors:', olxResponse.data?.errors)

      const errorDetails = olxResponse.data?.errors?.[0] || {}

      // Salvar erro no banco
      await (supabase.from('olx_anuncios') as any).insert({
        produto_id: input.produto_id,
        titulo: input.titulo || produto.nome,
        descricao: input.descricao || produto.descricao,
        preco: produto.preco,
        url_imagem: produto.foto_principal,
        categoria_olx: input.categoria_olx || '23',
        status: 'erro',
        erro_mensagem: 'Sem permissão (statusCode: -6)',
      })

      // Log de erro
      await (supabase.from('olx_sync_log') as any).insert({
        acao: 'criar',
        status: 'erro',
        mensagem: `Sem permissão para criar anúncio (statusCode: -6)`,
        request_payload: olxAdvert,
        response_data: olxResponse,
      })

      return {
        success: false,
        error:
          '🚫 Sem permissão para criar anúncios.\n\n' +
          'Possíveis causas:\n' +
          '1. Token sem permissão "autoupload"\n' +
          '2. Conta OLX sem plano ativo\n' +
          '3. Limite de anúncios atingido\n' +
          '4. Token expirado ou inválido\n\n' +
          '💡 Solução: Gere um novo token no portal OLX com as permissões corretas.',
        code: -6,
        debug: {
          payload: olxAdvert,
          responseData: olxResponse.data,
          statusMessage: olxResponse.data?.statusMessage,
          errors: olxResponse.data?.errors,
        },
      }
    }

    // Verificar se há token null (outro tipo de erro de permissão)
    if (
      olxResponse.data?.token === null &&
      olxResponse.data?.errors &&
      olxResponse.data.errors.length > 0
    ) {
      logger.error('[OLX-ACTION] ❌ Erro nos dados do anúncio')
      logger.error('[OLX-ACTION] Errors:', JSON.stringify(olxResponse.data.errors, null, 2))

      const firstError = olxResponse.data.errors[0] || {}
      const errorMessage = firstError.message || 'Erro desconhecido ao criar anúncio'

      // Salvar erro no banco
      await (supabase.from('olx_anuncios') as any).insert({
        produto_id: input.produto_id,
        titulo: input.titulo || produto.nome,
        descricao: input.descricao || produto.descricao,
        preco: produto.preco,
        url_imagem: produto.foto_principal,
        categoria_olx: input.categoria_olx || '23',
        status: 'erro',
        erro_mensagem: errorMessage,
      })

      // Log de erro
      await (supabase.from('olx_sync_log') as any).insert({
        acao: 'criar',
        status: 'erro',
        mensagem: errorMessage,
        request_payload: olxAdvert,
        response_data: olxResponse,
      })

      return {
        success: false,
        error: `❌ Erro ao criar anúncio: ${errorMessage}`,
        debug: {
          payload: olxAdvert,
          responseData: olxResponse.data,
          errors: olxResponse.data.errors,
        },
      }
    }

    // Sucesso - OLX pode retornar diferentes estruturas
    logger.log('[OLX-ACTION] ✅ Anúncio criado com sucesso!')
    logger.log(
      '[OLX-ACTION] Dados completos da resposta:',
      JSON.stringify(olxResponse.data, null, 2)
    )

    // A OLX pode retornar:
    // 1. { token: "xxx" } - token de importação para consultar depois
    // 2. { ad_list: [{ id: "xxx", list_id: "xxx", ... }] } - dados do anúncio diretamente
    // 3. { uuid: "xxx" } - UUID direto (menos comum)
    let adUuid = null
    let importToken = null

    if (olxResponse.data?.ad_list && Array.isArray(olxResponse.data.ad_list)) {
      const firstAd = olxResponse.data.ad_list[0]

      // Prioridade: list_id (ID público) > id (ID interno) > external_id
      if (firstAd?.list_id) {
        adUuid = String(firstAd.list_id)
        logger.log('[OLX-ACTION] ✅ list_id encontrado:', adUuid)
      } else if (firstAd?.id) {
        adUuid = String(firstAd.id)
        logger.log('[OLX-ACTION] ⚠️ Usando id interno:', adUuid)
      } else if (firstAd?.external_id) {
        adUuid = String(firstAd.external_id)
        logger.log('[OLX-ACTION] ⚠️ Usando external_id:', adUuid)
      }

      // Status do anúncio
      if (firstAd?.status) {
        logger.log('[OLX-ACTION] Status:', firstAd.status)
      }
    } else if (olxResponse.data?.token) {
      // Retornou token de importação - precisamos consultar depois
      importToken = olxResponse.data.token
      logger.log('[OLX-ACTION] Token de importação recebido:', importToken)

      // Tentar consultar o status da importação IMEDIATAMENTE
      try {
        logger.log('[OLX-ACTION] Aguardando 2 segundos antes de consultar status...')
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const statusResponse = await olxClient.getImportStatus(importToken)
        logger.log(
          '[OLX-ACTION] Status da importação:',
          JSON.stringify(statusResponse.data, null, 2)
        )

        // Extrair list_id da resposta de status
        if (statusResponse.data?.ad_list && Array.isArray(statusResponse.data.ad_list)) {
          const ads = statusResponse.data.ad_list

          for (const ad of ads) {
            // Procurar pelo nosso produto usando o external_id
            if (ad.external_id === (produto.codigo_produto || produto.id)) {
              if (ad.list_id) {
                adUuid = String(ad.list_id)
                logger.log('[OLX-ACTION] ✅ list_id obtido do status:', adUuid)
                break
              } else if (ad.id) {
                adUuid = String(ad.id)
                logger.log('[OLX-ACTION] ⚠️ Usando id do status:', adUuid)
                break
              }
            }
          }

          // Se não encontrou pelo external_id, pegar o primeiro
          if (!adUuid && ads[0]) {
            if (ads[0].list_id) {
              adUuid = String(ads[0].list_id)
              logger.log('[OLX-ACTION] ⚠️ Usando primeiro list_id disponível:', adUuid)
            } else if (ads[0].id) {
              adUuid = String(ads[0].id)
              logger.log('[OLX-ACTION] ⚠️ Usando primeiro id disponível:', adUuid)
            }
          }
        }

        // Se ainda não tem ID, salvar o token como fallback
        if (!adUuid) {
          adUuid = importToken
          logger.log('[OLX-ACTION] ⚠️ Usando token como ID temporário:', adUuid)
        }
      } catch (err) {
        logger.error('[OLX-ACTION] ❌ Erro ao consultar status:', err)
        // Usar token como ID temporário
        adUuid = importToken
        logger.log('[OLX-ACTION] ⚠️ Usando token como ID (erro ao consultar):', adUuid)
      }
    } else if (olxResponse.data?.uuid) {
      // Retornou UUID direto
      adUuid = String(olxResponse.data.uuid)
      logger.log('[OLX-ACTION] UUID direto:', adUuid)
    } else if (olxResponse.data?.id) {
      // Retornou apenas ID
      adUuid = String(olxResponse.data.id)
      logger.log('[OLX-ACTION] ID direto:', adUuid)
    } else {
      // Última tentativa: verificar se tem algum campo numérico que pode ser o ID
      const responseKeys = Object.keys(olxResponse.data || {})
      logger.log('[OLX-ACTION] ⚠️ Estrutura desconhecida, campos disponíveis:', responseKeys)

      // Procurar por campos que parecem IDs
      for (const key of responseKeys) {
        const value = olxResponse.data[key]
        if (typeof value === 'string' || typeof value === 'number') {
          logger.log(`[OLX-ACTION] Campo ${key}:`, value)
        }
      }
    }

    logger.log('[OLX-ACTION] ID final a ser salvo:', adUuid)

    // Se não conseguiu extrair nenhum ID, retornar erro
    if (!adUuid) {
      logger.error('[OLX-ACTION] ❌ ERRO: Não foi possível extrair o ID do anúncio da resposta')
      logger.error('[OLX-ACTION] Resposta completa:', JSON.stringify(olxResponse, null, 2))

      await (supabase.from('olx_sync_log') as any).insert({
        acao: 'criar',
        status: 'erro',
        mensagem: 'Anúncio possivelmente criado, mas não foi possível extrair o ID da resposta',
        request_payload: olxAdvert,
        response_data: olxResponse,
      })

      return {
        success: false,
        error: 'Não foi possível obter o ID do anúncio. Verifique os logs.',
        debug: {
          response: olxResponse.data,
        },
      }
    }

    // Criar URL do anúncio (se temos o list_id)
    let adUrl = null
    if (adUuid && !importToken) {
      // Formato: https://www.olx.com.br/vi/{list_id}.htm
      adUrl = `https://www.olx.com.br/vi/${adUuid}.htm`
      logger.log('[OLX-ACTION] URL do anúncio:', adUrl)
    }

    // Salvar anúncio no banco
    const { data: anuncio, error: anuncioError } = await (supabase.from('olx_anuncios') as any)
      .insert({
        produto_id: input.produto_id,
        olx_ad_id: adUuid,
        titulo: input.titulo || produto.nome,
        descricao: input.descricao || produto.descricao,
        preco: produto.preco,
        url_imagem: produto.foto_principal,
        categoria_olx: input.categoria_olx || '23',
        status: adUrl ? 'anunciado' : 'processando',
        sincronizado_em: new Date().toISOString(),
      })
      .select()
      .single()

    if (anuncioError) {
      logger.error('[OLX-ACTION] ❌ Erro ao salvar no banco:', anuncioError)
      return { success: false, error: 'Erro ao salvar anúncio no banco de dados' }
    }

    logger.log('[OLX-ACTION] ✅ Anúncio salvo no banco:', anuncio)
    logger.log('[OLX-ACTION] ID do anúncio:', anuncio.id)
    logger.log('[OLX-ACTION] olx_ad_id salvo:', anuncio.olx_ad_id)

    // Log de sucesso
    await (supabase.from('olx_sync_log') as any).insert({
      anuncio_id: anuncio.id,
      acao: 'criar',
      status: 'sucesso',
      mensagem: adUrl
        ? `Anúncio criado na OLX (ID: ${adUuid}) com ${olxAdvert.ad_list[0].images?.length || 0} imagens`
        : `Anúncio em processamento na OLX (Token: ${adUuid})`,
      request_payload: olxAdvert,
      response_data: olxResponse,
    })

    revalidatePath('/admin/anuncios')

    return {
      success: true,
      data: {
        ...anuncio,
        url: adUrl,
      },
      message: adUrl
        ? 'Anúncio criado com sucesso na OLX!'
        : 'Anúncio enviado! Aguarde processamento da OLX.',
      adUrl,
    }
  } catch (error: any) {
    logger.error('[OLX-ACTION] ERRO FATAL ao criar anúncio:', error)
    logger.error('[OLX-ACTION] Stack trace:', error.stack)
    return {
      success: false,
      error: `Erro ao criar anúncio: ${error.message || 'Erro desconhecido'}`,
    }
  }
}

/**
 * Atualizar anúncio existente
 */
export async function atualizarAnuncioOlx(input: AtualizarAnuncioOlxInput) {
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
      .from('olx_anuncios')
      .select('*')
      .eq('id', input.anuncio_id)
      .single() as any)

    if (anuncioError || !anuncio) {
      return { success: false, error: 'Anúncio não encontrado' }
    }

    if (!anuncio.olx_ad_id) {
      return { success: false, error: 'Anúncio não tem ID da OLX' }
    }

    // Criar cliente OLX
    const olxClient = await createOlxClient()
    if (!olxClient) {
      return { success: false, error: 'Cliente OLX não configurado' }
    }

    // Preparar atualizações
    const updates: any = {}
    if (input.titulo) updates.subject = input.titulo.substring(0, 70)
    if (input.descricao) updates.body = input.descricao
    if (input.preco) {
      updates.price = {
        value: Math.round(input.preco * 100),
        currency: 'BRL',
      }
    }

    // Atualização de anúncios não está implementada
    return {
      success: false,
      error: 'Atualização de anúncios não está implementada. Por favor, remova e recrie o anúncio.',
    }
  } catch (error: any) {
    logger.error('Erro ao atualizar anúncio OLX:', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}

/**
 * Remover anúncio da OLX
 */
export async function removerAnuncioOlx(anuncioId: string, forceLocal = false) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Não autorizado' }
    }

    // Buscar anúncio
    const { data: anuncio } = await (supabase.from('olx_anuncios') as any)
      .select('*')
      .eq('id', anuncioId)
      .single()

    if (!anuncio) {
      return { success: false, error: 'Anúncio não encontrado' }
    }

    // Se forceLocal ou não tem olx_ad_id, só remove localmente
    if (forceLocal || !anuncio.olx_ad_id) {
      await (supabase.from('olx_anuncios') as any).delete().eq('id', anuncioId)

      await (supabase.from('olx_sync_log') as any).insert({
        anuncio_id: anuncioId,
        acao: 'remover',
        status: 'sucesso',
        mensagem: 'Anúncio removido localmente (sem sincronizar com OLX)',
      })

      revalidatePath('/admin/anuncios')
      return { success: true, message: 'Anúncio removido!' }
    }

    // Tentar remover da OLX
    try {
      const olxClient = await createOlxClient()
      if (!olxClient) {
        // Se não conseguir cliente, remove apenas localmente
        await (supabase.from('olx_anuncios') as any).delete().eq('id', anuncioId)
        revalidatePath('/admin/anuncios')
        return { success: true, message: 'Anúncio removido localmente!' }
      }

      const olxResponse = await olxClient.deleteAd(anuncio.olx_ad_id)

      // Se erro da OLX, remove localmente mesmo assim
      if (olxResponse.error) {
        await (supabase.from('olx_anuncios') as any).delete().eq('id', anuncioId)

        await (supabase.from('olx_sync_log') as any).insert({
          anuncio_id: anuncioId,
          acao: 'remover',
          status: 'sucesso',
          mensagem: `Anúncio removido localmente (OLX retornou erro: ${olxResponse.error.message})`,
          response_data: olxResponse,
        })

        revalidatePath('/admin/anuncios')
        return { success: true, message: 'Anúncio removido localmente!' }
      }

      // Sucesso na OLX
      await (supabase.from('olx_anuncios') as any).delete().eq('id', anuncioId)

      await (supabase.from('olx_sync_log') as any).insert({
        anuncio_id: anuncioId,
        acao: 'remover',
        status: 'sucesso',
        mensagem: 'Anúncio removido da OLX e localmente',
        response_data: olxResponse,
      })

      revalidatePath('/admin/anuncios')
      return { success: true, message: 'Anúncio removido com sucesso!' }
    } catch (error: any) {
      // Qualquer erro, remove localmente
      await (supabase.from('olx_anuncios') as any).delete().eq('id', anuncioId)

      await (supabase.from('olx_sync_log') as any).insert({
        anuncio_id: anuncioId,
        acao: 'remover',
        status: 'sucesso',
        mensagem: `Anúncio removido localmente (erro ao conectar OLX: ${error.message})`,
      })

      revalidatePath('/admin/anuncios')
      return { success: true, message: 'Anúncio removido localmente!' }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}

/**
 * Remover TODOS os anúncios OLX
 */
export async function limparTodosAnunciosOlx() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Não autorizado' }
    }

    // Deletar todos os anúncios
    await (supabase.from('olx_anuncios') as any)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    // Deletar todos os logs
    await (supabase.from('olx_sync_log') as any)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    await (supabase.from('olx_sync_log') as any).insert({
      acao: 'remover',
      status: 'sucesso',
      mensagem: 'Todos os anúncios OLX foram removidos',
    })

    revalidatePath('/admin/anuncios')
    return { success: true, message: 'Todos os anúncios foram removidos!' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}

/**
 * Listar todos os anúncios OLX
 */
export async function listarAnunciosOlx() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('v_olx_anuncios_com_produto')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Buscar produtos disponíveis para anunciar na OLX
 */
export async function buscarProdutosDisponiveisOlx(busca?: string) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('produtos')
      .select(
        'id, codigo_produto, nome, slug, preco, foto_principal, estoque, ativo, nivel_bateria, condicao'
      )
      .eq('ativo', true)
      .is('deleted_at', null)

    // Excluir produtos já anunciados na OLX
    const { data: anunciados } = await (supabase.from('olx_anuncios') as any)
      .select('produto_id')
      .in('status', ['anunciado', 'pendente'])

    if (anunciados && anunciados.length > 0) {
      const idsAnunciados = anunciados.map((a: any) => a.produto_id)
      query = query.not('id', 'in', `(${idsAnunciados.join(',')})`)
    }

    // Aplicar busca
    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,codigo_produto.ilike.%${busca}%`)
    }

    const { data, error } = await query.limit(100).order('nome', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Salvar configuração da OLX
 */
export async function salvarConfigOlx(config: Partial<OlxConfig>) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Não autorizado' }
    }

    // Verificar se já existe configuração
    const { data: existing } = await (supabase.from('olx_config') as any).select('id').single()

    if (existing) {
      // Atualizar
      const { error } = await (supabase.from('olx_config') as any)
        .update(config)
        .eq('id', existing.id)

      if (error) {
        return { success: false, error: error.message }
      }
    } else {
      // Criar
      const { error } = await (supabase.from('olx_config') as any).insert(config)

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
 * Buscar configuração da OLX
 */
export async function buscarConfigOlx() {
  try {
    const config = await getConfig()
    return { success: true, data: config }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function diagnosticarTokenOlx() {
  try {
    const config = await getConfig()

    if (!config || !config.access_token) {
      return {
        success: false,
        error: 'Access Token não configurado',
        diagnostico: {
          token_presente: false,
          sync_enabled: false,
        },
      }
    }

    const diagnostico = {
      token_presente: true,
      token_prefix: config.access_token.substring(0, 20),
      sync_enabled: config.sync_enabled,
      base_url: 'https://apps.olx.com.br',
      endpoints: {
        user_info: '/oauth_api/user_info',
        create_ad: '/autoupload/import',
      },
    }

    logger.log('[DIAGNÓSTICO-OLX]', diagnostico)

    // Tentar validar token
    const olxClient = new OlxAPIClient(config.access_token)
    const response = await olxClient.getBalance()

    if (response.error) {
      // Analisar tipo de erro
      let sugestao = ''

      if (response.error.code === 'CLOUDFLARE_BLOCK') {
        sugestao =
          '⚠️ Token bloqueado pelo Cloudflare. Possíveis causas:\n' +
          '1. Token inválido ou expirado\n' +
          '2. Token sem permissões corretas (precisa do scope "autoupload")\n' +
          '3. IP bloqueado pela OLX\n\n' +
          '💡 Solução: Gere um novo token no portal OLX ou entre em contato com suporteintegrador@olxbr.com'
      } else if (response.error.code === 401) {
        sugestao = '🔒 Token não autorizado. Gere um novo token.'
      } else if (response.error.code === 403) {
        sugestao = '🚫 Acesso negado. Verifique as permissões do token.'
      } else if (response.error.code === 404) {
        sugestao = '❓ Endpoint não encontrado. Verifique a documentação da OLX.'
      }

      return {
        success: false,
        diagnostico,
        erro: response.error,
        sugestao,
      }
    }

    return {
      success: true,
      message: '✅ Token válido e funcionando!',
      diagnostico,
      user_info: response.data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      diagnostico: {
        erro_fatal: true,
        mensagem: 'Erro ao executar diagnóstico',
      },
    }
  }
}

/**
 * Testar conexão com OLX
 */
export async function testarConexaoOlx() {
  try {
    const config = await getConfig()

    if (!config || !config.access_token) {
      return { success: false, error: 'Access Token não configurado' }
    }

    logger.log('[TEST-OLX] Testando conexão...')
    logger.log('[TEST-OLX] Token prefix:', config.access_token.substring(0, 20))

    const olxClient = new OlxAPIClient(config.access_token)

    // Tentar balance
    const balanceResponse = await olxClient.getBalance()
    logger.log('[TEST-OLX] Resposta balance:', JSON.stringify(balanceResponse, null, 2))

    // CASO ESPECIAL: Erro 410 = Token VÁLIDO, mas plano básico
    if (balanceResponse.error?.code === 410) {
      const reason = balanceResponse.error?.details?.reason

      if (reason === 'PRODUCT_NOT_FOUND_BY_ACCOUNT') {
        logger.log('[TEST-OLX] ✅ Token válido! Plano básico detectado.')
        logger.log('[TEST-OLX] Tentando listar anúncios como teste alternativo...')

        // Teste alternativo: listar anúncios
        const listResponse = await olxClient.listPublishedAds()
        logger.log('[TEST-OLX] Resposta listagem:', JSON.stringify(listResponse, null, 2))

        if (!listResponse.error || listResponse.error.code === 404) {
          // 404 também é OK - significa que não há anúncios, mas token é válido
          return {
            success: true,
            message: '✅ Token válido! Conexão estabelecida.',
            warning: '⚠️ Plano básico - sem controle de limites via API',
            info: {
              plano: 'Plano Básico (sem controle de limites)',
              token_valido: true,
              pode_publicar: true,
              nota: 'Erro 410 indica token válido com plano básico',
              anuncios_publicados: Array.isArray(listResponse.data) ? listResponse.data.length : 0,
            },
            technical: {
              balance_error: balanceResponse.error,
              list_response: listResponse,
            },
          }
        }

        // Se listagem falhar com 401, token é inválido
        if (listResponse.error?.code === 401) {
          return {
            success: false,
            error: '🔒 Token inválido ou expirado',
            sugestao: 'Gere um novo token no portal OLX',
            debug: {
              balance_code: 410,
              list_code: 401,
            },
          }
        }

        // Assumir token válido mesmo sem conseguir listar
        return {
          success: true,
          message: '✅ Token parece válido',
          warning: '⚠️ Plano básico detectado (erro 410)',
          info: {
            plano: 'Plano Básico',
            token_valido: true,
            pode_publicar: true,
            nota: 'Erro 410 = autenticação OK, sem acesso a balance API',
          },
          technical: {
            error_410_significa: 'Token válido mas conta não tem plano profissional',
            pode_publicar_anuncios: true,
          },
        }
      }
    }

    // Outros erros
    if (balanceResponse.error) {
      let errorMessage = balanceResponse.error.message
      let sugestao = ''

      if (balanceResponse.error.code === 401) {
        errorMessage = '🔒 Token não autorizado ou inválido'
        sugestao = 'Gere um novo token no portal OLX'
      } else if (balanceResponse.error.code === 403) {
        errorMessage = '🚫 Sem permissão'
        sugestao = 'Verifique se o token tem scope "autoupload"'
      } else if (balanceResponse.error.code === 'CLOUDFLARE_BLOCK') {
        errorMessage = balanceResponse.error.message
        sugestao = 'Token bloqueado pelo Cloudflare'
      }

      return {
        success: false,
        error: errorMessage,
        sugestao,
        details: balanceResponse.error,
        debug: {
          endpoint: 'https://apps.olx.com.br/autoupload/balance',
          tokenPrefix: config.access_token.substring(0, 20),
          statusCode: balanceResponse.status,
          errorCode: balanceResponse.error.code,
        },
      }
    }

    // Sucesso total - plano profissional!
    return {
      success: true,
      message: '✅ Conexão estabelecida - Plano Profissional!',
      data: balanceResponse.data,
      info: {
        plano: balanceResponse.data?.name || 'Profissional',
        anuncios_disponiveis: balanceResponse.data?.ads?.available || 0,
        anuncios_usados: balanceResponse.data?.ads?.performed || 0,
        total_anuncios: balanceResponse.data?.ads?.total || 0,
      },
    }
  } catch (error: any) {
    logger.error('[TEST-OLX] ERRO FATAL:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack,
    }
  }
}

/**
 * Buscar categorias da OLX
 */
export async function buscarCategoriasOlx() {
  try {
    const olxClient = await createOlxClient()
    if (!olxClient) {
      return { success: false, error: 'Cliente OLX não configurado' }
    }

    // Categorias conhecidas
    const categories = [{ id: '3060', name: 'Celulares e Telefones' }]

    return { success: true, data: categories }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Atualizar status de anúncio que está em processamento
 * Útil para anúncios que foram criados mas ainda não têm list_id
 */
export async function atualizarStatusAnuncioOlx(anuncioId: string) {
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
      .from('olx_anuncios')
      .select('*')
      .eq('id', anuncioId)
      .single() as any)

    if (anuncioError || !anuncio) {
      return { success: false, error: 'Anúncio não encontrado' }
    }

    if (!anuncio.olx_ad_id) {
      return { success: false, error: 'Anúncio não tem ID da OLX' }
    }

    // Criar cliente OLX
    const olxClient = await createOlxClient()
    if (!olxClient) {
      return { success: false, error: 'Cliente OLX não configurado' }
    }

    logger.log('[OLX-STATUS] Consultando status para:', anuncio.olx_ad_id)

    // Tentar consultar como import token primeiro
    const statusResponse = await olxClient.getImportStatus(anuncio.olx_ad_id)

    if (statusResponse.error) {
      // Se falhar, tentar consultar como ad_id
      const adStatusResponse = await olxClient.getAdStatus(anuncio.olx_ad_id)

      if (adStatusResponse.error) {
        return {
          success: false,
          error: `Erro ao consultar status: ${statusResponse.error.message}`,
        }
      }

      // Extrair informações do anúncio
      const adData = adStatusResponse.data

      return {
        success: true,
        data: {
          status: adData.status || anuncio.status,
          olx_ad_id: anuncio.olx_ad_id,
          list_id: adData.list_id || adData.id,
          url: adData.list_id ? `https://www.olx.com.br/vi/${adData.list_id}.htm` : null,
        },
        message: 'Status consultado com sucesso',
      }
    }

    // Processar resposta de import status
    const ads = statusResponse.data?.ad_list || []

    if (ads.length === 0) {
      return {
        success: false,
        error: 'Nenhum anúncio encontrado no status de importação',
      }
    }

    // Procurar pelo nosso produto
    const adData =
      ads.find((ad: any) => ad.external_id === anuncio.produto_id || ad.id === anuncio.olx_ad_id) ||
      ads[0]

    // Atualizar no banco se temos um list_id novo
    if (adData.list_id && adData.list_id !== anuncio.olx_ad_id) {
      logger.log('[OLX-STATUS] ✅ Atualizando com list_id:', adData.list_id)

      await (supabase.from('olx_anuncios') as any)
        .update({
          olx_ad_id: String(adData.list_id),
          status: 'anunciado',
          sincronizado_em: new Date().toISOString(),
        })
        .eq('id', anuncioId)

      revalidatePath('/admin/anuncios')

      return {
        success: true,
        data: {
          olx_ad_id: adData.list_id,
          status: 'anunciado',
          url: `https://www.olx.com.br/vi/${adData.list_id}.htm`,
        },
        message: 'Anúncio atualizado com sucesso!',
      }
    }

    return {
      success: true,
      data: {
        status: adData.status || 'processando',
        olx_ad_id: anuncio.olx_ad_id,
      },
      message:
        adData.status === 'active' ? 'Anúncio está ativo na OLX' : 'Anúncio ainda em processamento',
    }
  } catch (error: any) {
    logger.error('[OLX-STATUS] Erro:', error)
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    }
  }
}

/**
 * Buscar URL direta do anúncio na OLX
 */
export async function buscarUrlAnuncioOlx(anuncioId: string) {
  try {
    const supabase = await createClient()

    const { data: anuncio } = await (supabase
      .from('olx_anuncios')
      .select('olx_ad_id')
      .eq('id', anuncioId)
      .single() as any)

    if (!anuncio || !anuncio.olx_ad_id) {
      return { success: false, error: 'Anúncio não tem ID da OLX' }
    }

    // Verificar se é um list_id válido (apenas números)
    const isListId = /^\d+$/.test(anuncio.olx_ad_id)

    if (isListId) {
      const url = `https://www.olx.com.br/vi/${anuncio.olx_ad_id}.htm`
      return {
        success: true,
        url,
        message: 'URL do anúncio',
      }
    }

    // Se não for list_id, é provavelmente um token - precisa consultar
    const statusResult = await atualizarStatusAnuncioOlx(anuncioId)

    if (statusResult.success && statusResult.data?.url) {
      return {
        success: true,
        url: statusResult.data.url,
        message: 'URL obtida após consultar status',
      }
    }

    return {
      success: false,
      error: 'Não foi possível gerar URL do anúncio',
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    }
  }
}

/**
 * Migrar anúncios antigos - buscar list_id de anúncios publicados na OLX
 * Esta função lista todos os anúncios publicados e tenta fazer match com produtos locais
 */
export async function migrarAnunciosAntigos() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Não autorizado' }
    }

    logger.log('[OLX-MIGRATION] 🔄 Iniciando migração de anúncios antigos...')

    // Criar cliente OLX
    const olxClient = await createOlxClient()
    if (!olxClient) {
      return { success: false, error: 'Cliente OLX não configurado' }
    }

    // Buscar anúncios locais sem olx_ad_id
    const { data: anunciosLocais } = await (supabase
      .from('olx_anuncios')
      .select(
        `
        id,
        produto_id,
        titulo,
        preco,
        status,
        olx_ad_id,
        created_at,
        produtos:produto_id (
          nome,
          codigo_produto
        )
      `
      )
      .or('olx_ad_id.is.null,status.eq.processando') as any)

    if (!anunciosLocais || anunciosLocais.length === 0) {
      logger.log('[OLX-MIGRATION] ✅ Nenhum anúncio para migrar')
      return {
        success: true,
        message: 'Nenhum anúncio antigo encontrado',
        stats: {
          total: 0,
          atualizados: 0,
          erros: 0,
        },
      }
    }

    logger.log(`[OLX-MIGRATION] 📋 Encontrados ${anunciosLocais.length} anúncios locais sem ID`)

    // Listar anúncios publicados na OLX
    const olxResponse = await olxClient.listPublishedAds()

    if (olxResponse.error) {
      logger.error('[OLX-MIGRATION] ❌ Erro ao listar anúncios da OLX:', olxResponse.error)
      return {
        success: false,
        error: `Erro ao buscar anúncios da OLX: ${olxResponse.error.message}`,
      }
    }

    // A resposta pode vir em diferentes formatos
    let anunciosListIds: string[] = []

    if (olxResponse.data?.data && Array.isArray(olxResponse.data.data)) {
      // Formato: { data: [{ list_id: "...", status: "active" }] }
      anunciosListIds = olxResponse.data.data
        .filter((ad: any) => ad.status === 'active' || ad.status === 'published')
        .map((ad: any) => ad.list_id)
        .filter(Boolean)
    } else if (Array.isArray(olxResponse.data)) {
      // Formato: [{ list_id: "...", status: "active" }]
      anunciosListIds = olxResponse.data
        .filter((ad: any) => ad.status === 'active' || ad.status === 'published')
        .map((ad: any) => ad.list_id)
        .filter(Boolean)
    }

    logger.log(
      `[OLX-MIGRATION] 📋 Encontrados ${anunciosListIds.length} anúncios ativos (de ${olxResponse.data?.data?.length || 0} totais)`
    )

    if (anunciosListIds.length === 0) {
      return {
        success: true,
        message: 'Nenhum anúncio ativo encontrado na OLX para migrar',
        stats: {
          total: anunciosLocais.length,
          atualizados: 0,
          erros: 0,
        },
      }
    }

    // Buscar detalhes de cada anúncio ativo
    logger.log('[OLX-MIGRATION] 🔍 Buscando detalhes dos anúncios ativos...')
    const anunciosOlx: any[] = []

    for (const listId of anunciosListIds.slice(0, 50)) {
      // Limitar a 50 para não sobrecarregar
      try {
        const detailsResponse = await olxClient.getAdStatus(listId)

        if (!detailsResponse.error && detailsResponse.data) {
          anunciosOlx.push({
            list_id: listId,
            subject: detailsResponse.data.subject || detailsResponse.data.title,
            price: detailsResponse.data.price,
            ...detailsResponse.data,
          })

          // Delay pequeno para não sobrecarregar API
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      } catch (err) {
        logger.warn(`[OLX-MIGRATION] ⚠️ Erro ao buscar detalhes de ${listId}:`, err)
      }
    }

    logger.log(`[OLX-MIGRATION] ✅ Detalhes carregados de ${anunciosOlx.length} anúncios`)

    if (anunciosOlx.length === 0) {
      return {
        success: false,
        error: 'Não foi possível carregar detalhes dos anúncios da OLX',
      }
    }

    // Log de alguns anúncios da OLX para debug
    logger.log('[OLX-MIGRATION] 📋 Primeiros 3 anúncios da OLX:')
    anunciosOlx.slice(0, 3).forEach((ad: any) => {
      logger.log(`  - "${ad.subject}" | R$ ${ad.price / 100} | ID: ${ad.list_id}`)
    })

    let atualizados = 0
    let erros = 0
    const matches: any[] = []

    // Função auxiliar para normalizar strings
    const normalizar = (str: string) => {
      return str
        ?.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s]/g, '') // Remove pontuação
        .replace(/\s+/g, ' ') // Normaliza espaços
        .trim()
    }

    // Função auxiliar para calcular similaridade
    const calcularSimilaridade = (str1: string, str2: string) => {
      const s1 = normalizar(str1)
      const s2 = normalizar(str2)

      // Exact match
      if (s1 === s2) return 1.0

      // Contém
      if (s1.includes(s2) || s2.includes(s1)) return 0.8

      // Palavras em comum
      const words1 = s1.split(' ')
      const words2 = s2.split(' ')
      const commonWords = words1.filter((w) => words2.includes(w)).length
      const totalWords = Math.max(words1.length, words2.length)

      return commonWords / totalWords
    }

    // Fazer match entre anúncios locais e da OLX
    for (const anuncioLocal of anunciosLocais) {
      try {
        const tituloLocal = anuncioLocal.titulo || ''
        const precoLocal = anuncioLocal.preco || 0
        const produtoNome = anuncioLocal.produtos?.nome || ''

        logger.log(`\n[OLX-MIGRATION] 🔍 Buscando match para: "${tituloLocal}" (R$ ${precoLocal})`)

        // Procurar anúncio correspondente na OLX
        let bestMatch: any = null
        let bestScore = 0

        for (const anuncioOlx of anunciosOlx) {
          const tituloOlx = anuncioOlx.subject || ''
          const precoOlx = (anuncioOlx.price || 0) / 100 // OLX retorna em centavos

          if (!tituloOlx || !precoOlx) continue

          // Calcular score de similaridade
          let score = 0

          // 1. Similaridade de título (peso 60%)
          const tituloSimilarity = Math.max(
            calcularSimilaridade(tituloLocal, tituloOlx),
            calcularSimilaridade(produtoNome, tituloOlx)
          )
          score += tituloSimilarity * 0.6

          // 2. Similaridade de preço (peso 40%)
          const diferencaPreco = Math.abs(precoOlx - precoLocal)
          const precoSimilarity = Math.max(0, 1 - diferencaPreco / Math.max(precoLocal, 1))
          score += precoSimilarity * 0.4

          // Debug dos top 3 matches
          if (score > 0.3) {
            logger.log(
              `  [OLX-MIGRATION] 🎯 Candidato: "${tituloOlx}" | R$ ${precoOlx} | Score: ${(score * 100).toFixed(1)}%`
            )
          }

          // Atualizar melhor match
          if (score > bestScore) {
            bestScore = score
            bestMatch = anuncioOlx
          }
        }

        // Se encontrou um match razoável (>50% similaridade)
        if (bestMatch && bestScore > 0.5) {
          const listId = bestMatch.list_id

          logger.log(
            `[OLX-MIGRATION] ✅ Match encontrado! Score: ${(bestScore * 100).toFixed(1)}%`
          )
          logger.log(`[OLX-MIGRATION]    Local: "${tituloLocal}" - R$ ${precoLocal}`)
          logger.log(
            `[OLX-MIGRATION]    OLX: "${bestMatch.subject}" - R$ ${bestMatch.price / 100}`
          )
          logger.log(`[OLX-MIGRATION]    list_id: ${listId}`)

          matches.push({
            anuncio_id: anuncioLocal.id,
            titulo_local: tituloLocal,
            titulo_olx: bestMatch.subject,
            preco_local: precoLocal,
            preco_olx: bestMatch.price / 100,
            list_id: listId,
            score: bestScore,
          })

          // Atualizar no banco
          const { error: updateError } = await (supabase.from('olx_anuncios') as any)
            .update({
              olx_ad_id: String(listId),
              status: 'anunciado',
              sincronizado_em: new Date().toISOString(),
            })
            .eq('id', anuncioLocal.id)

          if (updateError) {
            logger.error(`[OLX-MIGRATION] ❌ Erro ao atualizar ${anuncioLocal.id}:`, updateError)
            erros++
          } else {
            atualizados++
            logger.log(`[OLX-MIGRATION] ✅ Anúncio ${anuncioLocal.id} atualizado com sucesso`)
          }
        } else {
          logger.log(
            `[OLX-MIGRATION] ⚠️ Nenhum match confiável para "${tituloLocal}" (melhor score: ${(bestScore * 100).toFixed(1)}%)`
          )

          if (bestMatch) {
            logger.log(
              `[OLX-MIGRATION]    Melhor candidato: "${bestMatch.subject}" - R$ ${bestMatch.price / 100}`
            )
          }
        }
      } catch (error: any) {
        logger.error(`[OLX-MIGRATION] ❌ Erro ao processar anúncio:`, error)
        erros++
      }
    }

    logger.log('\n[OLX-MIGRATION] 📊 Resumo de matches encontrados:')
    matches.forEach((m) => {
      logger.log(`  ✅ "${m.titulo_local}" → "${m.titulo_olx}" (${(m.score * 100).toFixed(1)}%)`)
    })

    // Log de resultado
    await (supabase.from('olx_sync_log') as any).insert({
      acao: 'migrar',
      status: 'sucesso',
      mensagem: `Migração concluída: ${atualizados} atualizados, ${erros} erros`,
      response_data: {
        total: anunciosLocais.length,
        atualizados,
        erros,
        matches,
      },
    })

    revalidatePath('/admin/anuncios')

    return {
      success: true,
      message:
        atualizados > 0
          ? `Migração concluída! ${atualizados} anúncios atualizados.`
          : 'Nenhum anúncio foi atualizado. Verifique os logs para mais detalhes.',
      stats: {
        total: anunciosLocais.length,
        atualizados,
        erros,
      },
      matches,
    }
  } catch (error: any) {
    logger.error('[OLX-MIGRATION] ❌ ERRO FATAL:', error)
    return {
      success: false,
      error: error.message || 'Erro desconhecido na migração',
    }
  }
}

/**
 * Buscar detalhes de um anúncio específico pelo list_id
 */
export async function buscarDetalhesAnuncioOlx(listId: string) {
  try {
    const olxClient = await createOlxClient()
    if (!olxClient) {
      return { success: false, error: 'Cliente OLX não configurado' }
    }

    logger.log('[OLX-DETAILS] Buscando detalhes do anúncio:', listId)
    const response = await olxClient.getAdStatus(listId)

    if (response.error) {
      return {
        success: false,
        error: `Erro ao buscar detalhes: ${response.error.message}`,
      }
    }

    return {
      success: true,
      data: response.data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    }
  }
}

/**
 * Validar permissões do token antes de criar anúncio
 */
export async function validarPermissoesToken() {
  try {
    const config = await getConfig()

    if (!config || !config.access_token) {
      return {
        success: false,
        error: 'Token não configurado',
        can_create_ads: false,
        recommendation: 'Configure o Access Token nas configurações',
      }
    }

    const olxClient = new OlxAPIClient(config.access_token)

    logger.log('[OLX-VALIDATE] 📋 Iniciando validação completa do token...')
    logger.log('[OLX-VALIDATE] Token prefix:', config.access_token.substring(0, 20))

    // TESTE 1: Listar anúncios publicados (valida autenticação básica)
    logger.log('[OLX-VALIDATE] 1️⃣ Testando autenticação básica...')
    const listResponse = await olxClient.listPublishedAds()

    if (listResponse.error) {
      if (listResponse.error.code === 401) {
        return {
          success: false,
          error: '🔒 Token inválido ou expirado',
          can_create_ads: false,
          recommendation: 'Gere um novo Access Token no portal OLX',
          details: listResponse.error,
        }
      }

      if (listResponse.error.code === 403) {
        return {
          success: false,
          error: '🚫 Token sem permissão básica',
          can_create_ads: false,
          recommendation: 'Verifique se o token tem as permissões corretas',
          details: listResponse.error,
        }
      }

      return {
        success: false,
        error: `❌ Erro ao validar token: ${listResponse.error.message}`,
        can_create_ads: false,
        details: listResponse.error,
      }
    }

    logger.log('[OLX-VALIDATE] ✅ Token válido para autenticação básica')

    // TESTE 2: Verificar balance (plano e limites)
    logger.log('[OLX-VALIDATE] 2️⃣ Verificando plano e limites...')
    const balanceResponse = await olxClient.getBalance()

    if (!balanceResponse.error) {
      // Plano profissional com controle de limites
      const adsAvailable = balanceResponse.data?.ads?.available || 0
      const adsTotal = balanceResponse.data?.ads?.total || 0

      logger.log('[OLX-VALIDATE] ✅ Plano profissional detectado')
      logger.log(`[OLX-VALIDATE] 📊 Anúncios: ${adsAvailable}/${adsTotal} disponíveis`)

      if (adsAvailable === 0) {
        return {
          success: false,
          error: '⚠️ Limite de anúncios atingido',
          can_create_ads: false,
          plan: 'professional',
          ads_available: 0,
          ads_total: adsTotal,
          recommendation: 'Remova anúncios antigos ou aguarde renovação do plano',
        }
      }

      return {
        success: true,
        can_create_ads: true,
        plan: 'professional',
        ads_available: adsAvailable,
        ads_total: adsTotal,
        message: `✅ Token válido! Você pode criar ${adsAvailable} anúncios`,
      }
    }

    // Erro 410 = Plano básico (sem acesso à API de balance)
    if (balanceResponse.error?.code === 410) {
      logger.log('[OLX-VALIDATE] ℹ️ Plano básico detectado (erro 410)')

      // TESTE 3: Tentar criar anúncio de teste (dry-run)
      logger.log('[OLX-VALIDATE] 3️⃣ Testando permissão "autoupload"...')

      // Criar payload mínimo de teste
      const testPayload = {
        access_token: config.access_token,
        ad_list: [
          {
            id: 'test-validation-' + Date.now(),
            operation: 'insert',
            subject: 'Teste de Validação',
            body: 'Teste',
            category: 3060,
            type: 's',
            price: 100,
            region: 'ba',
            municipality: 'Salvador',
            zipcode: '40000-000',
            images: [],
            params: {
              brand: '25',
              item_condition: 'used',
            },
          },
        ],
      }

      // Tentar criar (esperamos erro -6 se não tem permissão)
      const testResponse = await olxClient.createAd(testPayload)

      if (testResponse.error?.code === -6) {
        logger.error('[OLX-VALIDATE] ❌ Erro -6: Sem permissão "autoupload"')

        return {
          success: false,
          error: '🚫 Token SEM permissão "autoupload"',
          can_create_ads: false,
          plan: 'basic',
          recommendation:
            'SOLUÇÃO:\n' +
            '1. Acesse https://developers.olx.com.br\n' +
            '2. Vá em "Meus Apps" → Seu App\n' +
            '3. Em "Permissions", adicione "autoupload"\n' +
            '4. Gere um NOVO Access Token\n' +
            '5. Cole o novo token aqui',
          details: {
            error_code: -6,
            message: 'Without permission',
            scope_missing: 'autoupload',
          },
        }
      }

      // Se não deu erro -6, pode criar anúncios
      logger.log('[OLX-VALIDATE] ✅ Token COM permissão "autoupload"')

      return {
        success: true,
        can_create_ads: true,
        plan: 'basic',
        warning: '⚠️ Plano básico - sem controle de limites via API',
        message: '✅ Token válido! Você pode criar anúncios (plano básico)',
        recommendation: 'Considere upgrade para Plano Profissional para ter controle de limites',
      }
    }

    // Outro erro ao buscar balance - assumir que token é válido
    logger.log('[OLX-VALIDATE] ⚠️ Não foi possível verificar plano')
    return {
      success: true,
      can_create_ads: true,
      plan: 'unknown',
      warning: 'Não foi possível verificar limites de anúncios',
      message: '⚠️ Token válido, mas não foi possível verificar plano',
    }
  } catch (error: any) {
    logger.error('[OLX-VALIDATE] Erro fatal:', error)
    return {
      success: false,
      error: `❌ ${error.message || 'Erro desconhecido'}`,
      can_create_ads: false,
    }
  }
}
