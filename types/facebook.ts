export interface FacebookAnuncio {
  id: string
  produto_id: string
  facebook_product_id: string | null
  facebook_catalog_id: string | null
  status: 'pendente' | 'anunciado' | 'erro' | 'pausado' | 'removido'
  status_facebook: string | null
  titulo: string
  descricao: string | null
  preco: number
  url_imagem: string | null
  disponibilidade: 'in stock' | 'out of stock'
  condicao: 'new' | 'refurbished' | 'used'
  erro_mensagem: string | null
  sincronizado_em: string | null
  created_at: string
  updated_at: string
}

export interface FacebookAnuncioComProduto extends FacebookAnuncio {
  produto_nome: string
  codigo_produto: string
  produto_slug: string
  produto_imagem: string | null
  produto_ativo: boolean
  produto_estoque: number
  produto_nivel_bateria: number | null
  categoria_nome: string | null
}

export interface FacebookConfig {
  id: string
  app_id: string
  app_secret: string
  access_token: string
  catalog_id: string
  page_id: string | null
  business_id: string | null
  sync_enabled: boolean
  auto_sync: boolean
  sync_interval_minutes: number
  token_expires_at: string | null
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface FacebookSyncLog {
  id: string
  anuncio_id: string | null
  acao: 'criar' | 'atualizar' | 'remover' | 'pausar' | 'reativar'
  status: 'sucesso' | 'erro'
  mensagem: string | null
  request_payload: any
  response_data: any
  created_at: string
}

export interface CriarAnuncioInput {
  produto_id: string
  titulo?: string
  descricao?: string
}

export interface AtualizarAnuncioInput {
  anuncio_id: string
  titulo?: string
  descricao?: string
  preco?: number
  disponibilidade?: 'in stock' | 'out of stock'
}
