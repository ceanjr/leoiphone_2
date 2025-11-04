import { logger } from '@/lib/utils/logger'

export interface OlxResponse<T = any> {
  data?: T
  error?: {
    code: number | string
    message: string
    details?: any
  }
  status?: number
}

export class OlxAPIClient {
  private baseUrl = 'https://apps.olx.com.br'
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * Método genérico para requisições
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<OlxResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`

      logger.info('[OLX-API] Requisição:', {
        method: options.method || 'GET',
        url,
      })

      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
        cache: 'no-store',
      })

      logger.info('[OLX-API] Status:', response.status)

      const contentType = response.headers.get('content-type')

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        logger.info('[OLX-API] Resposta:', data)

        // ✅ CORREÇÃO: Verificar statusCode interno da OLX
        if (data.statusCode !== undefined && data.statusCode !== 0) {
          logger.error('[OLX-API] ❌ Erro da OLX:', data.statusCode)
          logger.error('[OLX-API] Mensagem:', data.statusMessage)
          logger.error('[OLX-API] Errors:', data.errors)

          // Mapear códigos de erro da OLX
          let errorMessage = data.statusMessage || 'Erro da OLX'

          if (data.statusCode === -6) {
            errorMessage =
              '🚫 Sem permissão para criar anúncios.\n\n' +
              'Possíveis causas:\n' +
              '1. Token sem scope "autoupload"\n' +
              '2. Conta sem plano EMPRESA (planos autônomos não permitem API)\n' +
              '3. Token expirado ou inválido\n\n' +
              '💡 Solução:\n' +
              '- Gere novo token com scope "autoupload" em https://developers.olx.com.br\n' +
              '- Verifique se sua conta tem plano EMPRESA (0800 022 9800)'
          } else if (data.statusCode === -4) {
            // Erro de validação - extrair detalhes
            const errorDetails = data.errors?.[0]?.messages?.[0]?.category || 'Validação falhou'
            errorMessage = `❌ Erro de validação: ${errorDetails}\n\nVerifique:\n- CEP válido\n- Telefone completo (DDD + número)\n- Imagens acessíveis\n- Campos obrigatórios preenchidos`
          } else if (data.statusCode === -7) {
            errorMessage = '⚠️ Limite de anúncios atingido. Remova anúncios antigos ou aguarde renovação do plano.'
          } else if (data.statusCode === -2) {
            errorMessage = '⏱️ Muitas requisições. Aguarde alguns minutos e tente novamente.'
          }

          return {
            error: {
              code: data.statusCode,
              message: errorMessage,
              details: {
                statusMessage: data.statusMessage,
                errors: data.errors,
                raw: data,
              },
            },
            status: response.status,
          }
        }

        // ✅ statusCode 0 = sucesso
        if (data.statusCode === 0) {
          logger.info('[OLX-API] ✅ Sucesso! Token:', data.token)
        }

        return { data, status: response.status }
      } else {
        const text = await response.text()
        logger.error('[OLX-API] Resposta não é JSON:', text.substring(0, 200))

        if (text.includes('Cloudflare') || text.includes('<!DOCTYPE')) {
          return {
            error: {
              code: 'CLOUDFLARE_BLOCK',
              message: '🚫 Bloqueado pelo Cloudflare.\n\nPossíveis causas:\n- Token inválido\n- Token sem permissões corretas\n- IP bloqueado\n\n💡 Gere um novo token em https://developers.olx.com.br',
              details: { hint: 'Resposta HTML ao invés de JSON indica bloqueio' },
            },
            status: response.status,
          }
        }

        return {
          error: {
            code: response.status,
            message: `Resposta não é JSON (HTTP ${response.status})`,
            details: { text: text.substring(0, 500) },
          },
          status: response.status,
        }
      }
    } catch (error: any) {
      logger.error('[OLX-API] Erro:', error)
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Erro de rede',
        },
      }
    }
  }

  /**
   * ✅ CORREÇÃO: Usar /autoupload/balance para verificar plano
   */
  async getBalance(): Promise<OlxResponse> {
    logger.info('[OLX-API] Consultando saldo/plano...')
    return this.request('/autoupload/balance', { method: 'GET' })
  }

  /**
   * Listar anúncios publicados
   */
  async listPublishedAds(): Promise<OlxResponse> {
    logger.info('[OLX-API] Listando anúncios publicados...')
    return this.request('/autoupload/v1/published', { method: 'GET' })
  }

  /**
   * ✅ CORREÇÃO: Criar anúncio com estrutura correta
   */
  async createAd(adData: any): Promise<OlxResponse> {
    logger.info('[OLX-API] Criando anúncio...')
    logger.info('[OLX-API] Payload:', JSON.stringify(adData, null, 2))

    // ✅ Validar estrutura antes de enviar
    if (!adData.access_token) {
      return {
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'access_token é obrigatório no payload',
        },
      }
    }

    if (!adData.ad_list || !Array.isArray(adData.ad_list) || adData.ad_list.length === 0) {
      return {
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'ad_list deve ser um array não-vazio',
        },
      }
    }

    // ✅ Validar campos obrigatórios do primeiro anúncio
    const firstAd = adData.ad_list[0]
    const requiredFields = ['id', 'operation', 'category', 'subject', 'body', 'phone', 'type', 'price', 'zipcode', 'images']
    
    for (const field of requiredFields) {
      if (!firstAd[field]) {
        return {
          error: {
            code: 'MISSING_FIELD',
            message: `Campo obrigatório ausente: ${field}`,
            details: { field }
          },
        }
      }
    }

    // ✅ Validar tipos
    if (typeof firstAd.price !== 'number') {
      return {
        error: {
          code: 'INVALID_TYPE',
          message: 'price deve ser um número (integer, em centavos)',
        },
      }
    }

    if (typeof firstAd.phone !== 'number') {
      return {
        error: {
          code: 'INVALID_TYPE',
          message: 'phone deve ser um número (sem formatação)',
        },
      }
    }

    if (!Array.isArray(firstAd.images) || firstAd.images.length === 0) {
      return {
        error: {
          code: 'INVALID_TYPE',
          message: 'images deve ser um array não-vazio (obrigatório desde 05/08/2024)',
        },
      }
    }

    return this.request('/autoupload/import', {
      method: 'PUT', // ✅ Método correto
      body: JSON.stringify(adData),
    })
  }

  /**
   * Consultar status da importação
   */
  async getImportStatus(token: string): Promise<OlxResponse> {
    logger.info('[OLX-API] Consultando status da importação:', token)
    return this.request(`/autoupload/import/${token}`, { method: 'GET' })
  }

  /**
   * Consultar status de anúncio publicado
   */
  async getAdStatus(listId: string): Promise<OlxResponse> {
    logger.info('[OLX-API] Consultando status do anúncio:', listId)
    return this.request(`/autoupload/ads/${listId}`, { method: 'GET' })
  }

  /**
   * ✅ CORREÇÃO: Deletar anúncio usando operation: delete
   */
  async deleteAd(adId: string): Promise<OlxResponse> {
    logger.info('[OLX-API] Deletando anúncio:', adId)

    const payload = {
      access_token: this.accessToken,
      ad_list: [
        {
          id: adId,
          operation: 'delete',
        },
      ],
    }

    return this.request('/autoupload/import', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }
}

/**
 * ✅ CORREÇÃO: Converter produto para formato OLX correto
 */
export function produtoToOlxAdvert(produto: any, siteUrl: string, accessToken: string) {
  logger.info('[OLX-CONVERTER] Convertendo produto:', produto.id)

  // ✅ CORREÇÃO 1: Coletar imagens corretamente
  const images: string[] = []

  if (produto.foto_principal) {
    const mainImageUrl = produto.foto_principal.startsWith('http')
      ? produto.foto_principal
      : `${siteUrl}${produto.foto_principal}`
    images.push(mainImageUrl)
  }

  if (produto.fotos && Array.isArray(produto.fotos)) {
    produto.fotos.forEach((foto: any) => {
      const imageUrl = foto.url?.startsWith('http') ? foto.url : `${siteUrl}${foto.url}`
      if (imageUrl && !images.includes(imageUrl)) {
        images.push(imageUrl)
      }
    })
  }

  // Garantir pelo menos 1 imagem
  if (images.length === 0) {
    logger.error('[OLX-CONVERTER] ❌ ERRO: Produto sem imagens!')
    images.push('https://via.placeholder.com/800x600?text=Sem+Imagem')
  }

  // Limitar a 20 imagens
  const finalImages = images.slice(0, 20)

  // ✅ CORREÇÃO 2: Descrição
  let description = produto.descricao || produto.nome || 'Produto sem descrição'

  const extras: string[] = []
  if (produto.nivel_bateria) extras.push(`🔋 Bateria: ${produto.nivel_bateria}%`)
  if (produto.condicao) extras.push(`📦 Condição: ${produto.condicao === 'novo' ? 'Novo' : 'Usado'}`)
  if (produto.garantia) extras.push(`✅ Garantia: ${produto.garantia}`)

  if (extras.length > 0) {
    description += '\n\n' + extras.join('\n')
  }

  // Limitar descrição a 6000 caracteres
  description = description.substring(0, 6000)

  // ✅ CORREÇÃO 3: Telefone sem formatação
  const phone = parseInt(String(produto.telefone || '77988776655').replace(/\D/g, '')) || 77988776655

  // ✅ CORREÇÃO 4: Preço em centavos (integer)
  const priceInCents = Math.round(produto.preco * 100)

  // ✅ CORREÇÃO 5: CEP sem formatação
  const zipcode = String(produto.zipcode || produto.cep || '45000-000').replace(/\D/g, '')

  // ✅ CORREÇÃO 6: Estrutura CORRETA conforme documentação
  const advert = {
    access_token: accessToken,
    ad_list: [
      {
        // ID único (máximo 19 caracteres)
        id: (produto.codigo_produto || produto.id).substring(0, 19),

        // Operação
        operation: 'insert',

        // Campos obrigatórios
        category: 3060, // Celulares e Smartphones
        subject: (produto.nome || 'iPhone').substring(0, 90),
        body: description,
        phone: phone, // ✅ NUMBER, não string!
        type: 's', // venda
        price: priceInCents, // ✅ INTEGER em centavos
        zipcode: zipcode, // ✅ String de 8 dígitos

        // Localização (opcionais mas recomendados)
        region: produto.region || 'ba',
        municipality: produto.municipality || 'Vitória da Conquista',

        // Imagens (obrigatório, máx 20)
        images: finalImages,

        // Parâmetros específicos da categoria
        params: {
          brand: getBrandId(produto.nome || ''),
          item_condition: produto.condicao === 'novo' ? 'new' : 'used',
        },
      },
    ],
  }

  logger.info('[OLX-CONVERTER] ✅ Anúncio montado:')
  logger.info(`  - ID: ${advert.ad_list[0].id}`)
  logger.info(`  - Título: ${advert.ad_list[0].subject}`)
  logger.info(`  - Preço: R$ ${(priceInCents / 100).toFixed(2)}`)
  logger.info(`  - Telefone: ${phone}`)
  logger.info(`  - CEP: ${zipcode}`)
  logger.info(`  - Imagens: ${finalImages.length}`)

  return advert
}

function getBrandId(productName: string): string {
  const name = productName.toLowerCase()
  const brands: Record<string, string> = {
    iphone: '25',
    apple: '25',
    samsung: '26',
    motorola: '27',
    xiaomi: '28',
    lg: '29',
  }

  for (const [keyword, brandId] of Object.entries(brands)) {
    if (name.includes(keyword)) return brandId
  }

  return '25' // Default: Apple
}