import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.leoiphone.com.br'

  // Buscar todos os produtos ativos
  const { data: produtos } = await supabase
    .from('produtos')
    .select('slug, updated_at')
    .eq('ativo', true)
    .is('deleted_at', null)
    .returns<Array<{ slug: string; updated_at: string }>>()

  // Buscar categorias ativas
  const { data: categorias } = await supabase
    .from('categorias')
    .select('slug, updated_at')
    .eq('ativo', true)
    .returns<Array<{ slug: string; updated_at: string }>>()

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Páginas de produtos
  const produtoPages: MetadataRoute.Sitemap = (produtos || []).map((produto) => ({
    url: `${baseUrl}/produto/${produto.slug}`,
    lastModified: new Date(produto.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Páginas de categorias (se houver rotas)
  const categoriaPages: MetadataRoute.Sitemap = (categorias || []).map((categoria) => ({
    url: `${baseUrl}/categoria/${categoria.slug}`,
    lastModified: new Date(categoria.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...produtoPages, ...categoriaPages]
}
