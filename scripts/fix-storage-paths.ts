/**
 * Script para mover arquivos da subpasta produtos/produtos para a raiz produtos/
 * E atualizar as URLs no banco de dados
 * 
 * Executar com: npx tsx scripts/fix-storage-paths.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aswejqbtejibrilrblnm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não definida')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BUCKET_NAME = 'produtos'
const OLD_PREFIX = 'produtos/' // Subpasta errada
const BATCH_SIZE = 20
const DELAY_MS = 300

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║   CORREÇÃO DE CAMINHOS DO STORAGE                            ║')
  console.log('║   Movendo de produtos/produtos/ para produtos/               ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  // 1. Listar todos os arquivos na subpasta produtos/
  console.log('📦 Listando arquivos na subpasta produtos/produtos/...')
  
  const allFiles: { name: string; fullPath: string }[] = []
  let offset = 0
  const limit = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('produtos', { limit, offset })

    if (error) {
      console.error('❌ Erro ao listar:', error.message)
      throw error
    }

    if (!data || data.length === 0) {
      hasMore = false
    } else {
      const files = data
        .filter(item => item.id !== null) // Apenas arquivos, não pastas
        .map(item => ({
          name: item.name,
          fullPath: `produtos/${item.name}`
        }))
      
      allFiles.push(...files)
      offset += limit
      hasMore = data.length === limit
    }
  }

  console.log(`   Total: ${allFiles.length} arquivos na subpasta\n`)

  if (allFiles.length === 0) {
    console.log('✅ Nenhum arquivo para mover!')
    return
  }

  // 2. Mover cada arquivo: download + upload na raiz + delete do antigo
  console.log('🔄 Movendo arquivos para a raiz do bucket...\n')
  
  const moved: string[] = []
  const failed: { file: string; error: string }[] = []
  const totalBatches = Math.ceil(allFiles.length / BATCH_SIZE)

  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1

    const promises = batch.map(async (file) => {
      try {
        // Download do arquivo
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(BUCKET_NAME)
          .download(file.fullPath)

        if (downloadError || !fileData) {
          throw new Error(`Download falhou: ${downloadError?.message}`)
        }

        // Upload na raiz (sem a pasta produtos/)
        const newPath = file.name
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(newPath, fileData, {
            contentType: 'image/webp',
            upsert: true
          })

        if (uploadError) {
          throw new Error(`Upload falhou: ${uploadError.message}`)
        }

        // Deletar arquivo antigo
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([file.fullPath])

        if (deleteError) {
          console.warn(`   ⚠️  Arquivo movido mas não deletado: ${file.name}`)
        }

        return { success: true, file: file.name }
      } catch (error: any) {
        return { success: false, file: file.name, error: error.message }
      }
    })

    const results = await Promise.all(promises)

    for (const result of results) {
      if (result.success) {
        moved.push(result.file)
      } else {
        failed.push({ file: result.file, error: result.error || 'Erro desconhecido' })
      }
    }

    const progress = ((batchNum / totalBatches) * 100).toFixed(1)
    console.log(`   Batch ${batchNum}/${totalBatches} - ${progress}% - ✅ ${moved.length} movidos`)

    if (i + BATCH_SIZE < allFiles.length) {
      await sleep(DELAY_MS)
    }
  }

  console.log(`\n✅ Arquivos movidos: ${moved.length}`)
  console.log(`❌ Falhas: ${failed.length}`)

  if (failed.length > 0) {
    console.log('\n⚠️  Arquivos com falha:')
    failed.slice(0, 10).forEach(f => console.log(`   - ${f.file}: ${f.error}`))
  }

  // 3. Atualizar URLs no banco de dados
  console.log('\n' + '═'.repeat(60))
  console.log('📋 Atualizando URLs no banco de dados...')
  console.log('═'.repeat(60) + '\n')

  // URL antiga: .../produtos/produtos/arquivo.webp
  // URL nova:   .../produtos/arquivo.webp
  const OLD_URL_PATTERN = '/produtos/produtos/'
  const NEW_URL_PATTERN = '/produtos/'

  // Buscar todos os produtos
  const { data: produtos, error: produtosError } = await supabase
    .from('produtos')
    .select('id, fotos, foto_principal')

  if (produtosError) {
    console.error('❌ Erro ao buscar produtos:', produtosError.message)
    return
  }

  let updatedProducts = 0

  for (const produto of produtos || []) {
    let needsUpdate = false
    let newFotoPrincipal = produto.foto_principal
    let newFotos = produto.fotos

    // Atualizar foto_principal
    if (produto.foto_principal && produto.foto_principal.includes(OLD_URL_PATTERN)) {
      newFotoPrincipal = produto.foto_principal.replace('/produtos/produtos/', '/produtos/')
      needsUpdate = true
    }

    // Atualizar array de fotos
    if (produto.fotos && Array.isArray(produto.fotos)) {
      newFotos = produto.fotos.map((foto: string) => {
        if (foto && foto.includes(OLD_URL_PATTERN)) {
          needsUpdate = true
          return foto.replace('/produtos/produtos/', '/produtos/')
        }
        return foto
      })
    }

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('produtos')
        .update({
          foto_principal: newFotoPrincipal,
          fotos: newFotos
        })
        .eq('id', produto.id)

      if (updateError) {
        console.error(`   ❌ Erro ao atualizar produto ${produto.id}: ${updateError.message}`)
      } else {
        updatedProducts++
      }
    }
  }

  console.log(`✅ Produtos atualizados: ${updatedProducts}`)

  // 4. Verificar banners também
  const { data: banners } = await supabase
    .from('banners')
    .select('id, imagem_url')

  let updatedBanners = 0

  for (const banner of banners || []) {
    if (banner.imagem_url && banner.imagem_url.includes(OLD_URL_PATTERN)) {
      const newUrl = banner.imagem_url.replace('/produtos/produtos/', '/produtos/')
      
      const { error: updateError } = await supabase
        .from('banners')
        .update({ imagem_url: newUrl })
        .eq('id', banner.id)

      if (!updateError) {
        updatedBanners++
      }
    }
  }

  console.log(`✅ Banners atualizados: ${updatedBanners}`)

  // 5. Deletar pasta vazia (se possível)
  console.log('\n🗑️  Tentando remover pasta produtos/ vazia...')
  
  // Verificar se a pasta está vazia
  const { data: remaining } = await supabase.storage
    .from(BUCKET_NAME)
    .list('produtos', { limit: 1 })

  if (!remaining || remaining.length === 0) {
    console.log('   ✅ Pasta produtos/ está vazia (será removida automaticamente)')
  } else {
    console.log(`   ⚠️  Ainda há ${remaining.length} item(s) na pasta produtos/`)
  }

  // Resumo final
  console.log('\n' + '═'.repeat(60))
  console.log('RESUMO FINAL')
  console.log('═'.repeat(60))
  console.log(`   📁 Arquivos movidos: ${moved.length}`)
  console.log(`   📋 Produtos atualizados: ${updatedProducts}`)
  console.log(`   🎨 Banners atualizados: ${updatedBanners}`)
  console.log(`   ❌ Falhas: ${failed.length}`)
  console.log('═'.repeat(60))
  console.log('\n✅ Correção concluída!')
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err)
  process.exit(1)
})
