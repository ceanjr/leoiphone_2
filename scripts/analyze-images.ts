/**
 * Script de análise detalhada das imagens do Supabase
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aswejqbtejibrilrblnm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não definida')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyze() {
  const { data: produtos } = await supabase.from('produtos').select('id, nome, fotos, foto_principal, ativo, deleted_at')
  
  if (!produtos) {
    console.log('Nenhum produto encontrado')
    return
  }

  const supabaseUrls = new Set<string>()
  const firebaseUrls = new Set<string>()
  const supabaseFileNames = new Set<string>()
  
  for (const p of produtos) {
    // foto_principal
    if (p.foto_principal) {
      if (p.foto_principal.includes('supabase.co')) {
        supabaseUrls.add(p.foto_principal)
        const match = p.foto_principal.match(/\/produtos\/(.+)$/)
        if (match) supabaseFileNames.add(match[1])
      } else if (p.foto_principal.includes('firebase')) {
        firebaseUrls.add(p.foto_principal)
      }
    }
    
    // fotos
    if (p.fotos && Array.isArray(p.fotos)) {
      for (const foto of p.fotos) {
        if (foto) {
          if (foto.includes('supabase.co')) {
            supabaseUrls.add(foto)
            const match = foto.match(/\/produtos\/(.+)$/)
            if (match) supabaseFileNames.add(match[1])
          } else if (foto.includes('firebase')) {
            firebaseUrls.add(foto)
          }
        }
      }
    }
  }
  
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║   ANÁLISE DETALHADA DE IMAGENS                               ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log('📊 RESUMO GERAL:')
  console.log('─'.repeat(50))
  console.log(`   Total de produtos: ${produtos.length}`)
  console.log(`   URLs únicas do Supabase: ${supabaseUrls.size}`)
  console.log(`   URLs únicas do Firebase: ${firebaseUrls.size}`)
  console.log(`   Arquivos Supabase referenciados: ${supabaseFileNames.size}`)
  console.log('')
  
  // Verificar variantes
  const variants = { original: 0, large: 0, medium: 0, small: 0, thumb: 0, noVariant: 0 }
  
  for (const url of supabaseUrls) {
    if (url.includes('-original.')) variants.original++
    else if (url.includes('-large.')) variants.large++
    else if (url.includes('-medium.')) variants.medium++
    else if (url.includes('-small.')) variants.small++
    else if (url.includes('-thumb.')) variants.thumb++
    else variants.noVariant++
  }
  
  console.log('📁 VARIANTES DAS URLs DO SUPABASE:')
  console.log('─'.repeat(50))
  console.log(`   -original (armazenada): ${variants.original}`)
  console.log(`   -large: ${variants.large}`)
  console.log(`   -medium: ${variants.medium}`)
  console.log(`   -small: ${variants.small}`)
  console.log(`   -thumb: ${variants.thumb}`)
  console.log(`   Sem variante (formato antigo): ${variants.noVariant}`)
  console.log('')
  
  // Produtos por status
  const ativos = produtos.filter(p => p.ativo && !p.deleted_at)
  const inativos = produtos.filter(p => !p.ativo && !p.deleted_at)
  const deletados = produtos.filter(p => p.deleted_at)
  
  const countSupabase = (prods: typeof produtos) => {
    return prods.filter(p => 
      (p.foto_principal && p.foto_principal.includes('supabase.co')) ||
      (p.fotos?.some((f: string) => f?.includes('supabase.co')))
    ).length
  }
  
  const countFirebase = (prods: typeof produtos) => {
    return prods.filter(p => 
      (p.foto_principal && p.foto_principal.includes('firebase')) ||
      (p.fotos?.some((f: string) => f?.includes('firebase')))
    ).length
  }
  
  console.log('📦 PRODUTOS POR STATUS E ORIGEM DA IMAGEM:')
  console.log('─'.repeat(50))
  console.log(`   ATIVOS (${ativos.length} produtos):`)
  console.log(`      - Com imagens Supabase: ${countSupabase(ativos)}`)
  console.log(`      - Com imagens Firebase: ${countFirebase(ativos)}`)
  console.log('')
  console.log(`   INATIVOS (${inativos.length} produtos):`)
  console.log(`      - Com imagens Supabase: ${countSupabase(inativos)}`)
  console.log(`      - Com imagens Firebase: ${countFirebase(inativos)}`)
  console.log('')
  console.log(`   DELETADOS (${deletados.length} produtos):`)
  console.log(`      - Com imagens Supabase: ${countSupabase(deletados)}`)
  console.log(`      - Com imagens Firebase: ${countFirebase(deletados)}`)
  console.log('')
  
  // Listar os arquivos do Supabase únicos
  console.log('📋 ARQUIVOS SUPABASE ÚNICOS REFERENCIADOS:')
  console.log('─'.repeat(50))
  
  const sortedFiles = [...supabaseFileNames].sort()
  sortedFiles.slice(0, 15).forEach((f, i) => console.log(`   ${i + 1}. ${f}`))
  if (sortedFiles.length > 15) {
    console.log(`   ... e mais ${sortedFiles.length - 15} arquivos`)
  }
  console.log('')
  
  // CONCLUSÃO
  console.log('═'.repeat(60))
  console.log('CONCLUSÃO:')
  console.log('═'.repeat(60))
  console.log(`
✅ As URLs referenciadas no banco são:
   - ${supabaseUrls.size} URLs do Supabase (armazenadas)
   - ${firebaseUrls.size} URLs do Firebase (legado, externo)

📌 Apenas arquivos do bucket 'produtos' do Supabase serão
   considerados para limpeza. As imagens do Firebase
   estão em outro serviço e não serão afetadas.

⚠️  O sistema armazena APENAS a versão "-original" das imagens.
   As outras variantes (thumb, small, medium, large) são
   geradas dinamicamente ou não estão mais sendo usadas.
`)
}

analyze().catch(console.error)
