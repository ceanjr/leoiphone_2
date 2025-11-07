import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP } from '@/lib/utils/rate-limiter'
import { logger } from '@/lib/utils/logger'
import { UPLOAD_LIMITS } from '@/lib/config/constants'
import { optimizeImage, getBasePath } from '@/lib/utils/image-optimizer'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 20 uploads por minuto por IP
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(clientIP, { interval: 60000, maxRequests: 20 })
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Obter o arquivo do FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo foi enviado' }, { status: 400 })
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'O arquivo deve ser uma imagem' }, { status: 400 })
    }

    // Validar tamanho usando constante
    if (file.size > UPLOAD_LIMITS.maxFileSize) {
      return NextResponse.json({ error: 'A imagem deve ter no máximo 10MB' }, { status: 400 })
    }

    // Gerar nome único para o arquivo (sem extensão, será adicionada depois)
    const baseName = `${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Otimizar imagem gerando múltiplas variantes
    logger.info(`[Upload] Otimizando imagem: ${file.name}`)
    const variants = await optimizeImage(buffer, baseName)
    logger.info(`[Upload] Geradas ${variants.length} variantes`)

    // Fazer upload de todas as variantes
    const uploadPromises = variants.map(async (variant) => {
      const filePath = `produtos/${variant.filename}`

      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(filePath, variant.buffer, {
          contentType: 'image/webp',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Erro ao fazer upload de ${variant.size}: ${uploadError.message}`)
      }

      logger.debug(`[Upload] Variante ${variant.size}: ${filePath} (${variant.width}x${variant.height})`)
      return filePath
    })

    // Aguardar upload de todas as variantes
    const uploadedPaths = await Promise.all(uploadPromises)

    // Pegar a URL da variante original (será usada como base)
    const originalPath = uploadedPaths.find(path => path.includes('-original.webp'))
    if (!originalPath) {
      throw new Error('Erro ao encontrar imagem original após upload')
    }

    // Obter URL pública da imagem original
    const {
      data: { publicUrl },
    } = supabase.storage.from('produtos').getPublicUrl(originalPath)

    // Retornar URL base (sem sufixo -original) para que OptimizedImage possa escolher variantes
    const baseUrl = publicUrl.replace('-original.webp', '')

    logger.info(`[Upload] Upload concluído: ${uploadedPaths.length} variantes`)

    return NextResponse.json({
      url: `${baseUrl}.webp`, // URL base que será processada pelo OptimizedImage
      path: originalPath,
      variants: uploadedPaths,
    })
  } catch (error) {
    logger.error('Erro no upload:', error)
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    )
  }
}

// Endpoint para deletar imagem
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Obter caminho da imagem
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'Caminho da imagem não fornecido' }, { status: 400 })
    }

    // Obter nome base do arquivo (sem sufixo de tamanho)
    const basePath = getBasePath(path)
    const baseFileName = basePath.split('/').pop()

    // Listar todas as variantes da imagem
    const { data: files, error: listError } = await supabase.storage
      .from('produtos')
      .list('produtos', {
        search: baseFileName || undefined,
      })

    if (listError) {
      logger.error('Erro ao listar variantes:', listError)
      // Se falhar ao listar, tenta deletar apenas a imagem especificada
      const { error: deleteError } = await supabase.storage.from('produtos').remove([path])
      if (deleteError) {
        return NextResponse.json(
          { error: `Erro ao deletar: ${deleteError.message}` },
          { status: 500 }
        )
      }
      return NextResponse.json({ success: true, deleted: 1 })
    }

    // Filtrar apenas variantes da mesma imagem
    const variantPaths = files
      ?.filter(file => file.name.startsWith(baseFileName || ''))
      .map(file => `produtos/${file.name}`) || []

    // Se não encontrou variantes, usa o path original
    const pathsToDelete = variantPaths.length > 0 ? variantPaths : [path]

    // Deletar todas as variantes
    const { error: deleteError } = await supabase.storage
      .from('produtos')
      .remove(pathsToDelete)

    if (deleteError) {
      logger.error('Erro ao deletar variantes:', deleteError)
      return NextResponse.json(
        { error: `Erro ao deletar: ${deleteError.message}` },
        { status: 500 }
      )
    }

    logger.info(`[Delete] Removidas ${pathsToDelete.length} variantes da imagem`)

    return NextResponse.json({ success: true, deleted: pathsToDelete.length })
  } catch (error) {
    logger.error('Erro ao deletar:', error)
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    )
  }
}
