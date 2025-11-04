import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIP } from '@/lib/utils/rate-limiter'
import { logger } from '@/lib/utils/logger'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  // Rate limiting: 100 requisições por minuto por IP
  const clientIP = getClientIP(request)
  const rateLimitResult = checkRateLimit(clientIP, { interval: 60000, maxRequests: 100 })
  
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
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    // Fazer fetch da imagem
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      )
    }

    // Obter o blob da imagem
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()

    // Retornar a imagem com headers corretos
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': blob.type || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    logger.error('Error proxying image:', error)
    return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 })
  }
}
