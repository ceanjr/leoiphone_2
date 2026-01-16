/**
 * Script para remoção SEGURA de imagens órfãs do Supabase Storage
 * Etapa 2 - Fase 3: Backup e Remoção
 * 
 * IMPORTANTE: Este script faz BACKUP antes de remover!
 * 
 * Modos de execução:
 *   --dry-run     Apenas simula, não remove nada (padrão)
 *   --backup      Faz backup para bucket 'produtos-backup'
 *   --remove      Remove as imagens órfãs (requer backup prévio)
 *   --restore     Restaura imagens do backup
 * 
 * Exemplos:
 *   npx tsx scripts/storage-remove-orphans.ts --dry-run
 *   npx tsx scripts/storage-remove-orphans.ts --backup
 *   npx tsx scripts/storage-remove-orphans.ts --remove
 *   npx tsx scripts/storage-remove-orphans.ts --restore
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Configurações
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aswejqbtejibrilrblnm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não definida')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const SOURCE_BUCKET = 'produtos'
const BACKUP_BUCKET = 'produtos-backup'
const BATCH_SIZE = 20 // Arquivos por batch para evitar rate limiting
const DELAY_BETWEEN_BATCHES = 500 // ms

// Interfaces
interface OrphanFile {
  fileName: string
  fullUrl: string
  size: number | null
  createdAt: string
  updatedAt: string
  mimeType: string | null
}

interface OperationResult {
  success: string[]
  failed: { fileName: string; error: string }[]
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getLatestReportPath(): string | null {
  const reportsDir = path.join(process.cwd(), 'scripts', 'reports')
  
  if (!fs.existsSync(reportsDir)) {
    return null
  }

  const files = fs.readdirSync(reportsDir)
    .filter(f => f.startsWith('storage-orphans-') && f.endsWith('.json'))
    .sort()
    .reverse()

  return files.length > 0 ? path.join(reportsDir, files[0]) : null
}

function loadOrphanReport(): OrphanFile[] {
  const reportPath = getLatestReportPath()
  
  if (!reportPath) {
    console.error('❌ Nenhum relatório de órfãs encontrado!')
    console.log('Execute primeiro: npx tsx scripts/storage-cleanup.ts')
    process.exit(1)
  }

  console.log(`📄 Carregando relatório: ${path.basename(reportPath)}`)
  
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))
  return report.orphanFiles
}

async function ensureBackupBucketExists(): Promise<boolean> {
  // Verificar se bucket existe
  const { data: buckets } = await supabase.storage.listBuckets()
  
  const backupExists = buckets?.some(b => b.name === BACKUP_BUCKET)
  
  if (!backupExists) {
    console.log(`📦 Criando bucket de backup: ${BACKUP_BUCKET}`)
    
    const { error } = await supabase.storage.createBucket(BACKUP_BUCKET, {
      public: false, // Privado por segurança
      fileSizeLimit: 52428800 // 50MB
    })
    
    if (error) {
      console.error('❌ Erro ao criar bucket de backup:', error.message)
      return false
    }
    
    console.log('✅ Bucket de backup criado!')
  } else {
    console.log(`✅ Bucket de backup já existe: ${BACKUP_BUCKET}`)
  }
  
  return true
}

// ============================================
// OPERAÇÃO: BACKUP
// ============================================

async function backupOrphans(orphans: OrphanFile[]): Promise<OperationResult> {
  console.log('\n' + '═'.repeat(60))
  console.log('BACKUP: Copiando imagens órfãs para bucket de backup')
  console.log('═'.repeat(60))
  
  // Garantir que bucket existe
  const bucketReady = await ensureBackupBucketExists()
  if (!bucketReady) {
    return { success: [], failed: [{ fileName: 'ALL', error: 'Falha ao criar bucket' }] }
  }

  const result: OperationResult = { success: [], failed: [] }
  const totalBatches = Math.ceil(orphans.length / BATCH_SIZE)
  
  console.log(`\n📦 Total de arquivos: ${orphans.length}`)
  console.log(`📦 Batches de ${BATCH_SIZE}: ${totalBatches}\n`)

  for (let i = 0; i < orphans.length; i += BATCH_SIZE) {
    const batch = orphans.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    
    console.log(`⏳ Batch ${batchNum}/${totalBatches} (${batch.length} arquivos)...`)
    
    // Processar batch em paralelo
    const promises = batch.map(async (orphan) => {
      try {
        // Download do arquivo original
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(SOURCE_BUCKET)
          .download(orphan.fileName)
        
        if (downloadError || !fileData) {
          throw new Error(downloadError?.message || 'Arquivo não encontrado')
        }

        // Upload para bucket de backup
        const { error: uploadError } = await supabase.storage
          .from(BACKUP_BUCKET)
          .upload(orphan.fileName, fileData, {
            contentType: orphan.mimeType || 'image/webp',
            upsert: true
          })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        return { success: true, fileName: orphan.fileName }
      } catch (error: any) {
        return { success: false, fileName: orphan.fileName, error: error.message }
      }
    })

    const batchResults = await Promise.all(promises)
    
    for (const res of batchResults) {
      if (res.success) {
        result.success.push(res.fileName)
      } else {
        result.failed.push({ fileName: res.fileName, error: res.error || 'Erro desconhecido' })
      }
    }
    
    console.log(`   ✅ ${result.success.length} ok | ❌ ${result.failed.length} falhas`)
    
    // Delay entre batches
    if (i + BATCH_SIZE < orphans.length) {
      await sleep(DELAY_BETWEEN_BATCHES)
    }
  }

  // Salvar log do backup
  const logPath = path.join(process.cwd(), 'scripts', 'reports', `backup-log-${Date.now()}.json`)
  fs.writeFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: 'backup',
    totalFiles: orphans.length,
    success: result.success.length,
    failed: result.failed.length,
    failedFiles: result.failed
  }, null, 2))
  
  console.log(`\n📄 Log salvo em: ${logPath}`)
  
  return result
}

// ============================================
// OPERAÇÃO: REMOÇÃO
// ============================================

async function removeOrphans(orphans: OrphanFile[]): Promise<OperationResult> {
  console.log('\n' + '═'.repeat(60))
  console.log('REMOÇÃO: Deletando imagens órfãs do bucket principal')
  console.log('═'.repeat(60))
  
  // Verificar se backup existe
  const { data: backupFiles } = await supabase.storage
    .from(BACKUP_BUCKET)
    .list('produtos', { limit: 1 })
  
  if (!backupFiles || backupFiles.length === 0) {
    console.error('\n⚠️  ATENÇÃO: Nenhum backup encontrado!')
    console.log('Execute primeiro: npx tsx scripts/storage-remove-orphans.ts --backup')
    console.log('Remoção cancelada por segurança.\n')
    return { success: [], failed: [] }
  }

  const result: OperationResult = { success: [], failed: [] }
  const totalBatches = Math.ceil(orphans.length / BATCH_SIZE)
  
  console.log(`\n🗑️  Total de arquivos: ${orphans.length}`)
  console.log(`📦 Batches de ${BATCH_SIZE}: ${totalBatches}\n`)

  for (let i = 0; i < orphans.length; i += BATCH_SIZE) {
    const batch = orphans.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    
    console.log(`⏳ Batch ${batchNum}/${totalBatches}...`)
    
    // Supabase permite deletar múltiplos arquivos de uma vez
    const filesToDelete = batch.map(o => o.fileName)
    
    const { error } = await supabase.storage
      .from(SOURCE_BUCKET)
      .remove(filesToDelete)
    
    if (error) {
      // Se falhar em batch, tentar um por um
      for (const orphan of batch) {
        const { error: singleError } = await supabase.storage
          .from(SOURCE_BUCKET)
          .remove([orphan.fileName])
        
        if (singleError) {
          result.failed.push({ fileName: orphan.fileName, error: singleError.message })
        } else {
          result.success.push(orphan.fileName)
        }
      }
    } else {
      result.success.push(...filesToDelete)
    }
    
    console.log(`   ✅ ${result.success.length} removidos | ❌ ${result.failed.length} falhas`)
    
    // Delay entre batches
    if (i + BATCH_SIZE < orphans.length) {
      await sleep(DELAY_BETWEEN_BATCHES)
    }
  }

  // Salvar log da remoção
  const logPath = path.join(process.cwd(), 'scripts', 'reports', `removal-log-${Date.now()}.json`)
  fs.writeFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: 'remove',
    totalFiles: orphans.length,
    success: result.success.length,
    failed: result.failed.length,
    removedFiles: result.success,
    failedFiles: result.failed
  }, null, 2))
  
  console.log(`\n📄 Log salvo em: ${logPath}`)
  
  return result
}

// ============================================
// OPERAÇÃO: RESTAURAÇÃO
// ============================================

async function restoreFromBackup(): Promise<OperationResult> {
  console.log('\n' + '═'.repeat(60))
  console.log('RESTAURAÇÃO: Recuperando imagens do backup')
  console.log('═'.repeat(60))
  
  // Listar todos os arquivos no backup
  const allBackupFiles: string[] = []
  let offset = 0
  const limit = 1000
  let hasMore = true

  // Primeiro listar pastas
  const { data: rootItems } = await supabase.storage
    .from(BACKUP_BUCKET)
    .list('', { limit: 1000 })

  const folders = rootItems?.filter(item => item.id === null).map(f => f.name) || []
  
  for (const folder of folders) {
    offset = 0
    hasMore = true
    
    while (hasMore) {
      const { data, error } = await supabase.storage
        .from(BACKUP_BUCKET)
        .list(folder, { limit, offset })

      if (error || !data || data.length === 0) {
        hasMore = false
      } else {
        const files = data
          .filter(item => item.id !== null)
          .map(item => `${folder}/${item.name}`)
        
        allBackupFiles.push(...files)
        offset += limit
        hasMore = data.length === limit
      }
    }
  }

  if (allBackupFiles.length === 0) {
    console.log('\n⚠️  Nenhum arquivo encontrado no backup!')
    return { success: [], failed: [] }
  }

  console.log(`\n📦 Arquivos no backup: ${allBackupFiles.length}`)

  const result: OperationResult = { success: [], failed: [] }
  const totalBatches = Math.ceil(allBackupFiles.length / BATCH_SIZE)

  for (let i = 0; i < allBackupFiles.length; i += BATCH_SIZE) {
    const batch = allBackupFiles.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    
    console.log(`⏳ Batch ${batchNum}/${totalBatches} (${batch.length} arquivos)...`)
    
    const promises = batch.map(async (fileName) => {
      try {
        // Download do backup
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(BACKUP_BUCKET)
          .download(fileName)
        
        if (downloadError || !fileData) {
          throw new Error(downloadError?.message || 'Arquivo não encontrado')
        }

        // Upload de volta para bucket principal
        const { error: uploadError } = await supabase.storage
          .from(SOURCE_BUCKET)
          .upload(fileName, fileData, {
            contentType: 'image/webp',
            upsert: true // Sobrescrever se existir
          })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        return { success: true, fileName }
      } catch (error: any) {
        return { success: false, fileName, error: error.message }
      }
    })

    const batchResults = await Promise.all(promises)
    
    for (const res of batchResults) {
      if (res.success) {
        result.success.push(res.fileName)
      } else {
        result.failed.push({ fileName: res.fileName, error: res.error || 'Erro desconhecido' })
      }
    }
    
    console.log(`   ✅ ${result.success.length} restaurados | ❌ ${result.failed.length} falhas`)
    
    if (i + BATCH_SIZE < allBackupFiles.length) {
      await sleep(DELAY_BETWEEN_BATCHES)
    }
  }

  // Salvar log da restauração
  const logPath = path.join(process.cwd(), 'scripts', 'reports', `restore-log-${Date.now()}.json`)
  fs.writeFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: 'restore',
    totalFiles: allBackupFiles.length,
    success: result.success.length,
    failed: result.failed.length,
    restoredFiles: result.success,
    failedFiles: result.failed
  }, null, 2))
  
  console.log(`\n📄 Log salvo em: ${logPath}`)
  
  return result
}

// ============================================
// OPERAÇÃO: DRY RUN (SIMULAÇÃO)
// ============================================

function dryRun(orphans: OrphanFile[]): void {
  console.log('\n' + '═'.repeat(60))
  console.log('DRY RUN: Simulação (nenhum arquivo será modificado)')
  console.log('═'.repeat(60))
  
  const totalSize = orphans.reduce((sum, f) => sum + (f.size || 0), 0)
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2)
  
  console.log(`
📊 RESUMO DA SIMULAÇÃO
─────────────────────────────────────────
📁 Arquivos órfãos a processar: ${orphans.length}
💾 Tamanho total: ${sizeMB} MB
📦 Batches necessários: ${Math.ceil(orphans.length / BATCH_SIZE)}
⏱️  Tempo estimado backup: ~${Math.ceil(orphans.length / BATCH_SIZE * 2)} minutos
⏱️  Tempo estimado remoção: ~${Math.ceil(orphans.length / BATCH_SIZE)} minutos
─────────────────────────────────────────

📋 Primeiros 20 arquivos a serem processados:
`)
  
  orphans.slice(0, 20).forEach((orphan, i) => {
    const size = orphan.size ? `(${(orphan.size / 1024).toFixed(1)} KB)` : ''
    console.log(`   ${(i + 1).toString().padStart(2)}. ${orphan.fileName} ${size}`)
  })
  
  if (orphans.length > 20) {
    console.log(`   ... e mais ${orphans.length - 20} arquivos`)
  }
  
  console.log(`
─────────────────────────────────────────
🔹 Para fazer backup:  npx tsx scripts/storage-remove-orphans.ts --backup
🔹 Para remover:       npx tsx scripts/storage-remove-orphans.ts --remove
🔹 Para restaurar:     npx tsx scripts/storage-remove-orphans.ts --restore
─────────────────────────────────────────
`)
}

// ============================================
// EXECUÇÃO PRINCIPAL
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const mode = args[0] || '--dry-run'
  
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║   REMOÇÃO SEGURA DE IMAGENS ÓRFÃS                            ║')
  console.log('║   Com backup e opção de restauração                          ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  
  try {
    if (mode === '--restore') {
      // Restauração não precisa do relatório de órfãos
      const result = await restoreFromBackup()
      
      console.log('\n' + '═'.repeat(60))
      console.log('RESULTADO FINAL - RESTAURAÇÃO')
      console.log('═'.repeat(60))
      console.log(`✅ Restaurados: ${result.success.length}`)
      console.log(`❌ Falhas: ${result.failed.length}`)
      
      if (result.failed.length > 0) {
        console.log('\n⚠️  Arquivos com falha:')
        result.failed.slice(0, 10).forEach(f => {
          console.log(`   - ${f.fileName}: ${f.error}`)
        })
      }
      
      return
    }

    // Carregar relatório de órfãos
    const orphans = loadOrphanReport()
    console.log(`\n📦 ${orphans.length} imagens órfãs encontradas no relatório`)

    switch (mode) {
      case '--dry-run':
        dryRun(orphans)
        break
        
      case '--backup':
        const backupResult = await backupOrphans(orphans)
        
        console.log('\n' + '═'.repeat(60))
        console.log('RESULTADO FINAL - BACKUP')
        console.log('═'.repeat(60))
        console.log(`✅ Backup concluído: ${backupResult.success.length} arquivos`)
        console.log(`❌ Falhas: ${backupResult.failed.length}`)
        
        if (backupResult.success.length === orphans.length) {
          console.log('\n✅ Backup completo! Agora você pode executar a remoção com segurança.')
          console.log('   npx tsx scripts/storage-remove-orphans.ts --remove\n')
        }
        break
        
      case '--remove':
        console.log('\n⚠️  ATENÇÃO: Você está prestes a REMOVER arquivos!')
        console.log('   Certifique-se de que o backup foi feito.\n')
        
        const removeResult = await removeOrphans(orphans)
        
        console.log('\n' + '═'.repeat(60))
        console.log('RESULTADO FINAL - REMOÇÃO')
        console.log('═'.repeat(60))
        console.log(`✅ Removidos: ${removeResult.success.length}`)
        console.log(`❌ Falhas: ${removeResult.failed.length}`)
        
        if (removeResult.success.length > 0) {
          console.log(`\n💾 Espaço liberado estimado: ~${(orphans.filter(o => 
            removeResult.success.includes(o.fileName)
          ).reduce((s, o) => s + (o.size || 0), 0) / (1024 * 1024)).toFixed(2)} MB`)
        }
        
        console.log('\n📌 Para restaurar caso necessário:')
        console.log('   npx tsx scripts/storage-remove-orphans.ts --restore\n')
        break
        
      default:
        console.log(`\n❌ Modo desconhecido: ${mode}`)
        console.log('Modos válidos: --dry-run, --backup, --remove, --restore\n')
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante a execução:', error)
    process.exit(1)
  }
}

main()
