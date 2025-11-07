/**
 * Utilitários para caminhos de imagens otimizadas
 * SAFE PARA CLIENT-SIDE - Não importa sharp ou módulos Node.js
 */

export type ImageSize = 'thumb' | 'small' | 'medium' | 'large' | 'original'

/**
 * Gera o caminho completo para uma variante de imagem
 * @param basePath Caminho base da imagem (sem sufixo de tamanho)
 * @param size Tamanho desejado
 * @returns Caminho completo com sufixo de tamanho
 */
export function getImagePath(basePath: string, size: ImageSize): string {
  // Remove extensão se existir
  const pathWithoutExt = basePath.replace(/\.[^/.]+$/, '')

  // Se já tem sufixo de tamanho, remove
  const pathWithoutSize = pathWithoutExt.replace(/-(thumb|small|medium|large|original)$/, '')

  // Adiciona novo sufixo
  return `${pathWithoutSize}-${size}.webp`
}

/**
 * Extrai o caminho base de uma URL de imagem (remove sufixo de tamanho)
 * @param imagePath Caminho completo da imagem
 * @returns Caminho base sem sufixo de tamanho
 */
export function getBasePath(imagePath: string): string {
  // Remove extensão
  const pathWithoutExt = imagePath.replace(/\.[^/.]+$/, '')

  // Remove sufixo de tamanho se existir
  return pathWithoutExt.replace(/-(thumb|small|medium|large|original)$/, '')
}
