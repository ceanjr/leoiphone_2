/**
 * Script de migração de imagens existentes
 *
 * Este script:
 * 1. Lista todas as imagens no bucket 'produtos' do Supabase
 * 2. Filtra imagens que ainda não foram otimizadas (sem sufixos -thumb, -small, etc)
 * 3. Baixa cada imagem original
 * 4. Gera variantes otimizadas (thumb, small, medium, large, original)
 * 5. Faz upload das variantes
 * 6. Atualiza referências no banco de dados
 *
 * Uso:
 *   npx tsx scripts/migrate-images.ts [--dry-run] [--limit=N]
 *
 * Flags:
 *   --dry-run: Apenas simula sem fazer alterações
 *   --limit=N: Processa apenas N imagens (útil para testar)
 */

import { createClient } from '@supabase/supabase-js'
import { optimizeImage, getBasePath } from '../lib/utils/image-optimizer'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos em .env.local')
  process.exit(1)
}

// Cliente Supabase com permissões de serviço
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface MigrationStats {
  total: number
  processed: number
  skipped: number
  errors: number
  variantsCreated: number
}

const stats: MigrationStats = {
  total: 0,
  processed: 0,
  skipped: 0,
  errors: 0,
  variantsCreated: 0,
}

/**
 * Verifica se uma imagem já foi otimizada
 */
function isOptimizedImage(filename: string): boolean {
  const suffixes = ['-thumb', '-small', '-medium', '-large', '-original']
  return suffixes.some(suffix => filename.includes(suffix))
}

/**
 * Baixa uma imagem do Supabase Storage
 */
async function downloadImage(filePath: string): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from('produtos')
    .download(filePath)

  if (error) {
    throw new Error(`Erro ao baixar ${filePath}: ${error.message}`)
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Faz upload de variantes otimizadas
 */
async function uploadVariants(
  baseName: string,
  variants: Awaited<ReturnType<typeof optimizeImage>>,
  dryRun: boolean
): Promise<string[]> {
  if (dryRun) {
    console.log(`    [DRY RUN] Faria upload de ${variants.length} variantes`)
    return variants.map(v => `produtos/${v.filename}`)
  }

  const uploadPromises = variants.map(async (variant) => {
    const filePath = `produtos/${variant.filename}`

    const { error: uploadError } = await supabase.storage
      .from('produtos')
      .upload(filePath, variant.buffer, {
        contentType: 'image/webp',
        upsert: false, // Não sobrescrever se já existir
      })

    if (uploadError) {
      // Se já existe, não é erro
      if (uploadError.message.includes('already exists')) {
        console.log(`    ⚠️  ${variant.size} já existe, pulando...`)
        return filePath
      }
      throw new Error(`Erro ao fazer upload de ${variant.size}: ${uploadError.message}`)
    }

    console.log(`    ✓ ${variant.size}: ${variant.width}x${variant.height}`)
    return filePath
  })

  return Promise.all(uploadPromises)
}

/**
 * Atualiza referências de imagem no banco de dados
 */
async function updateDatabaseReferences(
  oldUrl: string,
  newBaseUrl: string,
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log(`    [DRY RUN] Atualizaria referências: ${oldUrl} → ${newBaseUrl}`)
    return
  }

  // Atualizar fotos principais
  const { error: fotoPrincipalError } = await supabase
    .from('produtos')
    .update({ foto_principal: newBaseUrl })
    .eq('foto_principal', oldUrl)

  if (fotoPrincipalError) {
    console.warn(`    ⚠️  Erro ao atualizar foto_principal: ${fotoPrincipalError.message}`)
  }

  // Atualizar arrays de fotos (mais complexo pois é um array)
  const { data: produtos, error: selectError } = await supabase
    .from('produtos')
    .select('id, fotos')
    .contains('fotos', [oldUrl])

  if (selectError) {
    console.warn(`    ⚠️  Erro ao buscar produtos com foto: ${selectError.message}`)
    return
  }

  if (produtos && produtos.length > 0) {
    for (const produto of produtos) {
      const novasFotos = produto.fotos.map((foto: string) =>
        foto === oldUrl ? newBaseUrl : foto
      )

      const { error: updateError } = await supabase
        .from('produtos')
        .update({ fotos: novasFotos })
        .eq('id', produto.id)

      if (updateError) {
        console.warn(`    ⚠️  Erro ao atualizar fotos do produto ${produto.id}: ${updateError.message}`)
      }
    }
  }
}

/**
 * Processa uma imagem individual
 */
