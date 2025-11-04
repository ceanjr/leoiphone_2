/**
 * Facebook Marketplace Partner Item API
 * Integração CORRETA para produtos aparecerem no Facebook Marketplace
 * 
 * Documentação: fb.md
 * API: Marketplace Partner Item API (não Commerce Platform API)
 */

export interface FacebookMarketplaceProduct {
  // Campos OBRIGATÓRIOS
  id: string // SKU único do produto
  title: string // Título (max 200 chars)
  description: string // Descrição (max 9999 chars, 256 visíveis)
  price: string // Formato: "4999.00 BRL"
  image_link: string // URL imagem principal (mínimo 500x500px)
  brand: string // Marca
  availability: 'in stock' | 'out of stock'
  condition: 'new' | 'refurbished' | 'used' | 'used_like_new' | 'used_good' | 'used_fair' | 'cpo' | 'open_box_new'
  link: string // URL do produto no site (mobile)
  
  // Campos OPCIONAIS mas RECOMENDADOS para Marketplace
  partner_product_checkout_uri?: string // URL de checkout/compra
  partner_product_location?: string // Localização (ex: "São Paulo, SP")
  partner_delivery_method?: string[] // ["shipping", "pickup"]
  partner_shipping_type?: 'fixed' | 'calculated'
  partner_shipping_cost?: string // Custo de envio
  partner_shipping_speed?: string // Ex: "3:5" (3-5 dias)
  partner_seller_id?: string // ID do vendedor
  partner_item_country?: string // "BR"
  
  // Imagens adicionais
  additional_image_link?: string[] // Até 10 imagens extras
  
  // Atributos extras
  partner_attribute_data?: Record<string, string> // Ex: {color: "blue", storage: "256GB"}
  
  // Devolução
  return_details?: {
    return_days: string
    return_type: 'SELLER_PAID_RETURN' | 'BUYER_PAID_RETURN' | 'NO_RETURN'
  }
}

export interface MarketplaceBatchRequest {
  method: 'CREATE' | 'UPDATE' | 'DELETE'
  data: FacebookMarketplaceProduct | { id: string } // DELETE só precisa do ID
}

export interface FacebookGraphResponse<T = any> {
  id?: string
  success?: boolean
  error?: {
    message: string
    type: string
    code: number
    error_subcode?: number
    fbtrace_id: string
  }
  data?: T
  handles?: string[]
}

export class FacebookMarketplaceAPI {
  private baseUrl = 'https://graph.facebook.com/v18.0'
  private accessToken: string
  private catalogId: string

  constructor(accessToken: string, catalogId: string) {
    this.accessToken = accessToken
    this.catalogId = catalogId
  }

