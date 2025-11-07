/**
 * Hook para determinar qual variante de imagem usar baseado no viewport
 * Otimiza o carregamento escolhendo o tamanho ideal para cada dispositivo
 */

import { useState, useEffect } from 'react'
import type { ImageSize } from '@/lib/utils/image-paths'

export function useImageVariant(): ImageSize {
  const [variant, setVariant] = useState<ImageSize>('medium')

  useEffect(() => {
    const updateVariant = () => {
      const width = window.innerWidth

      if (width <= 640) {
        setVariant('small') // Mobile
      } else if (width <= 1024) {
        setVariant('medium') // Tablet
      } else {
        setVariant('large') // Desktop
      }
    }

    // Detectar na montagem
    updateVariant()

    // Reagir a mudanças de tamanho (com debounce)
    let timeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeout)
      timeout = setTimeout(updateVariant, 150)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeout)
    }
  }, [])

  return variant
}
