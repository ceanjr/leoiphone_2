/**
 * Script de VALIDAÇÃO COMPLETA das imagens referenciadas
 * Verifica TODAS as fontes possíveis de URLs de imagens
 * 
 * Executar com: npx tsx scripts/validate-image-references.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aswejqbtejibrilrblnm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não definida')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const STORAGE_DOMAIN = 'aswejqbtejibrilrblnm.supabase.co'

interface ImageReference {
  url: string
  source: string
  id: string | number
  context: string
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║   VALIDAÇÃO COMPLETA DE REFERÊNCIAS DE IMAGENS               ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  const allReferences: ImageReference[] = []

  // ============================================
  // 1. PRODUTOS - fotos (array) e foto_principal
  // ============================================
  console.log('📋 1. Verificando tabela PRODUTOS...')
  
  const { data: produtos, error: produtosError } = await supabase
    .from('produtos')
    .select('id, nome, fotos, foto_principal, ativo, deleted_at')

  if (produtosError) {
    console.error('   ❌ Erro:', produtosError.message)
  } else if (produtos) {
    let fotosCount = 0
    let fotoPrincipalCount = 0
    
    for (const produto of produtos) {
      // foto_principal
      if (produto.foto_principal && produto.foto_principal.includes(STORAGE_DOMAIN)) {
        allReferences.push({
          url: produto.foto_principal,
          source: 'produtos.foto_principal',
          id: produto.id,
          context: `Produto: ${produto.nome} (ativo: ${produto.ativo}, deleted: ${!!produto.deleted_at})`
        })
        fotoPrincipalCount++
      }
      
      // fotos (array)
      if (produto.fotos && Array.isArray(produto.fotos)) {
        for (const foto of produto.fotos) {
          if (foto && foto.includes(STORAGE_DOMAIN)) {
            allReferences.push({
              url: foto,
              source: 'produtos.fotos',
              id: produto.id,
              context: `Produto: ${produto.nome}`
            })
            fotosCount++
          }
        }
      }
    }
    
    console.log(`   ✅ ${produtos.length} produtos encontrados`)
    console.log(`      - foto_principal: ${fotoPrincipalCount} URLs`)
    console.log(`      - fotos[]: ${fotosCount} URLs`)
    console.log(`      - Ativos: ${produtos.filter(p => p.ativo && !p.deleted_at).length}`)
    console.log(`      - Inativos: ${produtos.filter(p => !p.ativo && !p.deleted_at).length}`)
    console.log(`      - Deletados: ${produtos.filter(p => p.deleted_at).length}`)
  }

  // ============================================
  // 2. BANNERS - imagem_url
  // ============================================
  console.log('\n📋 2. Verificando tabela BANNERS...')
  
  const { data: banners, error: bannersError } = await supabase
    .from('banners')
    .select('id, nome, tipo, imagem_url, ativo')

  if (bannersError) {
    console.error('   ❌ Erro:', bannersError.message)
  } else if (banners) {
    let bannerImageCount = 0
    
    for (const banner of banners) {
      if (banner.imagem_url && banner.imagem_url.includes(STORAGE_DOMAIN)) {
        allReferences.push({
          url: banner.imagem_url,
          source: 'banners.imagem_url',
          id: banner.id,
          context: `Banner: ${banner.nome} (tipo: ${banner.tipo}, ativo: ${banner.ativo})`
        })
        bannerImageCount++
      }
    }
    
    console.log(`   ✅ ${banners.length} banners encontrados`)
    console.log(`      - Com imagem: ${bannerImageCount}`)
    console.log(`      - Tipo banner: ${banners.filter(b => b.tipo === 'banner').length}`)
    console.log(`      - Tipo produto: ${banners.filter(b => b.tipo === 'produto').length}`)
  }

  // ============================================
  // 3. CATEGORIAS - Verificar se tem campo de imagem
  // ============================================
  console.log('\n📋 3. Verificando tabela CATEGORIAS...')
  
  const { data: categorias, error: categoriasError } = await supabase
    .from('categorias')
    .select('*')
    .limit(1)

  if (categoriasError) {
    console.error('   ❌ Erro:', categoriasError.message)
  } else if (categorias && categorias.length > 0) {
    const columns = Object.keys(categorias[0])
    const imageColumns = columns.filter(c => 
      c.includes('imagem') || c.includes('foto') || c.includes('image') || c.includes('url')
    )
    
    if (imageColumns.length > 0) {
      console.log(`   ⚠️  Campos de imagem encontrados: ${imageColumns.join(', ')}`)
    } else {
      console.log('   ✅ Nenhum campo de imagem na tabela categorias')
    }
  }

  // ============================================
  // 4. Outras tabelas que PODEM ter imagens
  // ============================================
  console.log('\n📋 4. Verificando outras tabelas potenciais...')
  
  // Verificar site_metrics, page_views, etc.
  const tablesToCheck = [
    'site_metrics',
    'page_views', 
    'active_sessions',
    'configuracoes_taxas',
    'presets_taxas',
    'produtos_custos'
  ]
  
  for (const tableName of tablesToCheck) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`   ⏭️  ${tableName}: não existe ou sem acesso`)
    } else if (data && data.length > 0) {
      const columns = Object.keys(data[0])
      const imageColumns = columns.filter(c => 
        c.includes('imagem') || c.includes('foto') || c.includes('image') || 
        c.includes('url') || c.includes('thumbnail') || c.includes('avatar')
      )
      
      if (imageColumns.length > 0) {
        console.log(`   ⚠️  ${tableName}: campos potenciais: ${imageColumns.join(', ')}`)
      } else {
        console.log(`   ✅ ${tableName}: sem campos de imagem`)
      }
    }
  }

  // ============================================
  // RESUMO FINAL
  // ============================================
  console.log('\n' + '═'.repeat(60))
  console.log('RESUMO FINAL')
  console.log('═'.repeat(60))
  
  // Contagem de URLs únicas
  const uniqueUrls = [...new Set(allReferences.map(r => r.url))]
  
  // Agrupar por fonte
  const bySource: Record<string, number> = {}
  for (const ref of allReferences) {
    bySource[ref.source] = (bySource[ref.source] || 0) + 1
  }
  
  console.log(`
📊 ESTATÍSTICAS DE REFERÊNCIAS:
─────────────────────────────────────────
Total de referências encontradas: ${allReferences.length}
URLs únicas (sem duplicatas):     ${uniqueUrls.length}
─────────────────────────────────────────

📋 POR FONTE:`)
  
  for (const [source, count] of Object.entries(bySource)) {
    console.log(`   ${source}: ${count} URLs`)
  }

  // Verificar se URLs únicas correspondem ao relatório anterior
  console.log(`
─────────────────────────────────────────
📌 COMPARAÇÃO COM RELATÓRIO ANTERIOR:
   Relatório anterior: 990 URLs únicas
   Esta validação:     ${uniqueUrls.length} URLs únicas
   Diferença:          ${uniqueUrls.length - 990}
─────────────────────────────────────────
`)

  // Extrair apenas nomes de arquivos para comparação
  const extractFileName = (url: string): string | null => {
    const match = url.match(/\/produtos\/(.+)$/)
    return match ? match[1] : null
  }

  const uniqueFileNames = [...new Set(uniqueUrls.map(extractFileName).filter(Boolean))]
  
  console.log(`📁 ARQUIVOS ÚNICOS REFERENCIADOS: ${uniqueFileNames.length}`)
  
  // Mostrar alguns exemplos
  console.log('\n📋 Exemplos de URLs referenciadas (primeiras 10):')
  uniqueUrls.slice(0, 10).forEach((url, i) => {
    const fileName = extractFileName(url)
    console.log(`   ${i + 1}. ${fileName}`)
  })

  // Verificar padrões de variantes
  console.log('\n📊 ANÁLISE DE VARIANTES:')
  const variants = {
    original: 0,
    large: 0,
    medium: 0,
    small: 0,
    thumb: 0,
    noVariant: 0
  }
  
  for (const url of uniqueUrls) {
    if (url.includes('-original.')) variants.original++
    else if (url.includes('-large.')) variants.large++
    else if (url.includes('-medium.')) variants.medium++
    else if (url.includes('-small.')) variants.small++
    else if (url.includes('-thumb.')) variants.thumb++
    else variants.noVariant++
  }
  
  console.log(`   -original: ${variants.original}`)
  console.log(`   -large:    ${variants.large}`)
  console.log(`   -medium:   ${variants.medium}`)
  console.log(`   -small:    ${variants.small}`)
  console.log(`   -thumb:    ${variants.thumb}`)
  console.log(`   Sem variante (base): ${variants.noVariant}`)
  
  console.log('\n✅ Validação concluída!')
}

main().catch(console.error)
