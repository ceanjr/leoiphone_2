'use client'

/**
 * Componente de imagem otimizada que substitui next/image
 * Usa lazy loading nativo do next/image e blur placeholders
 * Simplificado para evitar problemas com múltiplos Intersection Observers
 */

import Image, { ImageProps } from 'next/image'
import type { ImageSize } from '@/lib/utils/image-paths'

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
 * Componente OptimizedImage
 * Simplificado para usar lazy loading nativo do next/image
 * Evita criar múltiplos Intersection Observers que causavam travamento no mobile
 */
export function OptimizedImage({
  src,
  alt,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  variant,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Usar blur placeholder por padrão para imagens do Supabase
  const shouldBlur = isSupabaseImage(src) && !priority
  const finalPlaceholder = placeholder || (shouldBlur ? 'blur' : undefined)
  const finalBlurDataURL = blurDataURL || (shouldBlur ? BLUR_DATA_URL : undefined)

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      sizes={sizes}
      width={width}
      priority={priority}
      loading={priority ? 'eager' : loading || 'lazy'}
      placeholder={finalPlaceholder}
      blurDataURL={finalBlurDataURL}
      unoptimized
      fetchPriority={fetchPriority || (priority ? 'high' : 'auto')}
    />
  )
}
