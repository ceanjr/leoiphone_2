// Optimization Phase 2: Web Worker for heavy sorting operations
// This prevents blocking the main thread during product sorting

import type { Produto } from '@/types/produto'

interface SortMessage {
  type: 'sort'
  produtos: Produto[]
  ordenacao: 'menor_preco' | 'maior_preco' | 'recentes' | 'modelo'
}

// Constantes duplicadas aqui pois Web Workers não podem importar módulos externos
const ORDEM_MODELOS = [
  'iPhone 7',
  'iPhone 7 Plus',
  'iPhone 8',
  'iPhone 8 Plus',
  'iPhone X',
  'iPhone XR',
  'iPhone XS',
  'iPhone XS Max',
  'iPhone 11',
  'iPhone 11 Pro',
  'iPhone 11 Pro Max',
  'iPhone 12',
  'iPhone 12 Mini',
  'iPhone 12 Pro',
  'iPhone 12 Pro Max',
  'iPhone 13',
  'iPhone 13 Mini',
  'iPhone 13 Pro',
  'iPhone 13 Pro Max',
  'iPhone 14',
  'iPhone 14 Plus',
  'iPhone 14 Pro',
  'iPhone 14 Pro Max',
  'iPhone 15',
  'iPhone 15 Plus',
  'iPhone 15 Pro',
  'iPhone 15 Pro Max',
  'iPhone 16',
  'iPhone 16 Plus',
  'iPhone 16 Pro',
  'iPhone 16 Pro Max',
  'iPhone 17',
  'iPhone 17 Air',
  'iPhone 17 Pro',
  'iPhone 17 Pro Max',
]

const ORDEM_CAPACIDADES = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB']

// Extrai modelo e capacidade do nome do produto
function extrairModeloECapacidade(nome: string): { modelo: string; capacidade: string } {
  const nomeNorm = nome.trim()

  // Extrair capacidade
  let capacidade = ''
  const matchCapacidade = nomeNorm.match(/(\d+\s*(GB|TB))/i)
  if (matchCapacidade) {
    capacidade = matchCapacidade[1].replace(/\s+/g, '').toUpperCase()
  }

  // Extrair modelo (tudo antes da capacidade ou nome completo)
  let modelo = nomeNorm
  if (matchCapacidade) {
    modelo = nomeNorm.substring(0, matchCapacidade.index).trim()
  }

  // Remover informações extras (cor, estado, etc) que podem vir depois
  modelo = modelo
    .replace(/\s*-\s*.*/g, '')
    .replace(/\s*\(.*\)/g, '')
    .trim()

  return { modelo, capacidade }
}

// Função para ordenar produtos por modelo iPhone, capacidade e preço
function ordenarProdutosPorModelo(produtos: Produto[]): Produto[] {
  return produtos.sort((a, b) => {
    const { modelo: modeloA, capacidade: capacidadeA } = extrairModeloECapacidade(a.nome)
    const { modelo: modeloB, capacidade: capacidadeB } = extrairModeloECapacidade(b.nome)

    // Buscar índice na ordem de modelos
    const indexA =
      ORDEM_MODELOS.findIndex((m) => modeloA.toLowerCase().trim() === m.toLowerCase().trim()) ||
      ORDEM_MODELOS.findIndex((m) => modeloA.toLowerCase().includes(m.toLowerCase()))
    const indexB =
      ORDEM_MODELOS.findIndex((m) => modeloB.toLowerCase().trim() === m.toLowerCase().trim()) ||
      ORDEM_MODELOS.findIndex((m) => modeloB.toLowerCase().includes(m.toLowerCase()))

    // Se um dos modelos não está na lista, colocar no final
    if (indexA === -1 && indexB === -1) {
      return a.preco - b.preco
    }
    if (indexA === -1) return 1
    if (indexB === -1) return -1

    // Se os modelos forem diferentes, ordenar pela ordem definida
    if (indexA !== indexB) {
      return indexA - indexB
    }

    // Mesmo modelo, ordenar por capacidade
    const capIndexA = ORDEM_CAPACIDADES.indexOf(capacidadeA)
    const capIndexB = ORDEM_CAPACIDADES.indexOf(capacidadeB)

    if (capIndexA !== -1 && capIndexB !== -1) {
      if (capIndexA !== capIndexB) {
        return capIndexA - capIndexB
      }
    }

    // Se não conseguiu ordenar por capacidade ou são iguais, ordenar por preço (menor primeiro)
    return a.preco - b.preco
  })
}

self.onmessage = (e: MessageEvent<SortMessage>) => {
  const { type, produtos, ordenacao } = e.data

  if (type === 'sort') {
    let produtosOrdenados: Produto[] = [...produtos]

    switch (ordenacao) {
      case 'menor_preco':
        produtosOrdenados.sort((a, b) => a.preco - b.preco)
        break
      case 'maior_preco':
        produtosOrdenados.sort((a, b) => b.preco - a.preco)
        break
      case 'recentes':
        produtosOrdenados.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        break
      case 'modelo':
      default:
        produtosOrdenados = ordenarProdutosPorModelo(produtosOrdenados)
        break
    }

    self.postMessage({ type: 'sorted', produtos: produtosOrdenados })
  }
}

export {}
