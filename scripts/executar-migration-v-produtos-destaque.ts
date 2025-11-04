/**
 * Script para Criar View v_produtos_destaque
 * 
 * Uso: npx tsx scripts/executar-migration-v-produtos-destaque.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function executarMigration() {
  console.log('🚀 Criando view v_produtos_destaque...\n')

  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251104_create_v_produtos_destaque.sql')

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Arquivo não encontrado: ${migrationPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8')

  console.log('📄 Executando SQL...\n')

  try {
    // Tentar executar via RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.log('⚠️  Executando via SQL Editor manual...\n')
      console.log('📋 COPIE E EXECUTE NO SUPABASE SQL EDITOR:')
      console.log('='.repeat(60))
      console.log(sql)
      console.log('='.repeat(60))
      console.log('\n💡 Acesse: https://supabase.com/dashboard -> SQL Editor')
      process.exit(1)
    }

    console.log('✅ View criada com sucesso!')
    console.log('📊 Resultado:', data)

  } catch (error) {
    console.error('\n❌ Erro:', error)
    console.log('\n📋 EXECUTE MANUALMENTE NO SUPABASE SQL EDITOR:')
    console.log('='.repeat(60))
    console.log(sql)
    console.log('='.repeat(60))
    process.exit(1)
  }
}

executarMigration()
