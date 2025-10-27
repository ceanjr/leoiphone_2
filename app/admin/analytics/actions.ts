'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function resetAnalytics() {
  const supabase = await createClient()

  const { error: produtosError } = await supabase
    .from('produtos')
    // @ts-ignore
    .update({ visualizacoes_total: 0 })
    .neq('visualizacoes_total', 0)

  if (produtosError) {
    console.error('Erro ao zerar visualizações totais:', produtosError)
    return {
      success: false,
      error: 'Não foi possível zerar as visualizações dos produtos',
    }
  }

  const { error: diariasError } = await supabase
    .from('visualizacoes_diarias')
    // @ts-ignore
    .update({ total_views: 0 })
    .neq('total_views', 0)

  if (diariasError) {
    console.error('Erro ao zerar visualizações diárias:', diariasError)
    return {
      success: false,
      error: 'Não foi possível zerar o histórico diário de visualizações',
    }
  }

  revalidatePath('/admin/analytics')
  revalidatePath('/admin/dashboard')

  return { success: true }
}
