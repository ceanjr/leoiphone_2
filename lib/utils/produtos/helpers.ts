/**
 * Utilitários para manipulação de produtos
 * Centraliza funções comuns de extração, ordenação e formatação
 */

import { ORDEM_MODELOS, ORDEM_CAPACIDADES } from '@/lib/config/constants'
import type { Produto } from '@/types/produto'

/**
 * Extrai capacidade de armazenamento em GB do nome do produto
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

/**
 * Ordena produtos por modelo iPhone e capacidade
 */
export function ordenarProdutosPorModelo<T extends Produto>(produtos: T[]): T[] {
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
      return a.nome.localeCompare(b.nome)
    }
    if (indexA === -1) return 1
    if (indexB === -1) return -1

    // Se os modelos forem diferentes, ordenar pela ordem definida
    if (indexA !== indexB) {
      return indexA - indexB
    }

    // Mesmo modelo, ordenar por capacidade
    const capIndexA = (ORDEM_CAPACIDADES as readonly string[]).indexOf(capacidadeA)
    const capIndexB = (ORDEM_CAPACIDADES as readonly string[]).indexOf(capacidadeB)

    if (capIndexA !== -1 && capIndexB !== -1) {
      if (capIndexA !== capIndexB) {
        return capIndexA - capIndexB
      }
    }

    // Se não conseguiu ordenar por capacidade ou são iguais, ordenar alfabeticamente
    return a.nome.localeCompare(b.nome)
  })
}

/**
 * Formata preço em BRL
 */
export function formatPreco(preco: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(preco)
}

/**
 * Calcula desconto percentual
 */
export function calcularDesconto(precoOriginal: number, precoAtual: number): number {
  if (precoOriginal <= precoAtual) return 0
  return Math.round(((precoOriginal - precoAtual) / precoOriginal) * 100)
}

/**
 * Extrai slug de uma string (para URLs)
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}
