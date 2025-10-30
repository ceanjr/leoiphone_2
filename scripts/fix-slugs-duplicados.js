#!/usr/bin/env node

/**
 * Script para corrigir slugs duplicados ou sem sufixo aleatório
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function generateSlug(nome) {
  const baseSlug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  // Adicionar sufixo aleatório para garantir unicidade
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${baseSlug}-${randomSuffix}`
}

function slugTemSufixo(slug) {
  // Verificar se o slug termina com um padrão de 6 caracteres aleatórios
  const parts = slug.split('-')
  const lastPart = parts[parts.length - 1]

  // Um sufixo aleatório tem 6 caracteres alfanuméricos
  return lastPart && lastPart.length === 6 && /^[a-z0-9]{6}$/.test(lastPart)
}

async function main() {
  console.log('🔍 Buscando todos os produtos...\n')

  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Erro ao buscar produtos:', error)
    process.exit(1)
  }

  if (!produtos || produtos.length === 0) {
    console.log('✅ Nenhum produto encontrado.')
    return
  }

  console.log(`📦 Encontrados ${produtos.length} produto(s)\n`)

  // Agrupar produtos por slug para detectar duplicatas
  const slugMap = new Map()
  for (const produto of produtos) {
    if (!slugMap.has(produto.slug)) {
      slugMap.set(produto.slug, [])
    }
    slugMap.get(produto.slug).push(produto)
  }

  const produtosParaCorrigir = []

  // Verificar duplicatas
  for (const [slug, produtosComMesmoSlug] of slugMap) {
    if (produtosComMesmoSlug.length > 1) {
      console.log(`⚠️  Slug duplicado encontrado: "${slug}"`)
      console.log(`   ${produtosComMesmoSlug.length} produtos com o mesmo slug:`)

      for (const produto of produtosComMesmoSlug) {
        console.log(`   - ${produto.nome} (ID: ${produto.id}, criado em ${new Date(produto.created_at).toLocaleString('pt-BR')})`)
        produtosParaCorrigir.push(produto)
      }
      console.log()
    }
  }

  // Verificar slugs sem sufixo aleatório
  for (const produto of produtos) {
    if (!slugTemSufixo(produto.slug) && !produtosParaCorrigir.find(p => p.id === produto.id)) {
      console.log(`⚠️  Produto sem sufixo aleatório no slug:`)
      console.log(`   ${produto.nome} (ID: ${produto.id})`)
      console.log(`   Slug atual: ${produto.slug}`)
      produtosParaCorrigir.push(produto)
      console.log()
    }
  }

  if (produtosParaCorrigir.length === 0) {
    console.log('✅ Todos os slugs estão corretos!')
    return
  }

  console.log(`\n🔧 Corrigindo ${produtosParaCorrigir.length} produto(s)...\n`)

  for (const produto of produtosParaCorrigir) {
    const novoSlug = generateSlug(produto.nome)

    console.log(`🔧 ${produto.nome}`)
    console.log(`   Slug antigo: ${produto.slug}`)
    console.log(`   Slug novo: ${novoSlug}`)

    const { error: updateError } = await supabase
      .from('produtos')
      .update({ slug: novoSlug })
      .eq('id', produto.id)

    if (updateError) {
      console.error(`   ❌ Erro: ${updateError.message}`)
    } else {
      console.log(`   ✅ Corrigido!`)
      console.log(`   🔗 Nova URL: https://www.leoiphone.com.br/produto/${novoSlug}`)
    }
    console.log()
  }

  console.log('✅ Processo concluído!\n')
}

main().catch(console.error)
