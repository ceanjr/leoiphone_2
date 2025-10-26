import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Ler variáveis de ambiente do .env.local
const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('📋 Ordem atual das categorias:\n')

const { data, error } = await supabase
  .from('categorias')
  .select('nome, ordem')
  .order('ordem', { ascending: true })

if (error) {
  console.error('❌ Erro:', error)
} else {
  data.forEach((cat, index) => {
    console.log(`  ${String(index + 1).padStart(2, ' ')}. [${String(cat.ordem).padStart(3, ' ')}] ${cat.nome}`)
  })
}
