/**
 * Script de Importação OTIMIZADO de Custos de Produtos
 *
 * Versão 2.0 - Melhorias:
 * - Pré-processamento agressivo de textos
 * - Matching multi-camadas (Levenshtein + Jaccard + Características)
 * - Agrupamento inteligente de linhas CSV
 * - Threshold adaptativo (50-75%+)
 * - Anti-duplicação rigorosa
 * - Logs detalhados com breakdown de scores
 *
 * Meta: 80-90% de taxa de sucesso (vs ~50% da versão anterior)
 *
 * Uso: npx tsx scripts/importar-custos-otimizado.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

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

interface GrupoCsv {
  nomeLimpo: string
  linhas: CsvRow[]
}

interface ProdutoSupabase {
  id: string
  nome: string
  descricao: string | null
  codigo_produto: string | null
  condicao: 'novo' | 'seminovo'
  categoria_id: string
}

interface MatchResult {
  produto: ProdutoSupabase | null
  confianca: number
  motivo: string
  scores: {
    levenshtein: number
    tokens: number
    caracteristicas: number
    nomeDescricao: number
  }
}

// ============================================================================
// FASE 1: FUNÇÕES DE LIMPEZA E NORMALIZAÇÃO
// ============================================================================

/**
 * Normaliza abreviações comuns
 */
function normalizarAbreviacoes(texto: string): string {
  return texto
    // Apple Watch
    .replace(/\bSeries\s+(\d+)\b/gi, 'S$1')
    .replace(/\bSérie\s+(\d+)\b/gi, 'S$1')
    // Gerações
    .replace(/\b(\d+)ª\s*Geração\b/gi, '$1G')
    .replace(/\b(\d+)ª\s*G\b/gi, '$1G')
    .replace(/\bGeração\s+(\d+)\b/gi, '$1G')
    // Pro Max -> ProMax
    .replace(/\bPro\s+Max\b/gi, 'ProMax')
    // Juntar números com GB/TB/mAh
    .replace(/(\d+)\s*(GB|TB|mAh|mm)/gi, '$1$2')
}

/**
 * Limpeza AGRESSIVA para matching
 */
function limparTextoParaMatch(texto: string): string {
  let limpo = texto
    // Remover prefixo SKU
    .replace(/^SKU:\s*\d+\s*-\s*/i, '')
    // Remover IMEIs
    .replace(/,?\s*IMEI\d?:\s*\d+/gi, '')
    // Remover Serial Numbers
    .replace(/,?\s*SN:\s*[\w\d]+/gi, '')
    // Remover informações de bateria
    .replace(/,?\s*Saúde da bateria:\s*\d+%/gi, '')
    .replace(/,?\s*bateria:\s*\d+%/gi, '')
    .replace(/,?\s*\d+%\s*bateria/gi, '')
    // Remover anos entre parênteses
    .replace(/\(\d{4}\)/g, '')
    // Remover status
    .replace(/\b(Seminovo|Lacrado|Produto\s+Novo|Produto\s+Lacrado)\b/gi, '')
    // Remover "Produto"
    .replace(/\bProduto\s+/gi, '')
    // Remover "Cor:" / "Cores:"
    .replace(/\bCor(es)?:\s*/gi, '')
    // Remover palavras genéricas no final
    .replace(/\s*-\s*(Branco|Preto|Prata|Azul|Verde|Rosa|Vermelho|Gold|Silver|Black|White|Blue|Green|Red)\s*$/gi, '')

  // Aplicar normalizações de abreviações
  limpo = normalizarAbreviacoes(limpo)

  // Normalização final
  return limpo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' ') // Múltiplos espaços -> 1 espaço
    .trim()
}

/**
 * Extrai características do produto
 */
