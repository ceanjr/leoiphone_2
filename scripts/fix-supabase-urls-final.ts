import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.error('Execute: source .env.local && SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY npx tsx <script>')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Fix Supabase Storage URLs to use correct variant
 * The correct path is: /storage/v1/object/public/produtos/produtos/FILENAME-original.webp
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

  // Filter products with Supabase Storage URLs that need fixing
  const produtosSupabase = produtos.filter(p =>
    p.foto_principal?.includes('supabase.co/storage') &&
    !p.foto_principal?.includes('-original.webp') &&
    !p.foto_principal?.includes('-large.webp') &&
    !p.foto_principal?.includes('-medium.webp')
  )

  if (produtosSupabase.length === 0) {
    console.log('✅ All Supabase Storage URLs are already correct!')
    return
  }

  console.log(`Found ${produtosSupabase.length} products with URLs that need fixing\n`)

  let successCount = 0
  let errorCount = 0

  for (const produto of produtosSupabase) {
    try {
      console.log(`\n📝 Fixing: [${produto.codigo_produto || 'NO CODE'}] ${produto.nome}`)
      console.log(`   Old: ${produto.foto_principal}`)

      // Fix foto_principal - ensure it has /produtos/produtos/ and -original.webp
      let newFotoPrincipal = produto.foto_principal

      // If URL has /produtos/ but not /produtos/produtos/, add it
      if (newFotoPrincipal?.includes('/public/produtos/') && !newFotoPrincipal.includes('/public/produtos/produtos/')) {
        newFotoPrincipal = newFotoPrincipal.replace('/public/produtos/', '/public/produtos/produtos/')
      }

      // Add -original.webp if it doesn't have a variant suffix
      if (newFotoPrincipal?.match(/\/[\w-]+\.webp$/) && !newFotoPrincipal.match(/-(original|large|medium|small|thumb)\.webp$/)) {
        newFotoPrincipal = newFotoPrincipal.replace('.webp', '-original.webp')
      }

      // Fix fotos array
      const newFotos = produto.fotos?.map((url: string) => {
        let fixedUrl = url

        // Add /produtos/ if missing
        if (fixedUrl.includes('/public/produtos/') && !fixedUrl.includes('/public/produtos/produtos/')) {
          fixedUrl = fixedUrl.replace('/public/produtos/', '/public/produtos/produtos/')
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

  // Check for URLs without variants
  const withoutVariants = supabaseUrls.filter(p =>
    !p.foto_principal?.includes('-original.webp') &&
    !p.foto_principal?.includes('-large.webp') &&
    !p.foto_principal?.includes('-medium.webp')
  )

  if (withoutVariants.length === 0) {
    console.log('✅ All URLs have variant suffixes!')
  } else {
    console.log(`⚠️  ${withoutVariants.length} URLs still without variant suffix`)
  }

  // Test all Supabase URLs
  console.log('\n🧪 Testing all Supabase URLs...')
  let okCount = 0
  let failCount = 0

  for (const produto of supabaseUrls) {
    try {
      const response = await fetch(produto.foto_principal!, { method: 'HEAD' })
      if (response.ok) {
        okCount++
      } else {
        failCount++
        console.log(`❌ [${produto.codigo_produto}] ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      failCount++
      console.log(`❌ [${produto.codigo_produto}] Error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  }

  console.log(`\n📊 Test Results:`)
  console.log(`   ✅ OK: ${okCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
}

// Run the script
async function main() {
  await fixSupabaseUrls()
  await verifyFix()
}

main()
