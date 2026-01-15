'use server'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'

// Categorias de acessórios (mostrarão produtos de qualquer categoria)
const CATEGORIAS_ACESSORIOS = [
  'acessórios apple',
  'amazon',
  'apple watch',
  'cabos e carregadores',
  'caixas de som',
  'fones de ouvido',
  'ipad',
  'tablet',
  'smartwatch',
  'videogames',
]

// Categorias de celulares/smartphones (mostrarão apenas acessórios)
const CATEGORIAS_CELULARES_KEYWORDS = [
  'iphone',
  'motorola',
  'realme',
  'samsung',
  'xiaomi',
  'lacrado',
]

/**
 * Determina se uma categoria é de celulares/smartphones
 */
function isCategoriacelular(categoriaNome: string): boolean {
  const nome = categoriaNome.toLowerCase()
  return CATEGORIAS_CELULARES_KEYWORDS.some((keyword) => nome.includes(keyword))
}

/**
 * Determina se uma categoria é de acessórios
 */
function isCategoriaAcessorio(categoriaNome: string): boolean {
  const nome = categoriaNome.toLowerCase()
  return CATEGORIAS_ACESSORIOS.some((acessorio) => nome.includes(acessorio))
}

/**
 * Busca produtos relacionados para exibir na página do produto
 * Lógica simplificada:
 * - Categorias de celulares (iPhone, Motorola, etc.): mostram produtos de acessórios
 * - Categorias de acessórios: mostram produtos de qualquer categoria
 * - Sem descontos ou configurações complexas
 */
export async function getProdutosRelacionados(
  produtoId: string,
  categoriaId: string,
  limit: number = 3
): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const supabase = await createClient()

    // Buscar informações da categoria atual
    const { data: categoriaAtual } = await (supabase as any)
      .from('categorias')
      .select('nome')
      .eq('id', categoriaId)
      .single()

    if (!categoriaAtual) {
      return { data: [], error: null }
    }

    // Buscar todas as categorias ativas
    const { data: todasCategorias } = await (supabase as any)
      .from('categorias')
      .select('id, nome')
      .eq('ativo', true)

    if (!todasCategorias || todasCategorias.length === 0) {
      return { data: [], error: null }
    }

    let categoriasAlvo: string[] = []
    const ehCelular = isCategoriacelular(categoriaAtual.nome)
    const ehAcessorio = isCategoriaAcessorio(categoriaAtual.nome)

    if (ehCelular) {
      // Se é categoria de celular, mostrar produtos de categorias de acessórios
      categoriasAlvo = todasCategorias
        .filter((cat: any) => isCategoriaAcessorio(cat.nome))
        .map((cat: any) => cat.id)
    } else if (ehAcessorio) {
      // Se é categoria de acessório, mostrar produtos de qualquer categoria (exceto a própria)
      categoriasAlvo = todasCategorias
        .filter((cat: any) => cat.id !== categoriaId)
        .map((cat: any) => cat.id)
    } else {
      // Fallback: mostrar produtos de acessórios
      categoriasAlvo = todasCategorias
        .filter((cat: any) => isCategoriaAcessorio(cat.nome))
        .map((cat: any) => cat.id)
    }

    if (categoriasAlvo.length === 0) {
      return { data: [], error: null }
    }

    // Buscar produtos das categorias alvo
    const { data: produtos } = await (supabase as any)
      .from('produtos')
      .select('*, categoria:categorias(id, nome, slug)')
      .in('categoria_id', categoriasAlvo)
      .eq('ativo', true)
      .is('deleted_at', null)
      .neq('id', produtoId)
      .limit(limit * 5)

    if (!produtos || produtos.length === 0) {
      return { data: [], error: null }
    }

    // Shuffle simples baseado em ID para ordem determinística
    const shuffled = produtos.sort((a: any, b: any) => {
      const hashA = a.id.charCodeAt(0) % 100
      const hashB = b.id.charCodeAt(0) % 100
      return hashA - hashB
    })

    // Retornar produtos sem aplicar desconto
    const produtosFinais = shuffled.slice(0, limit)

    logger.log(
      '[getProdutosRelacionados] Retornando',
      produtosFinais.length,
      'produtos relacionados'
    )

    return { data: produtosFinais, error: null }
  } catch (error) {
    logger.error('[getProdutosRelacionados] Erro:', error)
    if (error instanceof Error) {
      return { data: null, error: error.message }
    }
    return { data: null, error: 'Erro ao buscar produtos relacionados' }
  }
}
