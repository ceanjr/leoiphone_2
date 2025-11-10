import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { optimizeImage } from '../lib/utils/image-optimizer'

const supabaseUrl = 'https://aswejqbtejibrilrblnm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzd2VqcWJ0ZWppYnJpbHJibG5tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMjQ2MywiZXhwIjoyMDc2ODg4NDYzfQ.98uyNcAHMtDPgXeEt73Qo5dmUzetQQKgt3m9_T_r4oo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Fix image orientation for Supabase Storage images
 * Re-processes images respecting EXIF orientation metadata
 */
async function fixImageOrientation() {
  console.log('🔍 Finding products with Supabase Storage images...\n')

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

  console.log(`Found ${produtosSupabase.length} products with Supabase Storage images\n`)

  let successCount = 0
  let errorCount = 0

  for (const produto of produtosSupabase) {
    try {
      console.log(`\n📝 Processing: [${produto.codigo_produto || 'NO CODE'}] ${produto.nome}`)

      // Extract base filename from foto_principal
      // Format: .../produtos/produtos/1761842244071-xxe4yl-original.webp
      const match = produto.foto_principal?.match(/\/produtos\/produtos\/([\w-]+)-original\.webp$/)
      if (!match) {
        console.log(`   ⚠️  Could not extract filename from URL`)
        errorCount++
        continue
      }

      const baseFilename = match[1]
      console.log(`   Base filename: ${baseFilename}`)

      // Try to find original file (.blob or .jpeg)
      const possibleOriginals = [
        `produtos/${baseFilename}.blob`,
        `produtos/${baseFilename}.jpeg`,
        `produtos/${baseFilename}.jpg`,
        `produtos/${baseFilename}.png`,
      ]

      let originalBuffer: Buffer | null = null
      let originalPath: string | null = null

      for (const path of possibleOriginals) {
        try {
          const { data, error } = await supabase.storage
            .from('produtos')
            .download(path)

          if (!error && data) {
            originalBuffer = Buffer.from(await data.arrayBuffer())
            originalPath = path
            console.log(`   ✅ Found original: ${path}`)
            break
          }
        } catch (err) {
          // Continue trying next path
        }
      }

      if (!originalBuffer) {
        console.log(`   ⚠️  Could not find original file, skipping...`)
        errorCount++
        continue
      }

      // Reprocess image with correct orientation
      console.log(`   🔄 Reprocessing with correct orientation...`)
      const variants = await optimizeImage(originalBuffer, baseFilename)

      // Upload all variants
      console.log(`   📤 Uploading ${variants.length} variants...`)
      for (const variant of variants) {
        const uploadPath = `produtos/produtos/${variant.filename}`

        const { error: uploadError } = await supabase.storage
          .from('produtos')
          .upload(uploadPath, variant.buffer, {
            contentType: 'image/webp',
            upsert: true, // Overwrite existing file
          })

        if (uploadError) {
          console.log(`      ❌ Failed to upload ${variant.filename}: ${uploadError.message}`)
        } else {
          console.log(`      ✅ Uploaded ${variant.filename}`)
        }
      }

      console.log(`   ✅ Successfully reprocessed`)
      successCount++
    } catch (err) {
      console.error(`   ❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
      errorCount++
    }
  }

  console.log(`\n\n📊 Summary:`)
  console.log(`   ✅ Successfully reprocessed: ${successCount}`)
  console.log(`   ❌ Failed: ${errorCount}`)
  console.log(`   📝 Total products: ${produtosSupabase.length}`)
}

// Run the script
fixImageOrientation()
