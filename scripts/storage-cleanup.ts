/**
 * Script para limpeza de imagens órfãs do Supabase Storage
 * Etapa 2 - Fases 1 e 2: Inventário e Validação
 * 
 * Executar com: npx tsx scripts/storage-cleanup.ts
 * 
 * Este script:
 * 1. Lista TODAS as imagens no bucket 'produtos'
 * 2. Extrai TODAS as URLs referenciadas no banco de dados
 * 3. Identifica imagens órfãs (não referenciadas)
 * 4. Gera relatório JSON para revisão manual
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Configurações
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aswejqbtejibrilrblnm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não definida')
  console.log('Execute com: SUPABASE_SERVICE_ROLE_KEY=sua_key npx tsx scripts/storage-cleanup.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const BUCKET_NAME = 'produtos'
const STORAGE_BASE_URL = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/`

// Interfaces
interface StorageFile {
  name: string
  id: string
  created_at: string
  updated_at: string
  metadata: {
    size?: number
    mimetype?: string
  }
}

interface OrphanFile {
  fileName: string
  fullUrl: string
  size: number | null
  createdAt: string
  updatedAt: string
  mimeType: string | null
}

interface ReferencedImage {
  url: string
  source: 'produtos.fotos' | 'produtos.foto_principal' | 'banners.imagem_url'
  produtoId?: number
  bannerId?: number
}

interface CleanupReport {
  generatedAt: string
  summary: {
    totalStorageFiles: number
    totalReferencedUrls: number
    totalOrphanFiles: number
    estimatedOrphanSize: string
  }
  storageFiles: string[]
  referencedUrls: string[]
  orphanFiles: OrphanFile[]
}

// ============================================
// FASE 1: INVENTÁRIO
// ============================================

/**
 * Lista TODAS as imagens no bucket 'produtos' do Supabase Storage
 * Inclui subpastas recursivamente
 */
async function listAllStorageFiles(): Promise<StorageFile[]> {
  console.log('\n📦 Fase 1.1: Listando arquivos no storage...\n')
  
  const allFiles: StorageFile[] = []
  
  // Primeiro, listar as pastas na raiz
  const { data: rootItems, error: rootError } = await supabase.storage
    .from(BUCKET_NAME)
    .list('', { limit: 1000 })

  if (rootError) {
    console.error('❌ Erro ao listar raiz do storage:', rootError.message)
    throw rootError
  }

  // Identificar pastas e arquivos na raiz
  const folders: string[] = []
  
  if (rootItems) {
    for (const item of rootItems) {
      // Pastas têm id null no Supabase Storage
      if (item.id === null) {
        folders.push(item.name)
        console.log(`   📁 Pasta encontrada: ${item.name}`)
      } else if (item.name) {
        // Arquivo na raiz
        allFiles.push(item as StorageFile)
      }
    }
  }

  // Listar arquivos de cada pasta
  for (const folder of folders) {
    console.log(`   📂 Listando pasta: ${folder}`)
    let offset = 0
    const limit = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folder, {
          limit,
          offset,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error(`❌ Erro ao listar pasta ${folder}:`, error.message)
        throw error
      }

      if (!data || data.length === 0) {
        hasMore = false
      } else {
        // Filtrar apenas arquivos (não pastas)
        const files = data
          .filter(item => item.name && item.id !== null)
          .map(item => ({
            ...item,
            name: `${folder}/${item.name}` // Incluir o caminho da pasta
          })) as StorageFile[]
        
        allFiles.push(...files)
        
        console.log(`      Encontrados ${allFiles.length} arquivos até agora...`)
        
        offset += limit
        hasMore = data.length === limit
      }
    }
  }

  // Se não houver pastas, listar diretamente a raiz com paginação
  if (folders.length === 0) {
    let offset = 0
    const limit = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          limit,
          offset,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error('❌ Erro ao listar storage:', error.message)
        throw error
      }

      if (!data || data.length === 0) {
        hasMore = false
      } else {
        const files = data.filter(item => item.name && item.id !== null) as StorageFile[]
        allFiles.push(...files)
        
        console.log(`   Encontrados ${allFiles.length} arquivos até agora...`)
        
        offset += limit
        hasMore = data.length === limit
      }
    }
  }

  console.log(`✅ Total de arquivos no storage: ${allFiles.length}`)
  return allFiles
}

/**
 * Extrai todas as URLs de imagens referenciadas na tabela produtos
 */
