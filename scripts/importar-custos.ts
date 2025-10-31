/**
 * Script de Importação de Custos de Produtos
 *
 * Este script lê o arquivo custos.csv na raiz do projeto e importa os dados
 * para a tabela produtos_custos no Supabase.
 *
 * Lógica de mapeamento:
 * 1. iPhones Seminovos: Mapeia pelo campo 'codigo' (últimos 4 dígitos do IMEI)
 * 2. Outros Produtos: Mapeia pelo nome do produto
 * 3. Produtos com múltiplos custos: Cria múltiplas entradas na tabela produtos_custos
 *
 * Uso: npx tsx scripts/importar-custos.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: path.join(process.cwd(), '.env.local') })

// Configuração do Supabase (usando variáveis de ambiente)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
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
  codigo_produto: string | null
  condicao: 'novo' | 'seminovo'
}

/**
 * Normaliza o custo (converte vírgula para ponto e parseia)
 */
function normalizarCusto(custoStr: string): number {
  if (!custoStr || custoStr.trim() === '') return 0
  const normalizado = custoStr.replace(',', '.')
  return parseFloat(normalizado)
}

/**
 * Normaliza o estoque
 */
function normalizarEstoque(estoqueStr: string): number {
  if (!estoqueStr || estoqueStr.trim() === '') return 1
  return parseInt(estoqueStr, 10)
}

/**
 * Extrai informações relevantes do nome do produto no CSV
 * Ex: "SKU: 14 - iPhone 11 128GB - Black, IMEI1: 356552107029951 - Seminovo"
 */
function extrairInfoProduto(nome: string): {
  nomeLimpo: string
  codigoImei: string | null
  isSeminovo: boolean
} {
  // Extrair código IMEI (últimos 4 dígitos) se presente
  const imeiMatch = nome.match(/IMEI1?:\s*(\d+)/i)
  const codigoImei = imeiMatch ? imeiMatch[1].slice(-4) : null

  // Verificar se é seminovo
  const isSeminovo = nome.toLowerCase().includes('seminovo')

  // Limpar o nome: remover SKU, IMEI, SN, saúde da bateria, etc
  let nomeLimpo = nome
    .replace(/SKU:\s*\d+\s*-\s*/i, '') // Remove "SKU: XXX - "
    .replace(/,?\s*IMEI\d?:\s*\d+/gi, '') // Remove IMEI
    .replace(/,?\s*SN:\s*[\w]+/gi, '') // Remove Serial Number
    .replace(/,?\s*-\s*Seminovo/gi, '') // Remove "- Seminovo"
    .replace(/,?\s*Saúde da bateria:\s*\d+%/gi, '') // Remove saúde da bateria
    .replace(/,\s*$/, '') // Remove vírgula no final
    .trim()

  return { nomeLimpo, codigoImei, isSeminovo }
}

/**
 * Normaliza nome do produto para comparação (remove variações de formatação)
 */
