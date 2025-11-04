/**
 * Script para Executar Migration SQL no Supabase
 *
 * Este script lê o arquivo de migration e executa no banco de dados Supabase
 *
 * Uso: npx tsx scripts/executar-migration.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function executarMigration() {
  console.log('🚀 Executando migration no Supabase...\n')

  // Ler arquivo de migration
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250131000000_create_produtos_custos.sql')

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Arquivo de migration não encontrado: ${migrationPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8')

  console.log('📄 Executando SQL...\n')

  try {
    // Executar SQL via RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('❌ Erro ao executar migration:', error)

      // Se o RPC não existe, tentar executar diretamente via REST API
      console.log('\n⚠️  Tentando abordagem alternativa...\n')

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ sql_query: sql })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      console.log('✅ Migration executada com sucesso!')
      return
    }

    console.log('✅ Migration executada com sucesso!')
    console.log('📊 Resultado:', data)

  } catch (error) {
    console.error('\n❌ Erro fatal:', error)
    console.log('\n📋 INSTRUÇÕES MANUAIS:')
    console.log('=' .repeat(60))
    console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard')
    console.log('2. Vá em "SQL Editor"')
    console.log('3. Copie e execute o SQL abaixo:\n')
    console.log(sql)
    console.log('=' .repeat(60))
    process.exit(1)
  }
}

executarMigration()
