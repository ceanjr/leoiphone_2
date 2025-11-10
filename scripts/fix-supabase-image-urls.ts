import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aswejqbtejibrilrblnm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzd2VqcWJ0ZWppYnJpbHJibG5tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMjQ2MywiZXhwIjoyMDc2ODg4NDYzfQ.98uyNcAHMtDPgXeEt73Qo5dmUzetQQKgt3m9_T_r4oo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Fix Supabase Storage URLs to use correct path and variant
 * Changes:
 * 1. Remove duplicate /produtos/produtos/ → /produtos/
 * 2. Add -original.webp suffix if file doesn't have variant suffix
 */
async function fixSupabaseUrls() {
  console.log('🔍 Finding products with Supabase Storage URLs...\n')

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

  // Filter products with Supabase Storage URLs
  const produtosSupabase = produtos.filter(p =>
    p.foto_principal?.includes('supabase.co/storage')
  )

  if (produtosSupabase.length === 0) {
    console.log('✅ No products with Supabase Storage URLs found!')
    return
  }

  console.log(`Found ${produtosSupabase.length} products with Supabase Storage URLs\n`)

  let successCount = 0
  let errorCount = 0

  for (const produto of produtosSupabase) {
    try {
      console.log(`\n📝 Fixing: [${produto.codigo_produto || 'NO CODE'}] ${produto.nome}`)
      console.log(`   Old: ${produto.foto_principal}`)

      // Fix foto_principal
      let newFotoPrincipal = produto.foto_principal

      // Step 1: Remove duplicate path if exists
      if (newFotoPrincipal?.includes('/produtos/produtos/')) {
        newFotoPrincipal = newFotoPrincipal.replace('/produtos/produtos/', '/produtos/')
      }

      // Step 2: Add -original.webp if the URL doesn't have a variant suffix
      // Pattern: .../filename.webp (no variant like -original, -large, etc)
      if (newFotoPrincipal?.match(/\/[\w-]+\.webp$/)) {
        // Check if it already has a variant suffix
        if (!newFotoPrincipal.match(/-(original|large|medium|small|thumb)\.webp$/)) {
          newFotoPrincipal = newFotoPrincipal.replace('.webp', '-original.webp')
        }
      }

      // Fix fotos array
      const newFotos = produto.fotos?.map((url: string) => {
        let fixedUrl = url

        // Remove duplicate path
        if (fixedUrl.includes('/produtos/produtos/')) {
          fixedUrl = fixedUrl.replace('/produtos/produtos/', '/produtos/')
        }

        // Add -original.webp if needed
        if (fixedUrl.match(/\/[\w-]+\.webp$/) && !fixedUrl.match(/-(original|large|medium|small|thumb)\.webp$/)) {
          fixedUrl = fixedUrl.replace('.webp', '-original.webp')
        }

        return fixedUrl
      })

      console.log(`   New: ${newFotoPrincipal}`)

      // Test the URL before updating
      const testResponse = await fetch(newFotoPrincipal!, { method: 'HEAD' })
      if (!testResponse.ok) {
        console.log(`   ⚠️  URL test failed: ${testResponse.status} ${testResponse.statusText}`)
        console.log(`   Skipping update...`)
        errorCount++
        continue
      }

      console.log(`   ✅ URL test passed (${testResponse.status})`)

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
  console.log(`   ❌ Failed/Skipped: ${errorCount}`)
  console.log(`   📝 Total processed: ${produtosSupabase.length}`)
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

  const supabaseUrls = produtos.filter(p =>
    p.foto_principal?.includes('supabase.co/storage')
  )

  console.log(`Total products with Supabase URLs: ${supabaseUrls.length}`)

  // Test a few URLs
  console.log('\n🧪 Testing fixed URLs...')
  for (const produto of supabaseUrls.slice(0, 10)) {
    try {
      const response = await fetch(produto.foto_principal!, { method: 'HEAD' })
      const status = response.ok ? '✅' : '❌'
      console.log(`${status} [${produto.codigo_produto}] ${response.status} ${response.statusText}`)
    } catch (err) {
      console.log(`❌ [${produto.codigo_produto}] Error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  }
}

// Run the script
async function main() {
  await fixSupabaseUrls()
  await verifyFix()
}

main()