function normalizarNomeProduto(nome: string): string {
  return nome
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Múltiplos espaços -> 1 espaço
    .replace(/["']/g, '') // Remove aspas
}

/**
 * Verifica se um produto é iPhone baseado no nome
 */
function isIPhone(nome: string): boolean {
  return nome.toLowerCase().includes('iphone')
}

/**
 * Busca produto no banco de dados
 */
async function buscarProduto(
  nomeLimpo: string,
  codigoProduto: string | null,
  isSeminovo: boolean
): Promise<ProdutoSupabase | null> {
  try {
    // Se é iPhone seminovo e tem código, buscar por código_produto
    if (isIPhone(nomeLimpo) && isSeminovo && codigoProduto) {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, codigo_produto, condicao')
        .eq('codigo_produto', codigoProduto)
        .eq('condicao', 'seminovo')
        .single()

      if (!error && data) {
        return data
      }
      console.warn(`⚠️  iPhone seminovo não encontrado pelo código: ${codigoProduto}`)
    }

    // Caso contrário, buscar por nome (normalizado)
    const { data: produtos, error } = await supabase
      .from('produtos')
      .select('id, nome, codigo_produto, condicao')
      .ilike('nome', `%${nomeLimpo}%`)

    if (error) {
      console.error(`❌ Erro ao buscar produto "${nomeLimpo}":`, error.message)
      return null
    }

    if (!produtos || produtos.length === 0) {
      console.warn(`⚠️  Produto não encontrado: "${nomeLimpo}"`)
      return null
    }

    // Se encontrou múltiplos, buscar melhor match
    if (produtos.length > 1) {
      const normalizado = normalizarNomeProduto(nomeLimpo)
      const melhorMatch = produtos.find(
        (p) => normalizarNomeProduto(p.nome) === normalizado
      )
      return melhorMatch || produtos[0]
    }

    return produtos[0]
  } catch (error) {
    console.error(`❌ Erro ao buscar produto:`, error)
    return null
  }
}

/**
 * Insere custo no banco de dados
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
      console.error(`❌ Erro ao inserir custo para produto ${produtoId}:`, error.message)
      return false
    }

    return true
  } catch (error) {
    console.error(`❌ Erro ao inserir custo:`, error)
    return false
  }
}

/**
 * Função principal de importação
 */
async function importarCustos() {
  console.log('🚀 Iniciando importação de custos...\n')

  // Ler arquivo CSV
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

  let sucessos = 0
  let erros = 0
  let pulos = 0

  for (const [index, row] of rows.entries()) {
    const linhaNumero = index + 2 // +2 porque: +1 para índice começar em 1, +1 para header

    console.log(`\n[${linhaNumero}/${rows.length + 1}] Processando: ${row.nome.substring(0, 50)}...`)

    // Normalizar dados
    const custo = normalizarCusto(row.custo)
    const estoque = normalizarEstoque(row.estoque)
    const codigoCsv = row.codigo?.trim() || null

    // Extrair informações do produto
    const { nomeLimpo, codigoImei, isSeminovo } = extrairInfoProduto(row.nome)

    // Decidir qual código usar (do CSV ou do IMEI)
    const codigoProduto = codigoCsv || codigoImei

    console.log(`   📦 Nome limpo: ${nomeLimpo}`)
    console.log(`   💰 Custo: R$ ${custo.toFixed(2)} | 📊 Estoque: ${estoque}`)
    if (codigoProduto) console.log(`   🔑 Código: ${codigoProduto}`)

    // Buscar produto no banco
    const produto = await buscarProduto(nomeLimpo, codigoProduto, isSeminovo)

    if (!produto) {
      console.log(`   ❌ Produto não encontrado no catálogo - PULANDO`)
      pulos++
      continue
    }

    console.log(`   ✅ Produto encontrado: ${produto.nome} (ID: ${produto.id})`)

    // Inserir custo
    const sucesso = await inserirCusto(produto.id, custo, estoque, codigoProduto)

    if (sucesso) {
      console.log(`   ✅ Custo inserido com sucesso`)
      sucessos++
    } else {
      console.log(`   ❌ Falha ao inserir custo`)
      erros++
    }
  }

  // Relatório final
  console.log('\n' + '='.repeat(60))
  console.log('📊 RELATÓRIO DE IMPORTAÇÃO')
  console.log('='.repeat(60))
  console.log(`✅ Sucessos: ${sucessos}`)
  console.log(`❌ Erros: ${erros}`)
  console.log(`⏭️  Pulados: ${pulos}`)
  console.log(`📝 Total processado: ${rows.length}`)
  console.log('='.repeat(60))

  if (erros > 0) {
    console.log('\n⚠️  Importação concluída com erros')
    process.exit(1)
  } else {
    console.log('\n🎉 Importação concluída com sucesso!')
    process.exit(0)
  }
}

// Executar importação
importarCustos().catch((error) => {
  console.error('❌ Erro fatal na importação:', error)
  process.exit(1)
})