async function processImage(
  file: { name: string; id: string },
  dryRun: boolean
): Promise<boolean> {
  const filePath = `produtos/${file.name}`

  try {
    console.log(`\n📸 Processando: ${file.name}`)

    // Baixar imagem original
    console.log('  📥 Baixando...')
    const buffer = await downloadImage(filePath)
    console.log(`  ✓ Baixado: ${(buffer.length / 1024).toFixed(2)} KB`)

    // Otimizar e gerar variantes
    console.log('  🔄 Gerando variantes...')
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    const variants = await optimizeImage(buffer, baseName)
    console.log(`  ✓ Geradas ${variants.length} variantes`)

    // Upload das variantes
    console.log('  📤 Fazendo upload...')
    const uploadedPaths = await uploadVariants(baseName, variants, dryRun)
    stats.variantsCreated += uploadedPaths.length

    // Atualizar referências no banco de dados
    const { data: { publicUrl: oldUrl } } = supabase.storage
      .from('produtos')
      .getPublicUrl(filePath)

    const newBaseUrl = oldUrl.replace(/\.[^/.]+$/, '.webp')

    console.log('  🔄 Atualizando referências no banco...')
    await updateDatabaseReferences(oldUrl, newBaseUrl, dryRun)

    console.log(`  ✅ Concluído!`)
    stats.processed++
    return true

  } catch (error) {
    console.error(`  ❌ Erro ao processar ${file.name}:`, error)
    stats.errors++
    return false
  }
}

/**
 * Função principal de migração
 */
async function migrateImages(dryRun: boolean, limit?: number) {
  console.log('🚀 Iniciando migração de imagens\n')
  console.log(`Modo: ${dryRun ? 'DRY RUN (simulação)' : 'PRODUÇÃO'}`)
  if (limit) {
    console.log(`Limite: ${limit} imagens`)
  }
  console.log('')

  // Listar todas as imagens no bucket
  console.log('📋 Listando imagens no Supabase Storage...')
  const { data: files, error: listError } = await supabase.storage
    .from('produtos')
    .list('produtos', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    })

  if (listError) {
    console.error('❌ Erro ao listar arquivos:', listError)
    process.exit(1)
  }

  if (!files || files.length === 0) {
    console.log('ℹ️  Nenhuma imagem encontrada no bucket')
    return
  }

  console.log(`✓ Encontradas ${files.length} imagens\n`)

  // Filtrar apenas imagens não-otimizadas
  const imagesToProcess = files.filter(file => {
    // Ignorar pastas
    if (!file.name.includes('.')) return false

    // Ignorar imagens já otimizadas
    if (isOptimizedImage(file.name)) {
      stats.skipped++
      return false
    }

    return true
  })

  stats.total = imagesToProcess.length
  console.log(`📊 Imagens a processar: ${stats.total}`)
  console.log(`⏭️  Imagens já otimizadas: ${stats.skipped}\n`)

  if (stats.total === 0) {
    console.log('✅ Todas as imagens já estão otimizadas!')
    return
  }

  // Aplicar limite se especificado
  const filesToProcess = limit
    ? imagesToProcess.slice(0, limit)
    : imagesToProcess

  console.log(`🔄 Processando ${filesToProcess.length} imagens...\n`)
  console.log('─'.repeat(60))

  // Processar imagens sequencialmente (para evitar sobrecarga)
  for (let i = 0; i < filesToProcess.length; i++) {
    const file = filesToProcess[i]
    console.log(`\n[${i + 1}/${filesToProcess.length}]`)
    await processImage(file, dryRun)

    // Pequeno delay entre processamentos
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Exibir estatísticas finais
  console.log('\n' + '='.repeat(60))
  console.log('📊 ESTATÍSTICAS FINAIS')
  console.log('='.repeat(60))
  console.log(`Total de imagens encontradas: ${files.length}`)
  console.log(`Imagens já otimizadas (puladas): ${stats.skipped}`)
  console.log(`Imagens a processar: ${stats.total}`)
  console.log(`Imagens processadas: ${stats.processed}`)
  console.log(`Variantes criadas: ${stats.variantsCreated}`)
  console.log(`Erros: ${stats.errors}`)
  console.log('='.repeat(60))

  if (dryRun) {
    console.log('\n⚠️  MODO DRY RUN - Nenhuma alteração foi feita')
    console.log('Execute sem --dry-run para aplicar as alterações')
  } else if (stats.errors === 0) {
    console.log('\n✅ Migração concluída com sucesso!')
  } else {
    console.log(`\n⚠️  Migração concluída com ${stats.errors} erros`)
  }
}

// Parse argumentos de linha de comando
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(arg => arg.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined

// Executar migração
migrateImages(dryRun, limit)
  .catch(error => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
