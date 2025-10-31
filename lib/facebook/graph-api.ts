/**
 * Facebook Graph API Client
 * Integração com Facebook Commerce API para gerenciar produtos no Marketplace
 *
 * Documentação: https://developers.facebook.com/docs/commerce-platform/catalog
 */

export interface FacebookProduct {
  id?: string
  retailer_id: string // Seu código interno do produto
  name: string
  description: string
  url: string // URL do produto no seu site
  image_url: string
  price: number // Em centavos (ex: 4999.00 → 499900)
  currency: string // 'BRL'
  availability: 'in stock' | 'out of stock' | 'preorder' | 'available for order' | 'discontinued'
  condition: 'new' | 'refurbished' | 'used_like_new' | 'used_good' | 'used_fair'
  brand: string
  category?: string
  inventory?: number
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
}

export class FacebookGraphAPI {
  private baseUrl = 'https://graph.facebook.com/v18.0'
  private accessToken: string
  private catalogId: string

  constructor(accessToken: string, catalogId: string) {
    this.accessToken = accessToken
    this.catalogId = catalogId
  }

  /**
   * Criar produto no catálogo do Facebook
   */
  async createProduct(product: FacebookProduct): Promise<FacebookGraphResponse> {
    const endpoint = `${this.baseUrl}/${this.catalogId}/products`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: this.accessToken,
        retailer_id: product.retailer_id,
        name: product.name,
        description: product.description,
        url: product.url,
        image_url: product.image_url,
        price: Math.round(product.price * 100), // Converter para centavos
        currency: product.currency,
        availability: product.availability,
        condition: product.condition,
        brand: product.brand,
        category: product.category,
        inventory: product.inventory,
      }),
    })

    return response.json()
  }

  /**
   * Atualizar produto existente
   */
  async updateProduct(productId: string, updates: Partial<FacebookProduct>): Promise<FacebookGraphResponse> {
    const endpoint = `${this.baseUrl}/${productId}`

    const payload: Record<string, any> = {
      access_token: this.accessToken,
    }

    // Adicionar apenas campos que foram fornecidos
    if (updates.name) payload.name = updates.name
    if (updates.description) payload.description = updates.description
    if (updates.url) payload.url = updates.url
    if (updates.image_url) payload.image_url = updates.image_url
    if (updates.price !== undefined) payload.price = Math.round(updates.price * 100)
    if (updates.availability) payload.availability = updates.availability
    if (updates.condition) payload.condition = updates.condition
    if (updates.inventory !== undefined) payload.inventory = updates.inventory

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return response.json()
  }

  /**
   * Remover produto do catálogo
   */
  async deleteProduct(productId: string): Promise<FacebookGraphResponse> {
    const endpoint = `${this.baseUrl}/${productId}`

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: this.accessToken,
      }),
    })

    return response.json()
  }

  /**
   * Buscar produto por retailer_id (seu código interno)
   */
  async getProductByRetailerId(retailerId: string): Promise<FacebookGraphResponse> {
    const endpoint = `${this.baseUrl}/${this.catalogId}/products`

    const response = await fetch(
      `${endpoint}?access_token=${this.accessToken}&filter={"retailer_id":{"eq":"${retailerId}"}}`,
      {
        method: 'GET',
      }
    )

    return response.json()
  }

  /**
   * Listar todos os produtos do catálogo
   */
  async listProducts(limit = 100): Promise<FacebookGraphResponse> {
    const endpoint = `${this.baseUrl}/${this.catalogId}/products`

    const response = await fetch(
      `${endpoint}?access_token=${this.accessToken}&limit=${limit}&fields=id,retailer_id,name,price,availability,condition`,
      {
        method: 'GET',
      }
    )

    return response.json()
  }

  /**
   * Atualizar disponibilidade de produto (estoque)
   */
  async updateAvailability(
    productId: string,
    availability: FacebookProduct['availability'],
    inventory?: number
  ): Promise<FacebookGraphResponse> {
    return this.updateProduct(productId, { availability, inventory })
  }

  /**
   * Criar produtos em lote (batch)
   * Mais eficiente para criar múltiplos produtos
   */
  async batchCreateProducts(products: FacebookProduct[]): Promise<FacebookGraphResponse> {
    const endpoint = `${this.baseUrl}`

    const batch = products.map((product, index) => ({
      method: 'POST',
      relative_url: `${this.catalogId}/products`,
      body: new URLSearchParams({
        retailer_id: product.retailer_id,
        name: product.name,
        description: product.description,
        url: product.url,
        image_url: product.image_url,
        price: Math.round(product.price * 100).toString(),
        currency: product.currency,
        availability: product.availability,
        condition: product.condition,
        brand: product.brand,
      }).toString(),
      name: `product_${index}`,
    }))

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: this.accessToken,
        batch: JSON.stringify(batch),
      }),
    })

    return response.json()
  }

  /**
   * Verificar status do catálogo
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
}

/**
 * Utilitário: Converter produto do sistema para formato Facebook
 */
export function produtoToFacebookProduct(
  produto: any,
  siteUrl: string
): FacebookProduct {
  // Mapear condição
  let condition: FacebookProduct['condition'] = 'new'
  if (produto.condicao === 'seminovo') {
    if (produto.nivel_bateria >= 90) condition = 'used_like_new'
    else if (produto.nivel_bateria >= 80) condition = 'used_good'
    else condition = 'used_fair'
  }

  // Mapear disponibilidade
  const availability: FacebookProduct['availability'] =
    produto.estoque > 0 ? 'in stock' : 'out of stock'

  return {
    retailer_id: produto.codigo_produto || produto.id,
    name: produto.nome,
    description: produto.descricao || `${produto.nome} - ${produto.condicao === 'novo' ? 'Novo' : 'Seminovo'}`,
    url: `${siteUrl}/produto/${produto.slug}`,
    image_url: produto.foto_principal || '',
    price: produto.preco,
    currency: 'BRL',
    availability,
    condition,
    brand: 'Apple',
    category: 'Smartphones',
    inventory: produto.estoque || 0,
  }
}