function extrairCaracteristicas(texto: string): {
  bateria?: number
  mm?: number
  tipoCabo?: string
  capacidade?: string
  marca?: string
  modelo?: string
  tokensImportantes?: string[]
} {
  const caracteristicas: any = {}
  const textoLower = texto.toLowerCase()

  // Detectar bateria
  const matchBateria = texto.match(/(?:bateria|saúde|battery|saude).*?(\d{2,3})%?/i)
  if (matchBateria) {
    caracteristicas.bateria = parseInt(matchBateria[1], 10)
  }

  // Detectar milímetros (relógios)
  const matchMm = texto.match(/(\d{2})mm/i)
  if (matchMm) {
    caracteristicas.mm = parseInt(matchMm[1], 10)
  }

  // Detectar tipo de cabo (mais robusto)
  const temUsbC = /usb-?c|type-?c/i.test(textoLower)
  const temLightning = /lightning/i.test(textoLower)
  const temUsb = /\busb\b/i.test(textoLower) && !temUsbC

  if (temUsbC && temLightning) {
    caracteristicas.tipoCabo = 'usb-c-lightning'
  } else if (temUsb && temLightning) {
    caracteristicas.tipoCabo = 'usb-lightning'
  } else if (temUsbC && textoLower.includes('usb-c')) {
    caracteristicas.tipoCabo = 'usb-c-usb-c'
  }

  // Detectar capacidade
  const matchCapacidade = texto.match(/(\d+)\s*(GB|TB|mAh)/i)
  if (matchCapacidade) {
    caracteristicas.capacidade = matchCapacidade[0].toLowerCase().replace(/\s/g, '')
  }

  // Detectar marca
  const marcas = ['apple', 'samsung', 'xiaomi', 'jbl', 'baseus', 'kingo', 'peining', 'ugreen', 'aiwa', 'microwear']
  for (const marca of marcas) {
    if (textoLower.includes(marca)) {
      caracteristicas.marca = marca
      break
    }
  }

  // Detectar modelo (números importantes)
  const matchModelo = texto.match(/\b(iphone\s*\d+|s\d+|redmi\s*\d+|flip\s*\d+|go\s*\d+|pencil\s*\d+|watch\s*s\d+|pro\s*max|ultra)/i)
  if (matchModelo) {
    caracteristicas.modelo = matchModelo[0].toLowerCase().replace(/\s+/g, '')
  }

  // Extrair tokens importantes (marca + modelo + capacidade)
  const tokens = []
  if (caracteristicas.marca) tokens.push(caracteristicas.marca)
  if (caracteristicas.modelo) tokens.push(caracteristicas.modelo)
  if (caracteristicas.capacidade) tokens.push(caracteristicas.capacidade)
  caracteristicas.tokensImportantes = tokens

  return caracteristicas
}

// ============================================================================
// FASE 2: FUNÇÕES DE MATCHING
// ============================================================================

/**
 * Calcula similaridade de Levenshtein (já existia, mantido)
 */
function calcularSimilaridade(str1: string, str2: string): number {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()

  if (s1 === s2) return 1
  if (s1.length === 0 || s2.length === 0) return 0

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
          matriz[i - 1][j - 1] + 1,
          matriz[i][j - 1] + 1,
          matriz[i - 1][j] + 1
        )
      }
    }
  }

  const distancia = matriz[s2.length][s1.length]
  const maxLength = Math.max(s1.length, s2.length)

  return 1 - distancia / maxLength
}

/**
 * Calcula similaridade de tokens (Jaccard Similarity)
 */
function calcularSimilaridadeTokens(str1: string, str2: string): number {
  const tokens1 = new Set(str1.toLowerCase().split(/\s+/).filter(t => t.length > 0))
  const tokens2 = new Set(str2.toLowerCase().split(/\s+/).filter(t => t.length > 0))

  if (tokens1.size === 0 || tokens2.size === 0) return 0

  const intersecao = [...tokens1].filter(t => tokens2.has(t)).length
  const uniao = new Set([...tokens1, ...tokens2]).size

  return intersecao / uniao
}

/**
 * Compara características entre dois produtos
 */
function compararCaracteristicas(
  car1: ReturnType<typeof extrairCaracteristicas>,
  car2: ReturnType<typeof extrairCaracteristicas>
): number {
  let score = 0
  let checks = 0

  // Bateria (tolerância de 10%)
  if (car1.bateria && car2.bateria) {
    checks++
    if (Math.abs(car1.bateria - car2.bateria) <= 10) {
      score += 1
    } else if (Math.abs(car1.bateria - car2.bateria) <= 20) {
      score += 0.5
    }
  }

  // Milímetros (exato)
  if (car1.mm && car2.mm) {
    checks++
    if (car1.mm === car2.mm) {
      score += 1
    }
  }

  // Tipo de cabo
  if (car1.tipoCabo && car2.tipoCabo) {
    checks++
    if (car1.tipoCabo === car2.tipoCabo) {
      score += 1
    }
  }

  // Capacidade
  if (car1.capacidade && car2.capacidade) {
    checks++
    if (car1.capacidade === car2.capacidade) {
      score += 1
    }
  }

  // Marca
  if (car1.marca && car2.marca) {
    checks++
    if (car1.marca === car2.marca) {
      score += 1
    }
  }

  // Modelo
  if (car1.modelo && car2.modelo) {
    checks++
    if (car1.modelo === car2.modelo) {
      score += 1
    }
  }

  return checks > 0 ? score / checks : 0
}

