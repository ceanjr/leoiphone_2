import type { Produto } from './produto'

export interface Categoria {
  id: string
  nome: string
  slug: string
  ordem: number
}

export interface Secao {
  id: string
  tipo: 'destaques' | 'promocoes' | 'lancamentos'
  titulo: string
  subtitulo: string | null
  produtos: Produto[]
}

export interface ProdutosAgrupados {
  categoria: Categoria
  produtos: Produto[]
}

export interface SecaoConfig {
  icon: string
  borderColor: string
  bgGradient: string
  badge: string
  badgeColor: string
}
