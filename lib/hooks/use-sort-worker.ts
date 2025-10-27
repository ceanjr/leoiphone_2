// Optimization Phase 2: Hook to use Web Worker for sorting
// Prevents main thread blocking during heavy operations

import { useCallback, useRef } from 'react'
import type { Produto } from '@/types/produto'

type OrdenacaoType = 'menor_preco' | 'maior_preco' | 'recentes' | 'modelo'

export function useSortWorker() {
  const workerRef = useRef<Worker | null>(null)

  const sortProdutos = useCallback(
    (produtos: Produto[], ordenacao: OrdenacaoType): Promise<Produto[]> => {
      return new Promise((resolve, reject) => {
        // Check if Web Workers are supported
        if (typeof Worker === 'undefined') {
          // Fallback: sort on main thread
          console.warn('Web Workers not supported, sorting on main thread')
          resolve(sortOnMainThread(produtos, ordenacao))
          return
        }

        try {
          // Create worker if it doesn't exist
          if (!workerRef.current) {
            workerRef.current = new Worker(
              new URL('../workers/sort-products.worker.ts', import.meta.url),
              { type: 'module' }
            )
          }

          const worker = workerRef.current

          // Set up one-time message listener
          const handleMessage = (e: MessageEvent) => {
            if (e.data.type === 'sorted') {
              worker.removeEventListener('message', handleMessage)
              resolve(e.data.produtos)
            }
          }

          worker.addEventListener('message', handleMessage)
          worker.addEventListener('error', (error) => {
            console.error('Worker error:', error)
            reject(error)
          })

          // Send sort request to worker
          worker.postMessage({
            type: 'sort',
            produtos,
            ordenacao,
          })
        } catch (error) {
          console.error('Error creating worker:', error)
          // Fallback to main thread
          resolve(sortOnMainThread(produtos, ordenacao))
        }
      })
    },
    []
  )

  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
  }, [])

  return { sortProdutos, cleanup }
}

// Fallback sorting on main thread
function sortOnMainThread(produtos: Produto[], ordenacao: OrdenacaoType): Produto[] {
  const produtosOrdenados = [...produtos]

  switch (ordenacao) {
    case 'menor_preco':
      return produtosOrdenados.sort((a, b) => a.preco - b.preco)
    case 'maior_preco':
      return produtosOrdenados.sort((a, b) => b.preco - a.preco)
    case 'recentes':
      return produtosOrdenados.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    case 'modelo':
    default:
      return ordenarProdutosPorModelo(produtosOrdenados)
  }
}

function ordenarProdutosPorModelo(produtos: Produto[]): Produto[] {
  return produtos.sort((a, b) => {
    const extrairNumero = (nome: string): number => {
      if (
        nome.toLowerCase().includes('iphone x') &&
        !nome.toLowerCase().includes('xr') &&
        !nome.toLowerCase().includes('xs')
      )
        return 10
      if (nome.toLowerCase().includes('iphone xr')) return 10.3
      if (nome.toLowerCase().includes('iphone xs')) return 10.5

      const match = nome.match(/iphone\s+(\d+)/i)
      if (match) return parseInt(match[1])

      return 9999
    }

    const numA = extrairNumero(a.nome)
    const numB = extrairNumero(b.nome)

    if (numA !== numB) return numA - numB
    return a.nome.localeCompare(b.nome)
  })
}
