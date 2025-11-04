#!/usr/bin/env node

/**
 * Script para adicionar garantia de 3 meses, capinha e película
 * em todos os iPhones seminovos
 *
 * Critérios:
 * - Produto contém "iPhone" no nome
 * - Condição = "seminovo"
 *
 * Atualizações:
 * - Garantia: 3_meses
 * - Acessórios.capinha: true
 * - Acessórios.pelicula: true
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

async function main() {
  console.log('🔍 Buscando iPhones seminovos...\n')

  // Buscar todos os iPhones seminovos ativos
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('*')
    .ilike('nome', '%iphone%')
    .eq('condicao', 'seminovo')
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Erro ao buscar produtos:', error)
    process.exit(1)
  }

  if (!produtos || produtos.length === 0) {
    console.log('✅ Nenhum iPhone seminovo encontrado.')
    return
  }

  console.log(`📦 Encontrados ${produtos.length} iPhone(s) seminovo(s):\n`)

  const produtosParaAtualizar = []

  for (const produto of produtos) {
    console.log(`\n📋 ${produto.nome} (ID: ${produto.id})`)

    const precisaAtualizar = []
    const updates = {}

    // Verificar garantia
    if (produto.garantia !== '3_meses') {
      precisaAtualizar.push(`Garantia: ${produto.garantia || 'nenhuma'} → 3_meses`)
      updates.garantia = '3_meses'
    } else {
      console.log('   ✅ Garantia: 3_meses')
    }

    // Verificar capinha
    const acessoriosAtuais = produto.acessorios || {}
    if (!acessoriosAtuais.capinha) {
      precisaAtualizar.push('Capinha: false → true')
      updates.acessorios = {
        ...acessoriosAtuais,
        capinha: true
      }
    } else {
      console.log('   ✅ Capinha: true')
    }

    // Verificar película
    if (!acessoriosAtuais.pelicula) {
      precisaAtualizar.push('Película: false → true')
      updates.acessorios = {
        ...(updates.acessorios || acessoriosAtuais),
        pelicula: true
      }
    } else {
      console.log('   ✅ Película: true')
    }

    // Se há atualizações necessárias
    if (precisaAtualizar.length > 0) {
      console.log('   ⚠️  Necessita atualização:')
      precisaAtualizar.forEach(msg => console.log(`      - ${msg}`))

      produtosParaAtualizar.push({
        id: produto.id,
        nome: produto.nome,
        updates
      })
    } else {
      console.log('   ✅ Produto já está correto')
    }
  }

  // Se não há produtos para atualizar
  if (produtosParaAtualizar.length === 0) {
    console.log('\n\n✅ Todos os iPhones seminovos já estão configurados corretamente!')
    return
  }

  // Mostrar resumo
  console.log(`\n\n📊 Resumo:`)
  console.log(`   Total de iPhones seminovos: ${produtos.length}`)
  console.log(`   Necessitam atualização: ${produtosParaAtualizar.length}`)
  console.log(`   Já estão corretos: ${produtos.length - produtosParaAtualizar.length}`)

  console.log('\n🔧 Aplicando atualizações...\n')

  let atualizadosComSucesso = 0
  let erros = 0

  for (const item of produtosParaAtualizar) {
    console.log(`🔧 Atualizando: ${item.nome}`)

    const { error: updateError } = await supabase
      .from('produtos')
      .update(item.updates)
      .eq('id', item.id)

    if (updateError) {
      console.error(`   ❌ Erro: ${updateError.message}`)
      erros++
    } else {
      console.log(`   ✅ Atualizado com sucesso!`)
      atualizadosComSucesso++
    }
  }

  // Resultado final
  console.log('\n\n' + '='.repeat(60))
  console.log('📊 RESULTADO FINAL')
  console.log('='.repeat(60))
  console.log(`✅ Atualizados com sucesso: ${atualizadosComSucesso}`)
  if (erros > 0) {
    console.log(`❌ Erros: ${erros}`)
  }
  console.log('='.repeat(60))

  console.log('\n💡 Dica: Acesse o painel admin para verificar os produtos:')
  console.log('   https://www.leoiphone.com.br/admin/produtos\n')
}

main().catch(console.error)
