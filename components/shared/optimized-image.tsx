'use client'

/**
 * Componente de imagem otimizada que substitui next/image
 * Suporta imagens do Cloudinary, Supabase e Firebase
 * Aplica otimizações automáticas via URL para Cloudinary
 * Usa loader customizado para Cloudinary (bypass Next.js optimization)
 */

import Image, { ImageProps, ImageLoader } from 'next/image'
import type { ImageSize } from '@/lib/utils/image-paths'

// Blur placeholder SVG (10x10px base64)
const BLUR_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMjEyMTIxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMGEwYTBhIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+'

// Cloudinary cloud name
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dvwtcedfs'

/**
 * Loader customizado para Cloudinary
 * Aplica transformações diretamente na URL, bypassing Next.js Image Optimization
 * Isso evita o erro 400 BAD_REQUEST com imagens grandes
 */
const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  // Se a URL já tem transformações, apenas retorna
  if (src.includes('/upload/f_') || src.includes('/upload/q_')) {
    return src
  }
  
  // Extrai a parte após /upload/ ou /upload/vXXXX/
  const uploadMatch = src.match(/\/upload\/(v\d+\/)?(.+)$/)
  if (!uploadMatch) return src
  
  const version = uploadMatch[1] || ''
  const publicIdWithExt = uploadMatch[2]
  
  // Remove extensão para aplicar f_auto
  const publicId = publicIdWithExt.replace(/\.[^.]+$/, '')
  
  // Monta URL com transformações
  const transforms = [
    'f_auto',           // Formato automático (WebP/AVIF)
    `q_${quality || 75}`, // Qualidade
    `w_${width}`,       // Largura requisitada pelo Next.js
    'c_limit'           // Não aumenta imagens menores
  ].join(',')
  
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transforms}/${version}${publicId}`
}

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
 * Detecta a origem da URL da imagem
 */
function getImageOrigin(src: string): 'cloudinary' | 'supabase' | 'firebase' | 'other' {
  if (src.includes('cloudinary.com') || src.includes('res.cloudinary.com')) return 'cloudinary'
  if (src.includes('supabase.co/storage')) return 'supabase'
  if (src.includes('firebasestorage.googleapis.com')) return 'firebase'
  return 'other'
}

/**
 * Verifica se deve usar blur placeholder
 * Apenas para imagens hospedadas (não data URLs ou SVGs)
 */
function shouldUseBlur(src: string): boolean {
  if (!src) return false
  if (src.startsWith('data:')) return false
  if (src.endsWith('.svg')) return false
  return true
}

/**
 * Componente OptimizedImage
 * Suporta Cloudinary, Supabase e Firebase
 * Aplica otimizações automáticas para Cloudinary
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
  // Detecta origem da imagem
  const origin = getImageOrigin(src)
  
  // Para Cloudinary, usa loader customizado (bypass Next.js Image Optimization)
  // Isso evita o erro 400 BAD_REQUEST com imagens grandes
  const isCloudinary = origin === 'cloudinary'

  // Usar blur placeholder por padrão para Cloudinary e Supabase
  const shouldBlur = shouldUseBlur(src) && !priority
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
      fetchPriority={fetchPriority || (priority ? 'high' : 'auto')}
      // Usa loader do Cloudinary para imagens do Cloudinary
      // Isso aplica transformações via URL e bypassa Next.js Image Optimization
      loader={isCloudinary ? cloudinaryLoader : undefined}
      // unoptimized não é necessário quando usamos loader customizado
    />
  )
}
