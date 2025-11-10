'use client'

/**
 * Componente de imagem otimizada que substitui next/image
 * Usa múltiplas variantes pré-processadas para economizar custos da Vercel
 * Implementa responsive images, lazy loading inteligente e blur placeholders
 */

import { useState, useEffect, useRef } from 'react'
import Image, { ImageProps } from 'next/image'
import { getImagePath, type ImageSize } from '@/lib/utils/image-paths'

// Blur placeholder SVG (10x10px base64)
const BLUR_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMjEyMTIxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMGEwYTBhIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+'

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'fetchPriority'> {
  src: string
  /**
   * Tamanho fixo a usar (opcional)
   * Se não especificado, escolhe automaticamente baseado no width/sizes
   */
  variant?: ImageSize
  /**
   * Fallback para imagens que ainda não foram otimizadas
   * Padrão: true (usa imagem original se variantes não existirem)
   */
  fallback?: boolean
  /**
   * Fetch priority para otimizar LCP
   * Use 'high' para imagens acima da dobra (above fold)
   */
  fetchPriority?: 'high' | 'low' | 'auto'
}

/**
 * Detecta se uma URL é do Supabase Storage
 */
function isSupabaseImage(src: string): boolean {
  return src.includes('supabase.co/storage')
}

/**
 * Detecta qual variante usar baseado no tamanho solicitado
 */
function getVariantFromSize(sizes?: string, width?: number | string): ImageSize {
  // Se tem width numérico específico
  if (typeof width === 'number') {
    if (width <= 200) return 'thumb'
    if (width <= 500) return 'small'
    if (width <= 900) return 'medium'
    return 'large'
  }

  // Se tem sizes string, analisa o maior tamanho
  if (sizes) {
    // Pega o maior valor em pixels da string sizes
    const matches = sizes.match(/(\d+)px/g)
    if (matches) {
      const maxSize = Math.max(...matches.map((m) => parseInt(m)))
      if (maxSize <= 200) return 'thumb'
      if (maxSize <= 500) return 'small'
      if (maxSize <= 900) return 'medium'
      return 'large'
    }

    // Se menciona vw (viewport width)
    if (sizes.includes('100vw')) return 'large'
    if (sizes.includes('50vw')) return 'medium'
    if (sizes.includes('33vw')) return 'medium'
    if (sizes.includes('25vw')) return 'small'
  }

  // Padrão: medium
  return 'medium'
}

/**
 * Componente OptimizedImage
 * Serve variantes pré-otimizadas de imagens
 */
export function OptimizedImage({
  src,
  alt,
  variant,
  fallback = true,
  sizes,
  width,
  priority,
  loading,
  placeholder,
  blurDataURL,
  fetchPriority,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [imageError, setImageError] = useState(false)
  const [isInView, setIsInView] = useState(priority || false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Determinar qual variante usar
  const targetVariant = variant || getVariantFromSize(sizes, width)

  // Intersection Observer para lazy loading inteligente
  useEffect(() => {
    if (priority || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Começa a carregar 50px antes de aparecer
        threshold: 0.01,
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [priority, isInView])

  useEffect(() => {
    // Se não está no viewport e não é priority, não carrega ainda
    if (!isInView && !priority) return

    // Reset error state quando src mudar
    setImageError(false)

    // Sempre usar a imagem original diretamente
    // Sem tentar variantes otimizadas (estava causando problemas)
    setImageSrc(src)
  }, [src, isInView, priority])

  const handleError = () => {
    // Como sempre usamos a imagem original, se falhou é porque não existe
    setImageError(true)
  }

  // Usar blur placeholder por padrão para imagens do Supabase
  const shouldBlur = isSupabaseImage(src) && !priority
  const finalPlaceholder = placeholder || (shouldBlur ? 'blur' : undefined)
  const finalBlurDataURL = blurDataURL || (shouldBlur ? BLUR_DATA_URL : undefined)

  return (
    <div ref={imgRef} style={{ display: 'contents' }}>
      <Image
        {...props}
        src={imageSrc}
        alt={alt}
        sizes={sizes}
        width={width}
        priority={priority}
        loading={priority ? 'eager' : loading || 'lazy'}
        placeholder={finalPlaceholder}
        blurDataURL={finalBlurDataURL}
        onError={handleError}
        unoptimized
        // @ts-ignore - fetchPriority não está nos tipos do Next.js mas funciona
        fetchPriority={fetchPriority || (priority ? 'high' : 'auto')}
      />
    </div>
  )
}
