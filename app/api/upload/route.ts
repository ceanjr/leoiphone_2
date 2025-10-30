import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
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

    // Validar tamanho (10MB) - aumentado para aceitar imagens de alta qualidade
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
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
      console.error('Erro no upload:', uploadError)
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
    console.error('Erro no upload:', error)
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
      console.error('Erro ao deletar:', deleteError)
      return NextResponse.json(
        { error: `Erro ao deletar: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar:', error)
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    )
  }
}
