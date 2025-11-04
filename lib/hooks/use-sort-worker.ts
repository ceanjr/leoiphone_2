// Optimization Phase 2: Hook to use Web Worker for sorting
// Prevents main thread blocking during heavy operations

import { useCallback, useRef } from 'react'
import type { Produto } from '@/types/produto'
import { logger } from '@/lib/utils/logger'

type OrdenacaoType = 'menor_preco' | 'maior_preco' | 'recentes' | 'modelo'

export function useSortWorker() {
  const workerRef = useRef<Worker | null>(null)

  const sortProdutos = useCallback(
    (produtos: Produto[], ordenacao: OrdenacaoType): Promise<Produto[]> => {
      return new Promise((resolve, reject) => {
        // Check if Web Workers are supported
        if (typeof Worker === 'undefined') {
          // Fallback: sort on main thread
          logger.warn('Web Workers not supported, sorting on main thread')
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
            logger.error('Worker error:', error)
            reject(error)
          })

          // Send sort request to worker
          worker.postMessage({
            type: 'sort',
            produtos,
            ordenacao,
          })
        } catch (error) {
          logger.error('Error creating worker:', error)
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
      // Importar dinamicamente para evitar circular dependency
      const { ordenarProdutosPorModelo } = require('@/lib/utils/produtos/helpers')
      return ordenarProdutosPorModelo(produtosOrdenados)
  }
}
