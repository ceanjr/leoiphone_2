import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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
    console.error('Error downloading image:', error)
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 }
    )
  }
}
