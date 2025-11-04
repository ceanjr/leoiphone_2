import { NextRequest, NextResponse } from 'next/server'
import { getProdutosRelacionados } from '@/app/admin/categorias/produtos-relacionados-actions'
import { checkRateLimit, getClientIP } from '@/lib/utils/rate-limiter'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 60 requisições por minuto por IP
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(clientIP, { interval: 60000, maxRequests: 60 })
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

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

    return NextResponse.json(
      { produtos: data || [] },
      {
        headers: {
          // Cache por 1 hora para garantir consistência entre reloads
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    )
  } catch (error) {
    logger.error('Erro na API de produtos relacionados:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produtos relacionados' },
      { status: 500 }
    )
  }
}
