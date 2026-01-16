import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP } from '@/lib/utils/rate-limiter'
import { logger } from '@/lib/utils/logger'
import { UPLOAD_LIMITS } from '@/lib/config/constants'
import { v2 as cloudinary } from 'cloudinary'

// Configuração Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

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
    const produtoId = formData.get('produtoId') as string | null

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

    // Converter File para Buffer e depois para Base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    // Gerar public_id único
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const publicId = produtoId 
      ? `${produtoId}/${timestamp}-${randomStr}`
      : `uploads/${timestamp}-${randomStr}`

    logger.info(`[Cloudinary Upload] Iniciando upload: ${file.name}`)

    // Upload para Cloudinary com otimizações
    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder: 'leoiphone/produtos',
      public_id: publicId,
      overwrite: true,
      resource_type: 'image',
      // Transformações de otimização
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' }
      ],
    })

    logger.info(`[Cloudinary Upload] Upload concluído: ${uploadResult.public_id}`)

    // Retornar URL do Cloudinary
    // A URL base, sem transformações - aplicamos transformações dinamicamente
    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
    })
  } catch (error) {
    logger.error('Erro no upload Cloudinary:', error)
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    )
  }
}

// Endpoint para deletar imagem do Cloudinary
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

    // Obter public_id da imagem
    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('publicId')

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID não fornecido' }, { status: 400 })
    }

    logger.info(`[Cloudinary Delete] Deletando: ${publicId}`)

    // Deletar do Cloudinary
    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result === 'ok' || result.result === 'not found') {
      logger.info(`[Cloudinary Delete] Deletado: ${publicId}`)
      return NextResponse.json({ success: true })
    } else {
      throw new Error(`Falha ao deletar: ${result.result}`)
    }
  } catch (error) {
    logger.error('Erro ao deletar do Cloudinary:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar imagem' },
      { status: 500 }
    )
  }
}
