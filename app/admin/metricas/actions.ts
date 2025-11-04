'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export interface BannerClickStats {
  banner_id: string
  produto_id: string
  produto_nome: string
  produto_slug: string
  total_clicks: number
  unique_visitors: number
  first_click_at: string
  last_click_at: string
}

export interface BannerStats {
  id: string
  titulo: string
  total_clicks: number
  unique_visitors: number
  produtos: BannerClickStats[]
}

export async function getBannerClickStats(): Promise<{
  data: BannerStats[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data: banners, error: bannersError } = await supabase
      .from('banners')
      .select('id, titulo, tipo')
      .eq('tipo', 'produtos_destaque')
      .eq('ativo', true)
      .order('ordem')

    if (bannersError) {
      logger.error('Erro ao buscar banners:', bannersError)
      return { data: null, error: 'Erro ao buscar banners' }
    }

    if (!banners || banners.length === 0) {
      return { data: [], error: null }
    }

    const stats: BannerStats[] = []

    for (const banner of banners) {
      const { data: clickStats, error: statsError } = await (supabase as any)
        .from('banner_produtos_clicks_stats')
        .select(`
          banner_id,
          produto_id,
          total_clicks,
          unique_visitors,
          first_click_at,
          last_click_at,
          produtos:produto_id (
            nome,
            slug
          )
        `)
        .eq('banner_id', banner.id)

      if (statsError) {
        logger.error(`Erro ao buscar stats do banner ${banner.id}:`, statsError)
        continue
      }

      const totalClicks = clickStats?.reduce((sum, stat) => sum + Number(stat.total_clicks), 0) || 0
      const uniqueVisitors = clickStats?.reduce((sum, stat) => sum + Number(stat.unique_visitors), 0) || 0

      const produtos: BannerClickStats[] = (clickStats || []).map((stat: any) => ({
        banner_id: stat.banner_id,
        produto_id: stat.produto_id,
        produto_nome: stat.produtos?.nome || 'Produto não encontrado',
        produto_slug: stat.produtos?.slug || '',
        total_clicks: Number(stat.total_clicks),
        unique_visitors: Number(stat.unique_visitors),
        first_click_at: stat.first_click_at,
        last_click_at: stat.last_click_at,
      }))

      stats.push({
        id: banner.id,
        titulo: banner.titulo,
        total_clicks: totalClicks,
        unique_visitors: uniqueVisitors,
        produtos: produtos.sort((a, b) => b.total_clicks - a.total_clicks),
      })
    }

    return { data: stats, error: null }
  } catch (error) {
    logger.error('Exceção ao buscar stats de banners:', error)
    return { data: null, error: 'Erro ao buscar estatísticas' }
  }
}