/**
 * Verifica tokens principais (marca + modelo)
 */
function verificarTokensPrincipais(
  car1: ReturnType<typeof extrairCaracteristicas>,
  car2: ReturnType<typeof extrairCaracteristicas>
): number {
  const tokens1 = car1.tokensImportantes || []
  const tokens2 = car2.tokensImportantes || []

  if (tokens1.length === 0 || tokens2.length === 0) return 0

  const intersecao = tokens1.filter(t => tokens2.includes(t)).length
  return intersecao / Math.min(tokens1.length, tokens2.length)
}

/**
 * Calcula score final combinado
 */
function calcularScoreFinal(
  nomeCsvLimpo: string,
  produto: ProdutoSupabase,
  carCsv: ReturnType<typeof extrairCaracteristicas>,
  carProd: ReturnType<typeof extrairCaracteristicas>
): { scoreFinal: number; scores: MatchResult['scores'] } {
  const nomeProdLimpo = limparTextoParaMatch(produto.nome)
  const nomeDescLimpo = limparTextoParaMatch(
    produto.nome + ' ' + (produto.descricao || '')
  )

  const scores = {
    levenshtein: calcularSimilaridade(nomeCsvLimpo, nomeProdLimpo),
    tokens: calcularSimilaridadeTokens(nomeCsvLimpo, nomeProdLimpo),
    caracteristicas: compararCaracteristicas(carCsv, carProd),
    nomeDescricao: calcularSimilaridade(nomeCsvLimpo, nomeDescLimpo),
  }

  // Calcular score final usando melhor combinação
  const scoreFinal = Math.max(
    scores.levenshtein * 0.6 + scores.caracteristicas * 0.4,
    scores.tokens * 0.7 + scores.caracteristicas * 0.3,
    scores.nomeDescricao * 0.8 + scores.caracteristicas * 0.2
  )

  return { scoreFinal, scores }
}

/**
 * Verifica se o match atende ao threshold adaptativo
 */
function verificarThreshold(
  scoreFinal: number,
  scores: MatchResult['scores'],
  carCsv: ReturnType<typeof extrairCaracteristicas>,
  carProd: ReturnType<typeof extrairCaracteristicas>
): boolean {
  const CONFIANCA_ALTA = 0.75
  const CONFIANCA_MEDIA = 0.60
  const CONFIANCA_BAIXA = 0.50

  // 75%+: aceitar direto
  if (scoreFinal >= CONFIANCA_ALTA) return true

  // 60-75%: aceitar se características batem
  if (scoreFinal >= CONFIANCA_MEDIA && scores.caracteristicas >= 0.7) return true

  // 50-60%: aceitar se tokens principais batem
  if (scoreFinal >= CONFIANCA_BAIXA) {
    const tokensScore = verificarTokensPrincipais(carCsv, carProd)
    if (tokensScore >= 0.8) return true
  }

  return false
}

// ============================================================================
// FASE 3: AGRUPAMENTO DE LINHAS CSV
// ============================================================================

/**
 * Agrupa linhas CSV similares (100% idênticas após limpeza)
 */
function agruparLinhasSimilares(rows: CsvRow[]): GrupoCsv[] {
  const grupos = new Map<string, GrupoCsv>()

  for (const row of rows) {
    const nomeLimpo = limparTextoParaMatch(row.nome)

    if (grupos.has(nomeLimpo)) {
      grupos.get(nomeLimpo)!.linhas.push(row)
    } else {
      grupos.set(nomeLimpo, {
        nomeLimpo,
        linhas: [row],
      })
    }
  }

  return Array.from(grupos.values())
}

// ============================================================================
// FASE 4: BUSCA INTELIGENTE COM ANTI-DUPLICAÇÃO
// ============================================================================

/**
 * Verifica se custo já existe
 */
async function verificarCustoExistente(
  produtoId: string,
  custo: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('produtos_custos')
      .select('id')
      .eq('produto_id', produtoId)
      .eq('custo', custo)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') { // PGRST116 = não encontrado
      console.error('   ⚠️  Erro ao verificar duplicata:', error.message)
    }

    return !!data
  } catch (error) {
    console.error('   ⚠️  Erro ao verificar duplicata:', error)
    return false
  }
}

