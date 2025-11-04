// Optimization Phase 2: Web Worker for heavy sorting operations
// This prevents blocking the main thread during product sorting

import type { Produto } from '@/types/produto'

interface SortMessage {
  type: 'sort'
  produtos: Produto[]
  ordenacao: 'menor_preco' | 'maior_preco' | 'recentes' | 'modelo'
}

// Função para ordenar produtos por modelo iPhone
function ordenarProdutosPorModelo(produtos: Produto[]): Produto[] {
  return produtos.sort((a, b) => {
    // Extrair número do modelo do nome
    const extrairNumero = (nome: string): number => {
      // Casos especiais
      if (
        nome.toLowerCase().includes('iphone x') &&
        !nome.toLowerCase().includes('xr') &&
        !nome.toLowerCase().includes('xs')
      )
        return 10 // iPhone X = 10
      if (nome.toLowerCase().includes('iphone xr')) return 10.3 // iPhone XR
      if (nome.toLowerCase().includes('iphone xs')) return 10.5 // iPhone XS

      // Extrair número padrão (8, 11, 12, 13, 14, 15, 16)
      const match = nome.match(/iphone\s+(\d+)/i)
      if (match) return parseInt(match[1])

      // Se não for iPhone, colocar no final
      return 9999
    }

    const numA = extrairNumero(a.nome)
    const numB = extrairNumero(b.nome)

    // Ordenar por número (crescente)
    if (numA !== numB) return numA - numB

    // Se forem do mesmo modelo, ordenar por nome (alfabético)
    return a.nome.localeCompare(b.nome)
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