async function getReferencedImagesFromProdutos(): Promise<ReferencedImage[]> {
  console.log('\n📋 Fase 1.2: Extraindo URLs da tabela produtos...\n')
  
  const references: ReferencedImage[] = []
  
  // Buscar TODOS os produtos, incluindo inativos e soft-deleted
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, fotos, foto_principal')

  if (error) {
    console.error('❌ Erro ao buscar produtos:', error.message)
    throw error
  }

  if (!produtos) {
    console.log('   Nenhum produto encontrado')
    return references
  }

  for (const produto of produtos) {
    // Processar foto_principal
    if (produto.foto_principal) {
      references.push({
        url: produto.foto_principal,
        source: 'produtos.foto_principal',
        produtoId: produto.id
      })
    }

    // Processar array de fotos
    if (produto.fotos && Array.isArray(produto.fotos)) {
      for (const foto of produto.fotos) {
        if (foto) {
          references.push({
            url: foto,
            source: 'produtos.fotos',
            produtoId: produto.id
          })
        }
      }
    }
  }

  console.log(`✅ URLs de produtos: ${references.length} (de ${produtos.length} produtos)`)
  return references
}

/**
 * Extrai todas as URLs de imagens referenciadas na tabela banners
 */
async function getReferencedImagesFromBanners(): Promise<ReferencedImage[]> {
  console.log('\n📋 Fase 1.3: Extraindo URLs da tabela banners...\n')
  
  const references: ReferencedImage[] = []
  
  // Buscar TODOS os banners, incluindo inativos
  const { data: banners, error } = await supabase
    .from('banners')
    .select('id, imagem_url')

  if (error) {
    console.error('❌ Erro ao buscar banners:', error.message)
    throw error
  }

  if (!banners) {
    console.log('   Nenhum banner encontrado')
    return references
  }

  for (const banner of banners) {
    if (banner.imagem_url) {
      references.push({
        url: banner.imagem_url,
        source: 'banners.imagem_url',
        bannerId: banner.id
      })
    }
  }

  console.log(`✅ URLs de banners: ${references.length} (de ${banners.length} banners)`)
  return references
}

/**
 * Extrai o nome do arquivo de uma URL completa do Supabase Storage
 */
function extractFileNameFromUrl(url: string): string | null {
  if (!url) return null
  
  // Exemplo de URL: https://aswejqbtejibrilrblnm.supabase.co/storage/v1/object/public/produtos/1736789012345-abc123-thumb.webp
  // Queremos extrair: 1736789012345-abc123-thumb.webp
  
  try {
    // Tentar extrair após /produtos/
    const match = url.match(/\/produtos\/(.+)$/)
    if (match) {
      return decodeURIComponent(match[1])
    }
    
    // Se não for uma URL do Supabase, pode ser uma URL de outro serviço
    return null
  } catch {
    return null
  }
}

// ============================================
// FASE 2: VALIDAÇÃO
// ============================================

/**
 * Identifica imagens órfãs comparando storage com referências
 */
function identifyOrphanFiles(
  storageFiles: StorageFile[],
  references: ReferencedImage[]
): OrphanFile[] {
  console.log('\n🔍 Fase 2.1: Identificando imagens órfãs...\n')
  
  // Criar Set de nomes de arquivos referenciados (para busca O(1))
  const referencedFileNames = new Set<string>()
  
  for (const ref of references) {
    const fileName = extractFileNameFromUrl(ref.url)
    if (fileName) {
      referencedFileNames.add(fileName)
    }
  }

  console.log(`   Arquivos únicos referenciados: ${referencedFileNames.size}`)
  
  // Identificar órfãos
  const orphans: OrphanFile[] = []
  
  for (const file of storageFiles) {
    if (!referencedFileNames.has(file.name)) {
      orphans.push({
        fileName: file.name,
        fullUrl: `${STORAGE_BASE_URL}${encodeURIComponent(file.name)}`,
        size: file.metadata?.size || null,
        createdAt: file.created_at,
        updatedAt: file.updated_at,
        mimeType: file.metadata?.mimetype || null
      })
    }
  }

  console.log(`✅ Imagens órfãs encontradas: ${orphans.length}`)
  return orphans
}

/**
 * Calcula o tamanho total estimado das imagens órfãs
 */
