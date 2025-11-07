/**
 * Custom Image Loader para usar transformações do Supabase Storage
 * Evita custos de otimização de imagens da Vercel
 *
 * Supabase Storage suporta transformações via query parameters:
 * - width: largura da imagem
 * - height: altura da imagem
 * - quality: qualidade (1-100)
 * - format: formato (origin, webp, etc)
 */

export default function supabaseLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  // Se não for uma URL do Supabase, retorna a URL original
  if (!src.includes('supabase.co')) {
    return src
  }

  // Se a URL já tem parâmetros de transformação, retorna como está
  if (src.includes('?')) {
    return src
  }

  const url = new URL(src)
  const params = new URLSearchParams()

  // Adicionar largura
  params.set('width', width.toString())

  // Adicionar qualidade (padrão 75)
  params.set('quality', (quality || 75).toString())

  // Forçar formato WebP para melhor compressão
  params.set('format', 'webp')

  return `${url.origin}${url.pathname}?${params.toString()}`
}
