import { NextRequest, NextResponse } from 'next/server'
import { getProdutosRelacionados } from '@/app/admin/categorias/produtos-relacionados-actions'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const produtoId = searchParams.get('produtoId')
    const categoriaId = searchParams.get('categoriaId')

    if (!produtoId || !categoriaId) {
      return NextResponse.json(
        { error: 'produtoId e categoriaId são obrigatórios' },
        { status: 400 }
      )
    }

    const { data, error } = await getProdutosRelacionados(produtoId, categoriaId, 3)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ produtos: data || [] })
  } catch (error) {
    console.error('Erro na API de produtos relacionados:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produtos relacionados' },
      { status: 500 }
    )
  }
}