  /**
   * Enviar produtos para o Marketplace usando batch API
   * Limite: 300 produtos por batch
   */
  async batchSendProducts(requests: MarketplaceBatchRequest[]): Promise<FacebookGraphResponse> {
    // Validar limite
    if (requests.length > 300) {
      throw new Error('Máximo de 300 produtos por batch. Use múltiplos batches.')
    }

    const endpoint = `${this.baseUrl}/${this.catalogId}/items_batch`
    
    const payload = {
      access_token: this.accessToken,
      item_type: 'PRODUCT_ITEM',
      requests: requests,
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Facebook API Error: ${error.error?.message || response.statusText}`)
    }

    return response.json()
  }

  /**
   * Criar um produto no Marketplace
   */
  async createProduct(product: FacebookMarketplaceProduct): Promise<FacebookGraphResponse> {
    return this.batchSendProducts([
      {
        method: 'CREATE',
        data: product,
      },
    ])
  }

  /**
   * Atualizar produto existente
   */
  async updateProduct(productId: string, updates: Partial<FacebookMarketplaceProduct>): Promise<FacebookGraphResponse> {
    const data: any = { id: productId, ...updates }
    
    return this.batchSendProducts([
      {
        method: 'UPDATE',
        data: data,
      },
    ])
  }

  /**
   * Deletar produto do Marketplace
   */
  async deleteProduct(productId: string): Promise<FacebookGraphResponse> {
    return this.batchSendProducts([
      {
        method: 'DELETE',
        data: { id: productId },
      },
    ])
  }

  /**
   * Criar múltiplos produtos de uma vez (batch)
   */
  async createProducts(products: FacebookMarketplaceProduct[]): Promise<FacebookGraphResponse> {
    const requests: MarketplaceBatchRequest[] = products.map((product) => ({
      method: 'CREATE',
      data: product,
    }))

    return this.batchSendProducts(requests)
  }

  /**
   * Validar access token
   */
  async validateToken(): Promise<boolean> {
    try {
      const endpoint = `${this.baseUrl}/me`
      const response = await fetch(`${endpoint}?access_token=${this.accessToken}`)
      const data = await response.json()

      return !data.error
    } catch (error) {
      return false
    }
  }

  /**
   * Verificar informações do catálogo
   */
  async getCatalogInfo(): Promise<FacebookGraphResponse> {
    const endpoint = `${this.baseUrl}/${this.catalogId}`

    const response = await fetch(
      `${endpoint}?access_token=${this.accessToken}&fields=id,name,product_count,vertical`,
      {
        method: 'GET',
      }
    )

    return response.json()
  }
}

/**
 * Converter produto do sistema para formato Marketplace
 */
export function produtoToMarketplaceProduct(
  produto: any,
  siteUrl: string
): FacebookMarketplaceProduct {
  // Mapear condição para formato Facebook
  let condition: FacebookMarketplaceProduct['condition'] = 'new'
  
  if (produto.condicao === 'seminovo') {
    if (produto.nivel_bateria >= 90) condition = 'used_like_new'
    else if (produto.nivel_bateria >= 85) condition = 'used_good'
    else condition = 'used_fair'
  } else if (produto.condicao === 'usado') {
    condition = 'used'
  }

  // Mapear disponibilidade
  const availability: FacebookMarketplaceProduct['availability'] =
    produto.estoque > 0 ? 'in stock' : 'out of stock'

  // Formatar preço para string com moeda
  const priceFormatted = `${produto.preco.toFixed(2)} BRL`

  // URL do produto
  const productUrl = `${siteUrl}/produto/${produto.slug}`

  // Preparar todas as imagens
  const allImages = produto.fotos?.filter((img: string) => img) || []
  const mainImage = produto.foto_principal || allImages[0] || ''
  const additionalImages = allImages.slice(1, 11) // Facebook permite até 10 imagens adicionais

  // Descrição rica
  let description = produto.descricao || `${produto.nome} ${produto.condicao === 'novo' ? 'novo' : 'seminovo'}.`
  
  // Adicionar informações extras na descrição
  const extras: string[] = []
  if (produto.nivel_bateria) extras.push(`Bateria: ${produto.nivel_bateria}%`)
  if (produto.garantia && produto.garantia !== 'nenhuma') extras.push(`Garantia: ${produto.garantia}`)
  if (produto.categoria?.nome) extras.push(`Categoria: ${produto.categoria.nome}`)
  
  if (extras.length > 0) {
    description += '\n\n' + extras.join(' • ')
  }

  // Atributos do produto
  const attributes: Record<string, string> = {}
  if (produto.cor) attributes.color = produto.cor
  if (produto.armazenamento) attributes.storage = produto.armazenamento
  if (produto.nivel_bateria) attributes.battery_health = `${produto.nivel_bateria}%`

  // Construir objeto do produto
  const marketplaceProduct: FacebookMarketplaceProduct = {
    // Obrigatórios
    id: produto.codigo_produto || produto.id,
    title: produto.nome.substring(0, 200), // Limite de 200 caracteres
    description: description.substring(0, 9999), // Limite de 9999 caracteres
    price: priceFormatted,
    image_link: mainImage,
    brand: 'Apple',
    availability: availability,
    condition: condition,
    link: productUrl,

    // Opcionais - Marketplace
    partner_product_checkout_uri: productUrl, // WhatsApp button na página
    partner_product_location: 'Brasil', // Ajustar se tiver localização específica
    partner_delivery_method: ['shipping', 'pickup'], // Entrega + retirada
    partner_shipping_type: 'calculated', // Calculado no checkout
    partner_item_country: 'BR',
    partner_seller_id: 'leoiphone',

    // Imagens adicionais
    ...(additionalImages.length > 0 && { additional_image_link: additionalImages }),

    // Atributos
    ...(Object.keys(attributes).length > 0 && { partner_attribute_data: attributes }),

    // Política de devolução
    return_details: {
      return_days: '7',
      return_type: 'SELLER_PAID_RETURN',
    },
  }

  return marketplaceProduct
}

