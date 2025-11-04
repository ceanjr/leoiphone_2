import { createClient } from '@/lib/supabase/client'

function isProduction(): boolean {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname.includes('leoiphone.com.br') || hostname.includes('vercel.app')
}

function getVisitorId(): string | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('visitor_id')
  return stored || null
}

export type MetricType = 
  | 'calculadora_taxas_open'
  | 'calculadora_taxas_calculate'
  | 'calculadora_taxas_share'
  | 'calculadora_taxas_download'
  | 'whatsapp_click'
  | 'banner_produto_click'
  | 'produto_view'
  | 'troca_modal_open'
  | 'compra_modal_open'

interface TrackMetricOptions {
  metricType: MetricType
  metadata?: Record<string, any>
}

export async function trackMetric({ metricType, metadata = {} }: TrackMetricOptions): Promise<void> {
  if (!isProduction()) {
    console.log('[Metrics] Tracking disabled in development:', metricType, metadata)
    return
  }

  const supabase = createClient()
  const visitorId = getVisitorId()

  const { error } = await supabase
    .from('site_metrics')
    .insert({
      metric_type: metricType,
      visitor_id: visitorId,
      metadata: metadata || {},
    } as any)

  if (error) {
    console.error('[Metrics] Failed to track metric:', error.message)
  }
}

export async function resetMetric(metricType: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('site_metrics')
    .delete()
    .eq('metric_type', metricType)

  if (error) {
    console.error('[Metrics] Failed to reset metric:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getMetricsStats(period: 'today' | 'week' | 'month' | 'all' = 'all') {
  const supabase = createClient()
  
  let query = supabase
    .from('site_metrics')
    .select('metric_type, visitor_id, created_at')

  const now = new Date()
  
  if (period === 'today') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    query = query.gte('created_at', startOfDay.toISOString())
  } else if (period === 'week') {
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    query = query.gte('created_at', startOfWeek.toISOString())
  } else if (period === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    query = query.gte('created_at', startOfMonth.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('[Metrics] Failed to fetch metrics:', error.message)
    return {}
  }

  const stats: Record<string, { total: number; unique: number }> = {}

  data?.forEach((metric: any) => {
    if (!stats[metric.metric_type]) {
      stats[metric.metric_type] = { total: 0, unique: 0 }
    }
    stats[metric.metric_type].total++
  })

  // Count unique visitors per metric
  const uniqueVisitors = new Map<string, Set<string>>()
  data?.forEach((metric: any) => {
    if (metric.visitor_id) {
      if (!uniqueVisitors.has(metric.metric_type)) {
        uniqueVisitors.set(metric.metric_type, new Set())
      }
      uniqueVisitors.get(metric.metric_type)?.add(metric.visitor_id)
    }
  })

  uniqueVisitors.forEach((visitors, metricType) => {
    if (stats[metricType]) {
      stats[metricType].unique = visitors.size
    }
  })

  return stats
}
