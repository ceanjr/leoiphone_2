/**
 * Script para Remover Foreign Key Constraint
 * 
 * Permite usar produto_id como categoria_id para produtos em destaque
 * 
 * Uso: npx tsx scripts/executar-migration-remove-fkey.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas')
  console.log('\n📋 EXECUTE MANUALMENTE NO SUPABASE SQL EDITOR:')
  console.log('='  .repeat(60))
  const sql = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20251104_remove_categoria_fkey_constraint.sql'),
    'utf-8'
  )
  console.log(sql)
  console.log('='  .repeat(60))
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function executarMigration() {
  console.log('🚀 Removendo foreign key constraint...\n')

  const migrationPath = path.join(
    process.cwd(), 
    'supabase/migrations/20251104_remove_categoria_fkey_constraint.sql'
  )

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Arquivo não encontrado: ${migrationPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8')

  console.log('📄 SQL a ser executado:\n')
  console.log(sql)
  console.log('\n⏳ Executando...\n')

  try {
    // Tentar executar via RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      throw error
    }

    console.log('✅ Migration executada com sucesso!')
    console.log('📊 Resultado:', data)
    console.log('\n✨ Agora você pode configurar produtos em destaque individualmente!')

  } catch (error) {
    console.error('\n❌ Erro ao executar via RPC:', error)
    console.log('\n📋 EXECUTE MANUALMENTE NO SUPABASE SQL EDITOR:')
    console.log('='  .repeat(60))
    console.log(sql)
    console.log('='  .repeat(60))
    console.log('\n💡 Acesse: https://supabase.com/dashboard → SQL Editor')
    process.exit(1)
  }
}

executarMigration()
