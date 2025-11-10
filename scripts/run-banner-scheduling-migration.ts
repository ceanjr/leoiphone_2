import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = 'https://aswejqbtejibrilrblnm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🔄 Executando migration de agendamento de banners...\n')

  const migrationPath = join(process.cwd(), 'supabase/migrations/20250110_add_banner_scheduling.sql')
  const sql = readFileSync(migrationPath, 'utf-8')

  try {
    // Executar migration
    const { error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      // Se RPC não existir, executar por partes
      console.log('⚠️  RPC não disponível, executando comandos manualmente...\n')

      // Adicionar colunas
      await supabase.from('banners').select('id').limit(1) // Test connection

      // Executar comandos SQL individualmente
      const commands = sql.split(';').filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'))

      for (const command of commands) {
        if (command.trim()) {
          try {
            const { error: cmdError } = await (supabase as any).rpc('execute_sql', {
              query: command.trim() + ';'
            })
            if (cmdError) {
              console.log(`⚠️  Comando pode já ter sido executado ou precisa de execução manual`)
            }
          } catch (e) {
            // Ignorar erros de comandos que já foram executados
          }
        }
      }

      console.log('✅ Migration concluída (verificar manualmente se necessário)\n')
      console.log('Para executar manualmente, use o SQL Dashboard do Supabase com o conteúdo de:')
      console.log('supabase/migrations/20250110_add_banner_scheduling.sql')
    } else {
      console.log('✅ Migration executada com sucesso!\n')
    }

    // Verificar se colunas foram adicionadas
    const { data, error: selectError } = await supabase
      .from('banners')
      .select('id, active_from, active_until, countdown_ends_at')
      .limit(1)

    if (selectError) {
      console.log('⚠️  Não foi possível verificar as colunas. Execute manualmente no Dashboard do Supabase.')
      console.log('SQL:', migrationPath)
    } else {
      console.log('✅ Colunas verificadas com sucesso!')
      console.log('Estrutura atual:', Object.keys(data?.[0] || {}))
    }
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error)
    console.log('\n📝 Execute manualmente no SQL Editor do Supabase:')
    console.log('supabase/migrations/20250110_add_banner_scheduling.sql')
  }
}

runMigration()
