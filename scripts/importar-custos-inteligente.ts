/**
 * Script de Importação INTELIGENTE de Custos de Produtos
 *
 * Este script usa algoritmos de fuzzy matching e análise de texto
 * para importar produtos que não foram importados pelo script básico.
 *
 * Recursos:
 * - Fuzzy matching de nomes (similaridade de strings)
 * - Detecção de informações da descrição (bateria, mm, tipos de cabo)
 * - Normalização inteligente de textos
 * - Análise de características dos produtos
 *
 * Uso: npx tsx scripts/importar-custos-inteligente.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface CsvRow {
  nome: string
  custo: string
  codigo: string
  estoque: string
}

interface ProdutoSupabase {
  id: string
  nome: string
  descricao: string | null
  codigo_produto: string | null
  condicao: 'novo' | 'seminovo'
}

/**
 * Calcula a similaridade entre duas strings (algoritmo de Levenshtein simplificado)
 * Retorna um valor entre 0 e 1 (1 = idêntico, 0 = completamente diferente)
 */
function calcularSimilaridade(str1: string, str2: string): number {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()

  // Casos especiais
  if (s1 === s2) return 1
  if (s1.length === 0 || s2.length === 0) return 0

  // Matriz de distância de Levenshtein
  const matriz: number[][] = []

  for (let i = 0; i <= s2.length; i++) {
    matriz[i] = [i]
  }

  for (let j = 0; j <= s1.length; j++) {
    matriz[0][j] = j
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matriz[i][j] = matriz[i - 1][j - 1]
      } else {
        matriz[i][j] = Math.min(
          matriz[i - 1][j - 1] + 1, // substituição
          matriz[i][j - 1] + 1,     // inserção
          matriz[i - 1][j] + 1      // deleção
        )
      }
    }
  }

  const distancia = matriz[s2.length][s1.length]
  const maxLength = Math.max(s1.length, s2.length)

  return 1 - distancia / maxLength
}

/**
 * Normaliza texto removendo acentos, pontuação e espaços extras
 */
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' ') // Múltiplos espaços -> 1 espaço
    .trim()
}

/**
 * Extrai características do produto do nome/descrição
 */
function extrairCaracteristicas(texto: string): {
  bateria?: number
  mm?: number
  tipoCabo?: string
  capacidade?: string
  marca?: string
  modelo?: string
} {
  const caracteristicas: any = {}
  const textoLower = texto.toLowerCase()

  // Detectar bateria (ex: "Saúde da bateria: 85%", "85%", "bateria 85")
  const matchBateria = texto.match(/(?:bateria|saúde|battery).*?(\d{2,3})%?/i)
  if (matchBateria) {
    caracteristicas.bateria = parseInt(matchBateria[1], 10)
  }

  // Detectar milímetros (relógios: "44mm", "45mm", "49mm")
  const matchMm = texto.match(/(\d{2})mm/i)
  if (matchMm) {
    caracteristicas.mm = parseInt(matchMm[1], 10)
  }

  // Detectar tipo de cabo
  if (textoLower.includes('usb-c') && textoLower.includes('lightning')) {
    caracteristicas.tipoCabo = 'usb-c-lightning'
  } else if (textoLower.includes('type-c') && textoLower.includes('lightning')) {
    caracteristicas.tipoCabo = 'type-c-lightning'
  } else if (textoLower.includes('usb-c') && textoLower.includes('usb-c')) {
    caracteristicas.tipoCabo = 'usb-c-usb-c'
  } else if (textoLower.includes('type-c') && textoLower.includes('type-c')) {
    caracteristicas.tipoCabo = 'type-c-type-c'
  } else if (textoLower.includes('usb') && textoLower.includes('lightning')) {
    caracteristicas.tipoCabo = 'usb-lightning'
  }

  // Detectar capacidade (ex: "128GB", "10000mAh", "5000mah")
  const matchCapacidade = texto.match(/(\d+)\s*(GB|TB|mAh)/i)
  if (matchCapacidade) {
    caracteristicas.capacidade = matchCapacidade[0].toLowerCase()
  }

  // Detectar marca comum
  const marcas = ['apple', 'samsung', 'xiaomi', 'jbl', 'baseus', 'kingo', 'peining', 'ugreen']
  for (const marca of marcas) {
    if (textoLower.includes(marca)) {
      caracteristicas.marca = marca
      break
    }
  }

  return caracteristicas
}

/**
 * Compara características entre dois produtos e retorna score de compatibilidade
 */
