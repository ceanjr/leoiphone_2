/**
 * Utilitário de otimização de imagens
 * Gera múltiplas versões otimizadas para diferentes tamanhos de tela
 * Economiza custos de otimização da Vercel
 *
 * ATENÇÃO: Este arquivo usa sharp e só deve ser importado em código SERVER-SIDE
 * Para funções de path, use ./image-paths.ts
 */

import sharp from 'sharp'
import type { ImageSize } from './image-paths'

export type { ImageSize } from './image-paths'
export { getImagePath, getBasePath } from './image-paths'

export interface OptimizedImageVariant {
  size: ImageSize
  buffer: Buffer
  width: number
  height: number
  filename: string
}

export interface ImageDimensions {
  thumb: number
  small: number
  medium: number
  large: number
}

/**
 * Dimensões para cada variante
 * Baseado na análise de uso do site:
 * - thumb: thumbnails, listagens em modo lista (112px)
 * - small: cards mobile, galeria thumbnails (300-400px)
 * - medium: cards desktop, produtos relacionados (600-800px)
 * - large: imagem principal, galeria fullscreen (1200px)
 */
export const IMAGE_DIMENSIONS: ImageDimensions = {
  thumb: 112,   // Thumbnails pequenos
  small: 400,   // Mobile cards
  medium: 800,  // Desktop cards
  large: 1200,  // Imagem principal
}

/**
 * Configurações de qualidade para cada tamanho
 */
const QUALITY_SETTINGS = {
  thumb: 70,   // Thumbnails podem ter qualidade menor
  small: 75,   // Mobile
  medium: 80,  // Desktop
  large: 85,   // Imagem principal
  original: 90 // Backup da original
}

/**
 * Otimiza uma imagem gerando múltiplas versões
 * @param buffer Buffer da imagem original
 * @param filename Nome base do arquivo (sem extensão)
 * @param sizes Tamanhos a gerar (padrão: todos)
 * @returns Array de variantes otimizadas
 */
export async function optimizeImage(
  buffer: Buffer,
  filename: string,
  sizes: ImageSize[] = ['thumb', 'small', 'medium', 'large', 'original']
): Promise<OptimizedImageVariant[]> {
  const variants: OptimizedImageVariant[] = []

  // Obter metadados da imagem original
  const metadata = await sharp(buffer).metadata()
  const originalWidth = metadata.width || 1200
  const originalHeight = metadata.height || 1200

  // Nome base sem extensão
  const baseName = filename.replace(/\.[^/.]+$/, '')

  for (const size of sizes) {
    if (size === 'original') {
      // Manter original mas em WebP com boa qualidade
      const optimizedBuffer = await sharp(buffer)
        .webp({ quality: QUALITY_SETTINGS.original, effort: 6 })
        .toBuffer()

      variants.push({
        size: 'original',
        buffer: optimizedBuffer,
        width: originalWidth,
        height: originalHeight,
        filename: `${baseName}-original.webp`,
      })
      continue
    }

    const targetWidth = IMAGE_DIMENSIONS[size]
    const quality = QUALITY_SETTINGS[size]

    // Não fazer upscale - se imagem for menor que target, usar tamanho original
    const width = Math.min(targetWidth, originalWidth)

    // Calcular altura proporcional
    const height = Math.round((originalHeight / originalWidth) * width)

    // Otimizar e converter para WebP
    const optimizedBuffer = await sharp(buffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 6 })
      .toBuffer()

    variants.push({
      size,
      buffer: optimizedBuffer,
      width,
      height,
      filename: `${baseName}-${size}.webp`,
    })
  }

  return variants
}

/**
 * Detecta qual tamanho usar baseado no viewport width
 * @param viewportWidth Largura do viewport em pixels
 * @returns Tamanho ideal para o viewport
 */
export function detectOptimalSize(viewportWidth: number): ImageSize {
  if (viewportWidth <= 640) return 'small'   // Mobile
  if (viewportWidth <= 1024) return 'medium' // Tablet
  return 'large' // Desktop
}

/**
 * Calcula estatísticas de economia de tamanho
 */
export function calculateSavings(
  originalSize: number,
  optimizedSize: number
): { savings: number; percentage: number } {
  const savings = originalSize - optimizedSize
  const percentage = Math.round((savings / originalSize) * 100)

  return { savings, percentage }
}