/**
 * Busca inteligente de produto com logs detalhados
 */
async function buscarProdutoInteligente(
  nomeCsv: string,
  produtos: ProdutoSupabase[],
  verbose: boolean = false
): Promise<MatchResult> {
  const nomeCsvLimpo = limparTextoParaMatch(nomeCsv)
  const carCsv = extrairCaracteristicas(nomeCsv)

  let melhorMatch: ProdutoSupabase | null = null
  let melhorScore = 0
  let melhorMotivo = ''
  let melhorScores: MatchResult['scores'] = {
    levenshtein: 0,
    tokens: 0,
    caracteristicas: 0,
    nomeDescricao: 0,
  }

  // Lista de candidatos para debug
  const candidatos: Array<{
    produto: ProdutoSupabase
    scoreFinal: number
    scores: MatchResult['scores']
  }> = []

  for (const produto of produtos) {
    const carProd = extrairCaracteristicas(
      produto.nome + ' ' + (produto.descricao || '')
    )

    const { scoreFinal, scores } = calcularScoreFinal(
      nomeCsvLimpo,
      produto,
      carCsv,
      carProd
    )

    // Verificar threshold
    const atendeThreshold = verificarThreshold(scoreFinal, scores, carCsv, carProd)

    if (!atendeThreshold) continue

    candidatos.push({ produto, scoreFinal, scores })

    // Atualizar melhor match
    if (scoreFinal > melhorScore) {
      melhorScore = scoreFinal
      melhorMatch = produto
      melhorScores = scores

      // Determinar motivo
      if (scoreFinal >= 0.75) {
        melhorMotivo = 'Alta confiança'
      } else if (scores.caracteristicas >= 0.7) {
        melhorMotivo = 'Características compatíveis'
      } else {
        melhorMotivo = 'Tokens principais batem'
      }
    } else if (Math.abs(scoreFinal - melhorScore) < 0.05) {
      // Scores muito próximos (<5%), escolher o que tem mais características
      if (scores.caracteristicas > melhorScores.caracteristicas) {
        melhorScore = scoreFinal
        melhorMatch = produto
        melhorScores = scores
        melhorMotivo = 'Mais características compatíveis'
      }
    }
  }

  // Logs detalhados se verbose
  if (verbose && candidatos.length > 0) {
    console.log(`   🔍 ${candidatos.length} candidato(s) encontrado(s):`)
    candidatos.slice(0, 3).forEach((c, i) => {
      console.log(`      ${i + 1}. ${c.produto.nome} (${(c.scoreFinal * 100).toFixed(0)}%)`)
      console.log(`         - Levenshtein: ${(c.scores.levenshtein * 100).toFixed(0)}%`)
      console.log(`         - Tokens: ${(c.scores.tokens * 100).toFixed(0)}%`)
      console.log(`         - Características: ${(c.scores.caracteristicas * 100).toFixed(0)}%`)
      console.log(`         - Nome+Desc: ${(c.scores.nomeDescricao * 100).toFixed(0)}%`)
    })
  }

  return {
    produto: melhorMatch,
    confianca: melhorScore,
    motivo: melhorMotivo,
    scores: melhorScores,
  }
}

/**
 * Insere custo (com verificação de duplicata)
 */
