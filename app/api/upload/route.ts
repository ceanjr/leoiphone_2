import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP } from '@/lib/utils/rate-limiter'
import { logger } from '@/lib/utils/logger'
import { UPLOAD_LIMITS } from '@/lib/config/constants'

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

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `produtos/${fileName}`

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Fazer upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('produtos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      logger.error('Erro no upload:', uploadError)
      return NextResponse.json(
        { error: `Erro ao fazer upload: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Obter URL pública da imagem
    const {
      data: { publicUrl },
    } = supabase.storage.from('produtos').getPublicUrl(filePath)

    return NextResponse.json({
      url: publicUrl,
      path: uploadData.path,
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

    // Deletar do storage
    const { error: deleteError } = await supabase.storage.from('produtos').remove([path])

    if (deleteError) {
      logger.error('Erro ao deletar:', deleteError)
      return NextResponse.json(
        { error: `Erro ao deletar: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erro ao deletar:', error)
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    )
  }
}
