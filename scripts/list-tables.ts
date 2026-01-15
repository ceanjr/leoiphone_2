// Script para listar todas as tabelas do Supabase
// Executar com: npx tsx scripts/list-tables.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aswejqbtejibrilrblnm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY não definida')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listAllTables() {
  console.log('=== LISTANDO TODAS AS TABELAS DO SUPABASE ===\n')

  // Listar tabelas conhecidas tentando fazer select
  const knownTables = [
    'produtos',
    'categorias',
    'banners',
    'configuracoes_taxas',
    'presets_taxas',
    'produtos_custos',
    'site_metrics',
    'secoes_home',
    'produtos_secoes',
    'conversions',
    'active_sessions',
    'page_views',
    'banner_produto_clicks',
    'olx_config',
    'olx_anuncios',
    'olx_sync_log',
    'facebook_anuncios',
    'facebook_sync_log',
    'produtos_destaque',
    'categoria_produtos_relacionados',
    'config_produtos_relacionados',
    'historico_precos'
  ]

  console.log('Verificando tabelas:\n')

  const existingTables: string[] = []
  const nonExistingTables: string[] = []

  for (const table of knownTables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ ${table} - NÃO EXISTE`)
      nonExistingTables.push(table)
    } else {
      console.log(`✅ ${table} - EXISTE (${count ?? 0} registros)`)
      existingTables.push(table)
    }
  }

  console.log('\n--- RESUMO ---')
  console.log(`Tabelas existentes: ${existingTables.length}`)
  console.log(`Tabelas não existentes: ${nonExistingTables.length}`)

  return { existingTables, nonExistingTables }
}

async function listViews() {
  console.log('\n=== VERIFICANDO VIEWS ===\n')

  const knownViews = [
    'v_olx_anuncios_com_produto',
    'v_produtos_destaque',
    'v_produtos_destaque_com_categoria',
    'banner_produtos_clicks_stats',
    'site_metrics_stats'
  ]

  for (const view of knownViews) {
    const { error } = await supabase
      .from(view)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ ${view} - NÃO EXISTE`)
    } else {
      console.log(`✅ ${view} - EXISTE`)
    }
  }
}

async function main() {
  await listAllTables()
  await listViews()

  console.log('\n=== FIM DA VERIFICAÇÃO ===')
}

main().catch(console.error)
