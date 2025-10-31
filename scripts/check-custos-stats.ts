import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as path from 'path'

config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkStats() {
  // Total de custos
  const { count: totalCustos } = await supabase
    .from('produtos_custos')
    .select('*', { count: 'exact', head: true })

  // Produtos únicos com custos
  const { data: custos } = await supabase
    .from('produtos_custos')
    .select('produto_id')

  const produtosUnicos = new Set(custos?.map(c => c.produto_id) || []).size

  console.log('📊 ESTATÍSTICAS DE CUSTOS')
  console.log('='.repeat(50))
  console.log(`Total de custos cadastrados: ${totalCustos}`)
  console.log(`Produtos únicos com custos: ${produtosUnicos}`)
  console.log('='.repeat(50))
}

checkStats()
