import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aswejqbtejibrilrblnm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzd2VqcWJ0ZWppYnJpbHJibG5tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMjQ2MywiZXhwIjoyMDc2ODg4NDYzfQ.98uyNcAHMtDPgXeEt73Qo5dmUzetQQKgt3m9_T_r4oo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Fix duplicate paths in Supabase Storage URLs
 * Replaces /produtos/produtos/ with /produtos/
 */
async function fixDuplicatePaths() {
  console.log('🔍 Finding products with duplicate image paths...\n')

  // Get all products with Supabase Storage URLs
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, nome, codigo_produto, foto_principal, fotos')
    .eq('ativo', true)
    .is('deleted_at', null)

  if (error) {
    console.error('❌ Error fetching products:', error)
    return
  }

  if (!produtos) {
    console.log('No products found')
    return
  }

  // Filter products with duplicate path
  const produtosComProblema = produtos.filter(p =>
    p.foto_principal?.includes('/produtos/produtos/')
  )

  if (produtosComProblema.length === 0) {
    console.log('✅ No products with duplicate paths found!')
    return
  }

  console.log(`Found ${produtosComProblema.length} products with duplicate paths\n`)

  // Fix each product
  let successCount = 0
  let errorCount = 0

  for (const produto of produtosComProblema) {
    try {
      console.log(`\n📝 Fixing: [${produto.codigo_produto || 'NO CODE'}] ${produto.nome}`)

      // Fix foto_principal
      const newFotoPrincipal = produto.foto_principal?.replace(
        '/produtos/produtos/',
        '/produtos/'
      )

      // Fix fotos array
      const newFotos = produto.fotos?.map((url: string) =>
        url.replace('/produtos/produtos/', '/produtos/')
      )

      console.log(`   Old: ${produto.foto_principal}`)
      console.log(`   New: ${newFotoPrincipal}`)

      // Update in database
      const { error: updateError } = await supabase
        .from('produtos')
        .update({
          foto_principal: newFotoPrincipal,
          fotos: newFotos,
        })
        .eq('id', produto.id)

      if (updateError) {
        console.error(`   ❌ Error updating: ${updateError.message}`)
        errorCount++
      } else {
        console.log(`   ✅ Updated successfully`)
        successCount++
      }
    } catch (err) {
      console.error(`   ❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
      errorCount++
    }
  }

  console.log(`\n\n📊 Summary:`)
  console.log(`   ✅ Successfully updated: ${successCount}`)
  console.log(`   ❌ Failed: ${errorCount}`)
  console.log(`   📝 Total processed: ${produtosComProblema.length}`)
}

// Verify the fix
async function verifyFix() {
  console.log('\n\n🔍 Verifying fixes...\n')

  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, nome, codigo_produto, foto_principal')
    .eq('ativo', true)
    .is('deleted_at', null)

  if (!produtos) return

  const stillBroken = produtos.filter(p =>
    p.foto_principal?.includes('/produtos/produtos/')
  )

  if (stillBroken.length === 0) {
    console.log('✅ All URLs have been fixed!')
  } else {
    console.log(`❌ Still ${stillBroken.length} products with duplicate paths`)
  }

  // Test a few URLs
  const supabaseUrls = produtos.filter(p =>
    p.foto_principal?.includes('supabase.co/storage')
  ).slice(0, 5)

  if (supabaseUrls.length > 0) {
    console.log('\n🧪 Testing fixed URLs...')
    for (const produto of supabaseUrls) {
      try {
        const response = await fetch(produto.foto_principal!, { method: 'HEAD' })
        const status = response.ok ? '✅' : '❌'
        console.log(`${status} [${produto.codigo_produto}] ${response.status} ${response.statusText}`)
      } catch (err) {
        console.log(`❌ [${produto.codigo_produto}] Error: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }
  }
}

// Run the script
async function main() {
  await fixDuplicatePaths()
  await verifyFix()
}

main()
