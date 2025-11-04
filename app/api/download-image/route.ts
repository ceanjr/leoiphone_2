import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIP } from '@/lib/utils/rate-limiter'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  // Rate limiting: 50 downloads por minuto por IP
  const clientIP = getClientIP(request)
  const rateLimitResult = checkRateLimit(clientIP, { interval: 60000, maxRequests: 50 })
  
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

  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const blob = await response.blob()
    const headers = new Headers()
    
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg')
    headers.set('Content-Disposition', 'attachment')
    headers.set('Cache-Control', 'public, max-age=31536000')

    return new NextResponse(blob, {
      status: 200,
      headers,
    })
  } catch (error) {
    logger.error('Error downloading image:', error)
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 }
    )
  }
}
