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

        // IMPORTANTE: Verificar statusCode interno da OLX (pode ser -6, -1, etc)
        if (data.statusCode && data.statusCode < 0) {
          logger.error('[OLX-API] ❌ Erro interno da OLX:', data.statusCode)
          logger.error('[OLX-API] Mensagem:', data.statusMessage)
          logger.error('[OLX-API] Errors:', data.errors)

          // Mapear códigos de erro da OLX
          let errorMessage = data.statusMessage || 'Erro da OLX'

          if (data.statusCode === -6) {
            errorMessage =
              'Sem permissão para criar anúncios. Verifique: (1) Token com scope "autoupload", (2) Plano ativo, (3) Limite de anúncios'
          } else if (data.statusCode === -1) {
            errorMessage = 'Erro genérico da OLX. Verifique os logs para mais detalhes.'
          }

          // Se há erros específicos, adicionar
          if (data.errors && data.errors.length > 0) {
            const firstError = data.errors[0]
            if (firstError.message) {
              errorMessage += ` | ${firstError.message}`
            }
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

        // Verificar se token é null com erros (outro formato de erro)
        if (data.token === null && data.errors && data.errors.length > 0) {
          logger.error('[OLX-API] ❌ Erro de validação:', data.errors)

          return {
            error: {
              code: 'VALIDATION_ERROR',
              message: data.errors[0]?.message || 'Erro de validação dos dados',
              details: data.errors,
            },
            status: response.status,
          }
        }

        // Se HTTP não é 2xx, mas JSON é válido
        if (!response.ok) {
          return {
            error: {
              code: response.status,
              message: data.message || data.reason || `Erro HTTP ${response.status}`,
              details: data,
            },
            status: response.status,
          }
        }

        return { data, status: response.status }
      } else {
        const text = await response.text()
        logger.error('[OLX-API] Resposta não é JSON:', text.substring(0, 200))

        if (text.includes('Cloudflare')) {
          return {
            error: {
              code: 'CLOUDFLARE_BLOCK',
              message: 'Bloqueado pelo Cloudflare. Token inválido ou sem permissões.',
              details: { hint: 'Verifique se o token tem scope "autoupload"' },
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
   * CORREÇÃO: Usar /autoupload/balance para validar token
   * Este endpoint retorna info do plano e confirma que o token é válido
   */
  async getBalance(): Promise<OlxResponse> {
    logger.info('[OLX-API] Consultando saldo/plano...')
    return this.request('/autoupload/balance', { method: 'GET' })
  }

  /**
   * Listar anúncios publicados (também valida token)
   */
  async listPublishedAds(): Promise<OlxResponse> {
    logger.info('[OLX-API] Listando anúncios publicados...')
    return this.request('/autoupload/v1/published', { method: 'GET' })
  }

  /**
   * Criar anúncio
   * IMPORTANTE: Método PUT, não POST!
   */
  async createAd(adData: any): Promise<OlxResponse> {
    logger.info('[OLX-API] Criando anúncio...')

    return this.request('/autoupload/import', {
      method: 'PUT', // ← CORREÇÃO: OLX usa PUT!
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
   * Deletar anúncio (via import com operation: delete)
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
 * Converter produto para formato OLX
 */
export function produtoToOlxAdvert(produto: any, siteUrl: string, accessToken: string) {
  logger.info('[OLX-CONVERTER] Convertendo produto:', produto.id)

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

  // Descrição
  let description = produto.descricao || produto.nome || ''

  const extras: string[] = []
  if (produto.nivel_bateria) extras.push(`🔋 Bateria: ${produto.nivel_bateria}%`)
  if (produto.condicao)
    extras.push(`📦 Condição: ${produto.condicao === 'novo' ? 'Novo' : 'Usado'}`)
  if (produto.garantia) extras.push(`✅ Garantia: ${produto.garantia}`)

  if (extras.length > 0) {
    description += '\n\n' + extras.join('\n')
  }

  // Estrutura conforme documentação OLX
  const advert = {
    access_token: accessToken,
    ad_list: [
      {
        // ID único do anúncio (use o ID do produto)
        id: produto.codigo_produto || produto.id,

        // Operação: insert, edit ou delete
        operation: 'insert',

        // Campos obrigatórios
        subject: (produto.nome || 'iPhone').substring(0, 90),
        body: description.substring(0, 6000),
        category: 3060, // Celulares e Smartphones
        type: 's', // venda

        // Preço (obrigatório desde 05/08/2024)
        price: Math.round(produto.preco * 100), // Em centavos

        // Localização obrigatória
        region: produto.region || 'ba',
        municipality: produto.municipality || 'Vitória da Conquista',
        zipcode: produto.zipcode || '45000-000', // CEP obrigatório

        // Imagens (obrigatório desde 05/08/2024, máx 20)
        images: images.slice(0, 20),

        // Parâmetros específicos da categoria
        params: {
          brand: getBrandId(produto.nome || ''),
          item_condition: produto.condicao === 'novo' ? 'new' : 'used',
        },
      },
    ],
  }

  logger.info('[OLX-CONVERTER] Anúncio montado com', images.length, 'imagens')
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

  return '25'
}