async function inserirCusto(
  produtoId: string,
  custo: number,
  estoque: number,
  codigo: string | null
): Promise<boolean> {
  try {
    // Verificar se já existe
    const existe = await verificarCustoExistente(produtoId, custo)
    if (existe) {
      console.log(`   ⚠️  Custo R$ ${custo.toFixed(2)} já existe, pulando...`)
      return false
    }

    const { error } = await supabase.from('produtos_custos').insert({
      produto_id: produtoId,
      custo,
      estoque,
      codigo,
    })

    if (error) {
      console.error(`   ❌ Erro ao inserir custo:`, error.message)
      return false
    }

    return true
  } catch (error) {
    console.error(`   ❌ Erro ao inserir custo:`, error)
    return false
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function importarCustosOtimizado() {
  console.log('🚀 Iniciando importação OTIMIZADA de custos...\n')
  console.log('📋 Melhorias: Matching multi-camadas + Agrupamento + Anti-duplicação\n')

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

  console.log(`📄 Total de linhas no CSV: ${rows.length}`)

  // Agrupar linhas similares
  const grupos = agruparLinhasSimilares(rows)
  console.log(`📦 Agrupadas em ${grupos.length} grupos únicos\n`)

  // Buscar produtos do catálogo
  console.log('📦 Carregando produtos do catálogo...')
  const { data: produtos, error: produtosError } = await supabase
    .from('produtos')
    .select('id, nome, descricao, codigo_produto, condicao, categoria_id')
    .eq('ativo', true)
    .is('deleted_at', null)

  if (produtosError || !produtos) {
    console.error('❌ Erro ao carregar produtos:', produtosError?.message)
    process.exit(1)
  }

  console.log(`✅ ${produtos.length} produtos carregados\n`)

  // Buscar produtos que já têm custos
  const { data: produtosComCustos } = await supabase
    .from('produtos_custos')
    .select('produto_id')

  const idsComCustos = new Set(produtosComCustos?.map((c) => c.produto_id) || [])
  const produtosSemCustos = produtos.filter((p) => !idsComCustos.has(p.id))

  console.log(`🎯 ${produtosSemCustos.length} produtos SEM custos\n`)
  console.log('=' .repeat(80))

  let sucessos = 0
  let erros = 0
  let pulos = 0
  let duplicatas = 0

  for (const [index, grupo] of grupos.entries()) {
    console.log(`\n[${index + 1}/${grupos.length}] Grupo: "${grupo.nomeLimpo.substring(0, 60)}..." (${grupo.linhas.length} linha(s))`)

    // Buscar match uma vez por grupo
    const resultado = await buscarProdutoInteligente(
      grupo.linhas[0].nome,
      produtosSemCustos,
      grupo.linhas.length > 1 // verbose se múltiplas linhas
    )

    if (!resultado.produto) {
      console.log(`   ⏭️  PULANDO - Nenhum match encontrado`)
      pulos += grupo.linhas.length
      continue
    }

    const confiancaPercent = (resultado.confianca * 100).toFixed(0)
    console.log(`   ✅ Match: ${resultado.produto.nome}`)
    console.log(`   📊 Confiança: ${confiancaPercent}% (${resultado.motivo})`)
    console.log(`   📈 Scores: L=${(resultado.scores.levenshtein * 100).toFixed(0)}% T=${(resultado.scores.tokens * 100).toFixed(0)}% C=${(resultado.scores.caracteristicas * 100).toFixed(0)}% D=${(resultado.scores.nomeDescricao * 100).toFixed(0)}%`)

    // Inserir todos os custos do grupo
    console.log(`   💾 Inserindo ${grupo.linhas.length} custo(s)...`)
    for (const linha of grupo.linhas) {
      const custo = parseFloat(linha.custo.replace(',', '.')) || 0
      const estoque = parseInt(linha.estoque) || 1
      const codigo = linha.codigo?.trim() || null

      const sucesso = await inserirCusto(resultado.produto.id, custo, estoque, codigo)

      if (sucesso) {
        console.log(`      ✅ R$ ${custo.toFixed(2)} (${estoque} un.) inserido`)
        sucessos++
      } else {
        // Verificar se foi duplicata ou erro
        const existe = await verificarCustoExistente(resultado.produto.id, custo)
        if (existe) {
          duplicatas++
        } else {
          erros++
        }
      }
    }

    // Remover da lista para não fazer match duplicado
    const idx = produtosSemCustos.findIndex((p) => p.id === resultado.produto!.id)
    if (idx !== -1) {
      produtosSemCustos.splice(idx, 1)
    }
  }

  // Relatório final
  console.log('\n' + '='.repeat(80))
  console.log('📊 RELATÓRIO DE IMPORTAÇÃO OTIMIZADA')
  console.log('='.repeat(80))
  console.log(`✅ Sucessos: ${sucessos}`)
  console.log(`⚠️  Duplicatas: ${duplicatas}`)
  console.log(`❌ Erros: ${erros}`)
  console.log(`⏭️  Pulados: ${pulos}`)
  console.log(`📝 Total processado: ${rows.length}`)
  console.log(`📈 Taxa de sucesso: ${((sucessos / rows.length) * 100).toFixed(1)}%`)
  console.log('='.repeat(80))

  if (erros > 0) {
    console.log('\n⚠️  Importação concluída com erros')
    process.exit(1)
  } else {
    console.log('\n🎉 Importação otimizada concluída com sucesso!')
    process.exit(0)
  }
}

// Executar
importarCustosOtimizado().catch((error) => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})