function compararCaracteristicas(
  car1: ReturnType<typeof extrairCaracteristicas>,
  car2: ReturnType<typeof extrairCaracteristicas>
): number {
  let score = 0
  let checks = 0

  // Comparar bateria (se ambos têm)
  if (car1.bateria && car2.bateria) {
    checks++
    // Diferença de até 5% é aceitável
    if (Math.abs(car1.bateria - car2.bateria) <= 5) {
      score += 1
    } else if (Math.abs(car1.bateria - car2.bateria) <= 10) {
      score += 0.5
    }
  }

  // Comparar mm (tamanho de relógio)
  if (car1.mm && car2.mm) {
    checks++
    if (car1.mm === car2.mm) {
      score += 1
    }
  }

  // Comparar tipo de cabo
  if (car1.tipoCabo && car2.tipoCabo) {
    checks++
    if (car1.tipoCabo === car2.tipoCabo) {
      score += 1
    }
  }

  // Comparar capacidade
  if (car1.capacidade && car2.capacidade) {
    checks++
    if (car1.capacidade === car2.capacidade) {
      score += 1
    }
  }

  // Comparar marca
  if (car1.marca && car2.marca) {
    checks++
    if (car1.marca === car2.marca) {
      score += 1
    }
  }

  return checks > 0 ? score / checks : 0
}

/**
 * Busca inteligente de produto com fuzzy matching
 */
async function buscarProdutoInteligente(
  nomeCsv: string,
  produtos: ProdutoSupabase[]
): Promise<{ produto: ProdutoSupabase | null; confianca: number; motivo: string }> {
  const nomeCsvNorm = normalizarTexto(nomeCsv)
  const carCsv = extrairCaracteristicas(nomeCsv)

  let melhorMatch: ProdutoSupabase | null = null
  let melhorScore = 0
  let melhorMotivo = ''

  for (const produto of produtos) {
    const nomeProdNorm = normalizarTexto(produto.nome)
    const descProdNorm = produto.descricao ? normalizarTexto(produto.descricao) : ''

    // 1. Similaridade de nome
    const simNome = calcularSimilaridade(nomeCsvNorm, nomeProdNorm)

    // 2. Similaridade com descrição (se houver)
    const simDesc = descProdNorm ? calcularSimilaridade(nomeCsvNorm, descProdNorm) : 0

    // 3. Extrair características do produto
    const carProd = extrairCaracteristicas(produto.nome + ' ' + (produto.descricao || ''))

    // 4. Comparar características
    const simCaracteristicas = compararCaracteristicas(carCsv, carProd)

    // 5. Calcular score final (ponderado)
    let scoreFinal = 0
    let motivo = ''

    // Se tem alta similaridade de nome (>70%), peso maior no nome
    if (simNome >= 0.7) {
      scoreFinal = simNome * 0.7 + simCaracteristicas * 0.3
      motivo = `Nome similar (${(simNome * 100).toFixed(0)}%)`
    }
    // Se tem características compatíveis mas nome menos similar
    else if (simCaracteristicas >= 0.8 && simNome >= 0.4) {
      scoreFinal = simNome * 0.4 + simCaracteristicas * 0.6
      motivo = `Características compatíveis (${(simCaracteristicas * 100).toFixed(0)}%)`
    }
    // Se tem boa similaridade com descrição
    else if (simDesc >= 0.6) {
      scoreFinal = simDesc * 0.6 + simCaracteristicas * 0.4
      motivo = `Descrição similar (${(simDesc * 100).toFixed(0)}%)`
    }
    // Score baseado apenas em nome
    else {
      scoreFinal = simNome
      motivo = `Nome parcialmente similar (${(simNome * 100).toFixed(0)}%)`
    }

    // Verificar se é o melhor match até agora
    if (scoreFinal > melhorScore) {
      melhorScore = scoreFinal
      melhorMatch = produto
      melhorMotivo = motivo
    }
  }

  // Retornar apenas se confiança >= 60%
  if (melhorScore >= 0.6 && melhorMatch) {
    return {
      produto: melhorMatch,
      confianca: melhorScore,
      motivo: melhorMotivo,
    }
  }

  return { produto: null, confianca: 0, motivo: 'Nenhum match encontrado' }
}

/**
 * Normaliza custo
 */
function normalizarCusto(custoStr: string): number {
  if (!custoStr || custoStr.trim() === '') return 0
  return parseFloat(custoStr.replace(',', '.'))
}

/**
 * Normaliza estoque
 */
function normalizarEstoque(estoqueStr: string): number {
  if (!estoqueStr || estoqueStr.trim() === '') return 1
  return parseInt(estoqueStr, 10)
}

/**
 * Insere custo no banco
 */
