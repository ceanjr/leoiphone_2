export type Condicao = 'novo' | 'seminovo'

export type Garantia = 'nenhuma' | '3_meses' | '6_meses' | '1_ano'

export interface Acessorios {
  caixa: boolean
  carregador: boolean
  cabo: boolean
  capinha: boolean
  pelicula: boolean
}

export interface Produto {
  id: string
  codigo_produto: string | null
  nome: string
  slug: string
  descricao: string | null
  preco: number
  nivel_bateria: number | null
  condicao: Condicao
  categoria_id: string
  garantia: Garantia
  cor_oficial?: string | null // Campo legado - será migrado para 'cores'
  cores: string[] | null
  acessorios: Acessorios
  fotos: string[]
  foto_principal: string | null
  ativo: boolean
  estoque: number
  visualizacoes_total: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProdutoComCategoria extends Produto {
  categoria: {
    id: string
    nome: string
    slug: string
    ordem: number
  } | null
}

export interface ProdutoFormData {
  codigo_produto?: string | null
  nome: string
  descricao?: string
  preco: number
  nivel_bateria?: number | null
  condicao: Condicao
  categoria_id: string
  garantia: Garantia
  cores?: string[] | null
  acessorios: Acessorios
  fotos: string[]
  foto_principal?: string | null
  ativo: boolean
  estoque: number
}
