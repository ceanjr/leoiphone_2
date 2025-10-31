/**
 * Script de Análise de Qualidade da Importação
 *
 * Analisa os custos importados e identifica:
 * - Matches corretos (alta qualidade)
 * - Matches duvidosos (precisam revisão)
 * - Estatísticas gerais
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as path from 'path'

config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function analisarQualidade() {
  console.log('🔍 ANÁLISE DE QUALIDADE DA IMPORTAÇÃO\n')

  // Buscar todos os produtos com custos
  const { data: produtosComCustos } = await supabase
    .from('produtos_custos')
    .select(`
      id,
      custo,
      estoque,
      codigo,
      created_at,
      produto:produtos(
        id,
        nome,
        categoria_id
      )
    `)
    .order('created_at', { ascending: false })

  if (!produtosComCustos) {
    console.error('❌ Erro ao buscar custos')
    return
  }

  // Buscar categorias
  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nome')

  const categoriasMap = new Map(categorias?.map(c => [c.id, c.nome]) || [])

  // Agrupar por produto
  const produtosAgrupados = new Map<string, any[]>()
  for (const custo of produtosComCustos) {
    const produtoId = (custo.produto as any).id
    if (!produtosAgrupados.has(produtoId)) {
      produtosAgrupados.set(produtoId, [])
    }
    produtosAgrupados.get(produtoId)!.push(custo)
  }

  console.log(`📊 Total de produtos com custos: ${produtosAgrupados.size}`)
  console.log(`📊 Total de custos cadastrados: ${produtosComCustos.length}\n`)

  // Analisar custos por categoria
  const custosPorCategoria = new Map<string, number>()
  for (const custos of produtosAgrupados.values()) {
    const produto = (custos[0].produto as any)
    const categoriaNome = categoriasMap.get(produto.categoria_id) || 'Sem categoria'
    custosPorCategoria.set(
      categoriaNome,
      (custosPorCategoria.get(categoriaNome) || 0) + 1
    )
  }

  console.log('📈 PRODUTOS COM CUSTOS POR CATEGORIA:')
  console.log('='.repeat(60))
  const categoriasOrdenadas = Array.from(custosPorCategoria.entries())
    .sort((a, b) => b[1] - a[1])

  for (const [categoria, count] of categoriasOrdenadas) {
    console.log(`  ${categoria.padEnd(30)} ${count} produtos`)
  }

  console.log('\n' + '='.repeat(60))

  // Listar custos mais recentes (últimas importações)
  console.log('\n📦 ÚLTIMAS 30 IMPORTAÇÕES:')
  console.log('='.repeat(80))

  const ultimosCustos = produtosComCustos.slice(0, 30)
  for (const custo of ultimosCustos) {
    const produto = (custo.produto as any)
    const categoriaNome = categoriasMap.get(produto.categoria_id) || '???'
    const data = new Date(custo.created_at).toLocaleString('pt-BR')

    console.log(`[${data}]`)
    console.log(`  Produto: ${produto.nome}`)
    console.log(`  Categoria: ${categoriaNome}`)
    console.log(`  Custo: R$ ${custo.custo.toFixed(2)} | Estoque: ${custo.estoque}`)
    console.log('')
  }

  console.log('='.repeat(80))

  // Identificar possíveis matches incorretos (heurística simples)
  console.log('\n⚠️  POSSÍVEIS MATCHES INCORRETOS (para revisão manual):')
  console.log('='.repeat(80))

  const matchesDuvidosos = []

  // Heurística 1: Custos muito baixos para iPhones (< R$ 500)
  for (const custos of produtosAgrupados.values()) {
    const produto = (custos[0].produto as any)
    if (produto.nome.toLowerCase().includes('iphone')) {
      for (const custo of custos) {
        if (custo.custo < 500) {
          matchesDuvidosos.push({
            tipo: 'iPhone com custo muito baixo',
            produto: produto.nome,
            custo: custo.custo,
            estoque: custo.estoque
          })
        }
      }
    }
  }

  // Heurística 2: Custos muito altos para acessórios (> R$ 1000)
  const categoriasAcessorios = ['Acessórios', 'Cabos', 'Carregadores']
  for (const custos of produtosAgrupados.values()) {
    const produto = (custos[0].produto as any)
    const categoriaNome = categoriasMap.get(produto.categoria_id) || ''

    if (categoriasAcessorios.some(c => categoriaNome.includes(c))) {
      for (const custo of custos) {
        if (custo.custo > 1000) {
          matchesDuvidosos.push({
            tipo: 'Acessório com custo muito alto',
            produto: produto.nome,
            categoria: categoriaNome,
            custo: custo.custo,
            estoque: custo.estoque
          })
        }
      }
    }
  }

  // Heurística 3: Apple Watches com custos muito diferentes (variação > 2x)
  for (const custos of produtosAgrupados.values()) {
    const produto = (custos[0].produto as any)
    if (produto.nome.toLowerCase().includes('watch')) {
      if (custos.length > 1) {
        const custoValores = custos.map(c => c.custo).sort((a, b) => a - b)
        const menor = custoValores[0]
        const maior = custoValores[custoValores.length - 1]

        if (maior / menor > 2) {
          matchesDuvidosos.push({
            tipo: 'Custos muito diferentes para mesmo produto',
            produto: produto.nome,
            custos: custoValores.map(v => `R$ ${v.toFixed(2)}`).join(', ')
          })
        }
      }
    }
  }

  if (matchesDuvidosos.length > 0) {
    for (const match of matchesDuvidosos) {
      console.log(`⚠️  ${match.tipo}:`)
      console.log(`   Produto: ${match.produto}`)
      if (match.categoria) console.log(`   Categoria: ${match.categoria}`)
      if (match.custo !== undefined) console.log(`   Custo: R$ ${match.custo.toFixed(2)}`)
      if (match.custos) console.log(`   Custos: ${match.custos}`)
      console.log('')
    }
  } else {
    console.log('✅ Nenhum match duvidoso detectado!')
  }

  console.log('='.repeat(80))
  console.log('\n✅ Análise concluída!')
}

analisarQualidade().catch(console.error)