function calculateTotalSize(orphans: OrphanFile[]): string {
  const totalBytes = orphans.reduce((sum, file) => sum + (file.size || 0), 0)
  
  if (totalBytes < 1024) return `${totalBytes} bytes`
  if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(2)} KB`
  if (totalBytes < 1024 * 1024 * 1024) return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * Gera relatório JSON para revisão manual
 */
function generateReport(
  storageFiles: StorageFile[],
  references: ReferencedImage[],
  orphans: OrphanFile[]
): CleanupReport {
  console.log('\n📝 Fase 2.2: Gerando relatório...\n')
  
  const uniqueReferencedUrls = [...new Set(references.map(r => r.url))]
  
  const report: CleanupReport = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalStorageFiles: storageFiles.length,
      totalReferencedUrls: uniqueReferencedUrls.length,
      totalOrphanFiles: orphans.length,
      estimatedOrphanSize: calculateTotalSize(orphans)
    },
    storageFiles: storageFiles.map(f => f.name).sort(),
    referencedUrls: uniqueReferencedUrls.sort(),
    orphanFiles: orphans.sort((a, b) => a.fileName.localeCompare(b.fileName))
  }

  return report
}

/**
 * Salva o relatório em arquivo JSON
 */
function saveReport(report: CleanupReport): string {
  const outputDir = path.join(process.cwd(), 'scripts', 'reports')
  
  // Criar diretório se não existir
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputPath = path.join(outputDir, `storage-orphans-${timestamp}.json`)
  
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8')
  
  return outputPath
}

// ============================================
// EXECUÇÃO PRINCIPAL
// ============================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║   LIMPEZA DE IMAGENS ÓRFÃS - SUPABASE STORAGE                ║')
  console.log('║   Etapa 2 - Fases 1 e 2: Inventário e Validação              ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')

  try {
    // FASE 1: INVENTÁRIO
    console.log('\n' + '═'.repeat(60))
    console.log('FASE 1: INVENTÁRIO')
    console.log('═'.repeat(60))

    // 1.1 Listar todos os arquivos no storage
    const storageFiles = await listAllStorageFiles()

    // 1.2 Extrair URLs de produtos
    const produtoRefs = await getReferencedImagesFromProdutos()

    // 1.3 Extrair URLs de banners
    const bannerRefs = await getReferencedImagesFromBanners()

    // Combinar todas as referências
    const allReferences = [...produtoRefs, ...bannerRefs]
    console.log(`\n📊 Total de referências no banco: ${allReferences.length}`)

    // FASE 2: VALIDAÇÃO
    console.log('\n' + '═'.repeat(60))
    console.log('FASE 2: VALIDAÇÃO')
    console.log('═'.repeat(60))

    // 2.1 Identificar órfãos
    const orphans = identifyOrphanFiles(storageFiles, allReferences)

    // 2.2 Gerar relatório
    const report = generateReport(storageFiles, allReferences, orphans)

    // 2.3 Salvar relatório
    const reportPath = saveReport(report)

    // Exibir resumo final
    console.log('\n' + '═'.repeat(60))
    console.log('RESUMO FINAL')
    console.log('═'.repeat(60))
    console.log(`
📦 Arquivos no Storage:    ${report.summary.totalStorageFiles}
📋 URLs Referenciadas:     ${report.summary.totalReferencedUrls}
🗑️  Imagens Órfãs:          ${report.summary.totalOrphanFiles}
💾 Tamanho Estimado:       ${report.summary.estimatedOrphanSize}

📄 Relatório salvo em:
   ${reportPath}
`)

    // Mostrar preview das órfãs (máximo 10)
    if (orphans.length > 0) {
      console.log('📋 Preview das imagens órfãs (primeiras 10):')
      console.log('─'.repeat(60))
      orphans.slice(0, 10).forEach((orphan, index) => {
        const size = orphan.size ? `(${(orphan.size / 1024).toFixed(1)} KB)` : ''
        console.log(`   ${index + 1}. ${orphan.fileName} ${size}`)
      })
      if (orphans.length > 10) {
        console.log(`   ... e mais ${orphans.length - 10} arquivos`)
      }
      console.log('─'.repeat(60))
    }

    console.log('\n✅ Análise concluída com sucesso!')
    console.log('⚠️  NENHUM ARQUIVO FOI DELETADO - Este é apenas o relatório para revisão.')
    console.log('📝 Revise o relatório JSON antes de prosseguir com a remoção.\n')

  } catch (error) {
    console.error('\n❌ Erro durante a execução:', error)
    process.exit(1)
  }
}

// Executar
main()
