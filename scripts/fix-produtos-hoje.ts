#!/usr/bin/env node

/**
 * Script para verificar e corrigir produtos criados hoje
 *
 * Verifica:
 * - Produtos sem slug
 * - Produtos com ativo = false
 * - Produtos com deleted_at preenchido
 *
 * E corrige automaticamente
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  console.error('Necessário: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SlugGenerator {
  (nome: string): string
}

interface Correcoes {
  slug?: string
  ativo?: boolean
  deleted_at?: null
}

interface ProdutoProblema {
  id: string
  nome: string
  problemas: string[]
  correcoes: Correcoes
}

function generateSlug(nome: string): string {
  const baseSlug: string = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  // Adicionar sufixo aleatório para garantir unicidade
  const randomSuffix: string = Math.random().toString(36).substring(2, 8)
  return `${baseSlug}-${randomSuffix}`
}

async function main() {
  console.log('🔍 Buscando produtos criados hoje...\n')

  // Buscar produtos criados hoje (últimas 24 horas)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dataInicio = hoje.toISOString()

  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('*')
    .gte('created_at', dataInicio)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Erro ao buscar produtos:', error)
    process.exit(1)
  }

  if (!produtos || produtos.length === 0) {
    console.log('✅ Nenhum produto criado hoje.')
    return
  }

  console.log(`📦 Encontrados ${produtos.length} produto(s) criado(s) hoje:\n`)

  const problemasEncontrados: ProdutoProblema[] = []

  for (const produto of produtos) {
    console.log(`\n📋 Produto: ${produto.nome} (ID: ${produto.id})`)
    console.log(`   Criado em: ${new Date(produto.created_at).toLocaleString('pt-BR')}`)

    const problemas: string[] = []
    const correcoes = {} as Correcoes

    // Verificar slug
    if (!produto.slug || produto.slug === '') {
      problemas.push('❌ Sem slug')
      correcoes.slug = generateSlug(produto.nome)
      console.log(`   ${problemas[problemas.length - 1]} → Será corrigido para: ${correcoes.slug}`)
    } else {
      console.log(`   ✅ Slug: ${produto.slug}`)
    }

    // Verificar ativo
    if (produto.ativo === false || produto.ativo === null) {
      problemas.push('❌ Não está ativo')
      correcoes.ativo = true
      console.log(`   ${problemas[problemas.length - 1]} → Será ativado`)
    } else {
      console.log(`   ✅ Ativo: true`)
    }

    // Verificar deleted_at
    if (produto.deleted_at !== null) {
      problemas.push('❌ Marcado como deletado')
      correcoes.deleted_at = null
      console.log(`   ${problemas[problemas.length - 1]} → Será restaurado`)
    } else {
      console.log(`   ✅ Deleted_at: null`)
    }

    // Se há problemas, adicionar à lista de correções
    if (problemas.length > 0) {
      problemasEncontrados.push({
        id: produto.id,
        nome: produto.nome,
        problemas,
        correcoes
      })
    }
  }

  // Se não há problemas, finalizar
  if (problemasEncontrados.length === 0) {
    console.log('\n\n✅ Todos os produtos estão corretos!')
    return
  }

  // Mostrar resumo e perguntar se deve corrigir
  console.log(`\n\n⚠️  Encontrados ${problemasEncontrados.length} produto(s) com problemas.\n`)
  console.log('🔧 Aplicando correções automaticamente...\n')

  // Corrigir cada produto
  for (const item of problemasEncontrados) {
    console.log(`🔧 Corrigindo: ${item.nome}`)

    const { error: updateError } = await supabase
      .from('produtos')
      .update(item.correcoes)
      .eq('id', item.id)

    if (updateError) {
      console.error(`   ❌ Erro ao corrigir: ${updateError.message}`)
    } else {
      console.log(`   ✅ Corrigido com sucesso!`)

      // Mostrar URL do produto
      const slug = item.correcoes.slug ||
        (await supabase.from('produtos').select('slug').eq('id', item.id).single()).data?.slug

      if (slug) {
        console.log(`   🔗 URL: https://www.leoiphone.com.br/produto/${slug}`)
      }
    }
  }

  console.log('\n\n✅ Processo concluído!')
  console.log('\n💡 Dica: Acesse o painel admin para verificar os produtos:')
  console.log('   https://www.leoiphone.com.br/admin/produtos\n')
}

main().catch(console.error)