async function inserirCusto(
  produtoId: string,
  custo: number,
  estoque: number,
  codigo: string | null
): Promise<boolean> {
  try {
    const { error } = await supabase.from('produtos_custos').insert({
      produto_id: produtoId,
      custo,
      estoque,
      codigo,
    })

    if (error) {
      console.error(`❌ Erro ao inserir custo:`, error.message)
      return false
    }

    return true
  } catch (error) {
    console.error(`❌ Erro ao inserir custo:`, error)
    return false
  }
}

/**
 * Função principal
 */
async function importarCustosInteligente() {
  console.log('🚀 Iniciando importação INTELIGENTE de custos...\n')

  // Ler CSV
  const csvPath = path.join(process.cwd(), 'custos.csv')

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Arquivo não encontrado: ${csvPath}`)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const rows: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  console.log(`📄 Total de linhas no CSV: ${rows.length}\n`)

  // Buscar todos os produtos do catálogo
  console.log('📦 Carregando produtos do catálogo...')
  const { data: produtos, error: produtosError } = await supabase
    .from('produtos')
    .select('id, nome, descricao, codigo_produto, condicao')
    .eq('ativo', true)
    .is('deleted_at', null)

  if (produtosError || !produtos) {
    console.error('❌ Erro ao carregar produtos:', produtosError?.message)
    process.exit(1)
  }

  console.log(`✅ ${produtos.length} produtos carregados\n`)

  // Buscar produtos que JÁ TÊM custos (para não duplicar)
  console.log('🔍 Verificando produtos que já têm custos...')
  const { data: produtosComCustos } = await supabase
    .from('produtos_custos')
    .select('produto_id')

  const idsComCustos = new Set(produtosComCustos?.map((c) => c.produto_id) || [])
  console.log(`✅ ${idsComCustos.size} produtos já têm custos cadastrados\n`)

  // Filtrar apenas produtos SEM custos
  const produtosSemCustos = produtos.filter((p) => !idsComCustos.has(p.id))
  console.log(`🎯 ${produtosSemCustos.length} produtos SEM custos (candidatos)\n`)

  console.log('=' .repeat(80))

  let sucessos = 0
  let erros = 0
  let pulos = 0

  for (const [index, row] of rows.entries()) {
    const linhaNumero = index + 2

    console.log(`\n[${linhaNumero}/${rows.length + 1}] Processando: ${row.nome.substring(0, 60)}...`)

    const custo = normalizarCusto(row.custo)
    const estoque = normalizarEstoque(row.estoque)
    const codigo = row.codigo?.trim() || null

    console.log(`   💰 Custo: R$ ${custo.toFixed(2)} | 📊 Estoque: ${estoque}`)
    if (codigo) console.log(`   🔑 Código: ${codigo}`)

    // Buscar produto com matching inteligente
    const resultado = await buscarProdutoInteligente(row.nome, produtosSemCustos)

    if (!resultado.produto) {
      console.log(`   ⏭️  PULANDO - ${resultado.motivo}`)
      pulos++
      continue
    }

    const confiancaPercent = (resultado.confianca * 100).toFixed(0)
    console.log(`   ✅ Match encontrado: ${resultado.produto.nome}`)
    console.log(`   📊 Confiança: ${confiancaPercent}% (${resultado.motivo})`)

    // Inserir custo
    const sucesso = await inserirCusto(resultado.produto.id, custo, estoque, codigo)

    if (sucesso) {
      console.log(`   ✅ Custo inserido com sucesso`)
      sucessos++

      // Remover da lista para não fazer match duplicado
      const idx = produtosSemCustos.findIndex((p) => p.id === resultado.produto!.id)
      if (idx !== -1) {
        produtosSemCustos.splice(idx, 1)
      }
    } else {
      console.log(`   ❌ Falha ao inserir custo`)
      erros++
    }
  }

  // Relatório final
  console.log('\n' + '='.repeat(80))
  console.log('📊 RELATÓRIO DE IMPORTAÇÃO INTELIGENTE')
  console.log('='.repeat(80))
  console.log(`✅ Sucessos: ${sucessos}`)
  console.log(`❌ Erros: ${erros}`)
  console.log(`⏭️  Pulados: ${pulos}`)
  console.log(`📝 Total processado: ${rows.length}`)
  console.log('='.repeat(80))

  if (erros > 0) {
    console.log('\n⚠️  Importação concluída com erros')
    process.exit(1)
  } else {
    console.log('\n🎉 Importação inteligente concluída com sucesso!')
    process.exit(0)
  }
}

// Executar
importarCustosInteligente().catch((error) => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})
