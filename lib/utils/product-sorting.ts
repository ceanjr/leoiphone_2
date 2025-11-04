import { ORDEM_MODELOS, ORDEM_CAPACIDADES } from '@/lib/config/constants'
import type { Produto } from '@/types/produto'

/**
 * Extrai capacidade de armazenamento em GB
 */
export function extrairArmazenamento(nome: string): number {
  const matchGB = nome.match(/(\d+)\s*GB/i)
  if (matchGB) return parseInt(matchGB[1])

  const matchTB = nome.match(/(\d+)\s*TB/i)
  if (matchTB) return parseInt(matchTB[1]) * 1024

  return 0
}

/**
 * Extrai modelo e capacidade do nome do produto
 */
export function extrairModeloECapacidade(nome: string): {
  modelo: string
  capacidade: string
} {
  const nomeNorm = nome.trim()

  let capacidade = ''
  const matchCapacidade = nomeNorm.match(/(\d+\s*(GB|TB))/i)
  if (matchCapacidade) {
    capacidade = matchCapacidade[1].replace(/\s+/g, '').toUpperCase()
  }

  let modelo = nomeNorm
    .replace(/\s*-?\s*\d+\s*(GB|TB)/gi, '')
    .replace(/\s*-\s*.*$/, '')
    .trim()

  return { modelo, capacidade }
}

/**
 * Ordena produtos por modelo iPhone seguindo a ordem definida
 */
export function ordenarProdutosPorModelo(produtos: Produto[]): Produto[] {
  return produtos.sort((a, b) => {
    const { modelo: modeloA, capacidade: capacidadeA } = extrairModeloECapacidade(a.nome)
    const { modelo: modeloB, capacidade: capacidadeB } = extrairModeloECapacidade(b.nome)

    const indexA =
      ORDEM_MODELOS.findIndex((m) => modeloA.toLowerCase().trim() === m.toLowerCase().trim()) ||
      ORDEM_MODELOS.findIndex((m) => modeloA.toLowerCase().includes(m.toLowerCase()))
    const indexB =
      ORDEM_MODELOS.findIndex((m) => modeloB.toLowerCase().trim() === m.toLowerCase().trim()) ||
      ORDEM_MODELOS.findIndex((m) => modeloB.toLowerCase().includes(m.toLowerCase()))

    if (indexA === -1 && indexB === -1) {
      return a.nome.localeCompare(b.nome)
    }
    if (indexA === -1) return 1
    if (indexB === -1) return -1

    if (indexA !== indexB) {
      return indexA - indexB
    }

    const capIndexA = ORDEM_CAPACIDADES.indexOf(capacidadeA as any)
    const capIndexB = ORDEM_CAPACIDADES.indexOf(capacidadeB as any)

    if (capIndexA !== -1 && capIndexB !== -1) {
      if (capIndexA !== capIndexB) {
        return capIndexA - capIndexB
      }
    }

    return a.nome.localeCompare(b.nome)
  })
}
