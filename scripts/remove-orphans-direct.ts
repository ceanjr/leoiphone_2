/**
 * Script de REMOÇÃO DIRETA de imagens órfãs do Supabase Storage
 * 
 * ⚠️  ATENÇÃO: Este script remove arquivos PERMANENTEMENTE sem backup!
 * 
 * Executar com: npx tsx scripts/remove-orphans-direct.ts
 * 
 * Baseado na validação realizada em 15/01/2026:
 * - 2.906 arquivos no storage
 * - 446 URLs referenciadas (Supabase)
 * - ~2.460 imagens órfãs a remover
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aswejqbtejibrilrblnm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não definida')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BUCKET_NAME = 'produtos'
const BATCH_SIZE = 50 // Arquivos por batch
const DELAY_BETWEEN_BATCHES = 300 // ms

interface StorageFile {
  name: string
  id: string
  created_at: string
  updated_at: string
  metadata: {
    size?: number
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function listAllStorageFiles(): Promise<StorageFile[]> {
  console.log('\n📦 Listando arquivos no storage...')
  
  const allFiles: StorageFile[] = []
  
  // Listar pastas na raiz
  const { data: rootItems } = await supabase.storage
    .from(BUCKET_NAME)
    .list('', { limit: 1000 })

  const folders = rootItems?.filter(item => item.id === null).map(f => f.name) || []
  
  for (const folder of folders) {
    let offset = 0
    const limit = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folder, { limit, offset })

      if (error || !data || data.length === 0) {
        hasMore = false
      } else {
        const files = data
          .filter(item => item.name && item.id !== null)
          .map(item => ({
            ...item,
            name: `${folder}/${item.name}`
          })) as StorageFile[]
        
        allFiles.push(...files)
        offset += limit
        hasMore = data.length === limit
      }
    }
  }

  console.log(`   Total: ${allFiles.length} arquivos`)
  return allFiles
}

async function getSupabaseReferencedFiles(): Promise<Set<string>> {
  console.log('\n📋 Buscando URLs referenciadas no banco (apenas Supabase)...')
  
  const referencedFiles = new Set<string>()
  const SUPABASE_DOMAIN = 'supabase.co'
  
  // Buscar produtos
  const { data: produtos } = await supabase
    .from('produtos')
    .select('fotos, foto_principal')

  if (produtos) {
    for (const produto of produtos) {
      // foto_principal
      if (produto.foto_principal && produto.foto_principal.includes(SUPABASE_DOMAIN)) {
        const match = produto.foto_principal.match(/\/produtos\/(.+)$/)
        if (match) referencedFiles.add(match[1])
      }
      
      // fotos
      if (produto.fotos && Array.isArray(produto.fotos)) {
        for (const foto of produto.fotos) {
          if (foto && foto.includes(SUPABASE_DOMAIN)) {
            const match = foto.match(/\/produtos\/(.+)$/)
            if (match) referencedFiles.add(match[1])
          }
        }
      }
    }
  }

  // Buscar banners
  const { data: banners } = await supabase
    .from('banners')
    .select('imagem_url')

  if (banners) {
    for (const banner of banners) {
      if (banner.imagem_url && banner.imagem_url.includes(SUPABASE_DOMAIN)) {
        const match = banner.imagem_url.match(/\/produtos\/(.+)$/)
        if (match) referencedFiles.add(match[1])
      }
    }
  }

  console.log(`   Total: ${referencedFiles.size} arquivos referenciados`)
  return referencedFiles
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║   REMOÇÃO DIRETA DE IMAGENS ÓRFÃS                            ║')
  console.log('║   ⚠️  ATENÇÃO: Arquivos serão removidos PERMANENTEMENTE!      ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')

  // 1. Listar todos os arquivos no storage
  const storageFiles = await listAllStorageFiles()
  
  // 2. Buscar arquivos referenciados
  const referencedFiles = await getSupabaseReferencedFiles()
  
  // 3. Identificar órfãos
  console.log('\n🔍 Identificando imagens órfãs...')
  const orphanFiles = storageFiles.filter(f => !referencedFiles.has(f.name))
  
  const totalOrphanSize = orphanFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0)
  const sizeMB = (totalOrphanSize / (1024 * 1024)).toFixed(2)
  
  console.log(`   Órfãs encontradas: ${orphanFiles.length} arquivos (${sizeMB} MB)`)
  console.log(`   Arquivos protegidos: ${storageFiles.length - orphanFiles.length}`)
  
  if (orphanFiles.length === 0) {
    console.log('\n✅ Nenhuma imagem órfã encontrada!')
    return
  }

  // 4. Confirmação final
  console.log('\n' + '═'.repeat(60))
  console.log('RESUMO DA OPERAÇÃO:')
  console.log('═'.repeat(60))
  console.log(`   📦 Total no storage: ${storageFiles.length}`)
  console.log(`   📋 Referenciadas: ${referencedFiles.size}`)
  console.log(`   🗑️  A remover: ${orphanFiles.length}`)
  console.log(`   💾 Espaço a liberar: ${sizeMB} MB`)
  console.log('═'.repeat(60))
  
  console.log('\n⏳ Iniciando remoção em 5 segundos...')
  console.log('   (Ctrl+C para cancelar)\n')
  await sleep(5000)

  // 5. Remover em batches
  const removed: string[] = []
  const failed: { name: string; error: string }[] = []
  const totalBatches = Math.ceil(orphanFiles.length / BATCH_SIZE)
  
  console.log(`📦 Processando ${totalBatches} batches de ${BATCH_SIZE} arquivos...\n`)

  for (let i = 0; i < orphanFiles.length; i += BATCH_SIZE) {
    const batch = orphanFiles.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    
    const filesToDelete = batch.map(f => f.name)
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filesToDelete)
    
    if (error) {
      // Tentar um por um
      for (const file of batch) {
        const { error: singleError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([file.name])
        
        if (singleError) {
          failed.push({ name: file.name, error: singleError.message })
        } else {
          removed.push(file.name)
        }
      }
    } else {
      removed.push(...filesToDelete)
    }
    
    const progress = ((batchNum / totalBatches) * 100).toFixed(1)
    console.log(`   Batch ${batchNum}/${totalBatches} - ${progress}% - ✅ ${removed.length} removidos`)
    
    if (i + BATCH_SIZE < orphanFiles.length) {
      await sleep(DELAY_BETWEEN_BATCHES)
    }
  }

  // 6. Salvar log
  const logDir = path.join(process.cwd(), 'scripts', 'reports')
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
  
  const logPath = path.join(logDir, `removal-${Date.now()}.json`)
  fs.writeFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalStorage: storageFiles.length,
      totalReferenced: referencedFiles.size,
      totalOrphans: orphanFiles.length,
      removed: removed.length,
      failed: failed.length,
      spaceFreedMB: sizeMB
    },
    removedFiles: removed,
    failedFiles: failed
  }, null, 2))

  // 7. Resultado final
  console.log('\n' + '═'.repeat(60))
  console.log('RESULTADO FINAL')
  console.log('═'.repeat(60))
  console.log(`   ✅ Removidos: ${removed.length}`)
  console.log(`   ❌ Falhas: ${failed.length}`)
  console.log(`   💾 Espaço liberado: ~${sizeMB} MB`)
  console.log(`   📄 Log: ${path.basename(logPath)}`)
  console.log('═'.repeat(60))
  
  if (failed.length > 0) {
    console.log('\n⚠️  Arquivos com falha:')
    failed.slice(0, 10).forEach(f => console.log(`   - ${f.name}: ${f.error}`))
    if (failed.length > 10) console.log(`   ... e mais ${failed.length - 10}`)
  }

  console.log('\n✅ Limpeza concluída!')
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err)
  process.exit(1)
})
