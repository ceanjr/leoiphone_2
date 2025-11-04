import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client_id, client_secret, grant_type = 'client_credentials' } = body

    if (!client_id || !client_secret) {
      return NextResponse.json(
        { error: 'client_id e client_secret são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('[OLX-TOKEN-API] Requisitando token...', {
      client_id: client_id.substring(0, 10) + '...',
      grant_type,
    })

    // Limpar espaços em branco das credenciais
    const cleanClientId = client_id.trim()
    const cleanClientSecret = client_secret.trim()

    // Tentar com diferentes formatos de requisição
    const attempts = [
      {
        name: 'application/x-www-form-urlencoded',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type,
          client_id: cleanClientId,
          client_secret: cleanClientSecret,
          scope: 'autoupload',
        }).toString(),
      },
      {
        name: 'application/x-www-form-urlencoded (sem scope)',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type,
          client_id: cleanClientId,
          client_secret: cleanClientSecret,
        }).toString(),
      },
    ]

    let lastError: any = null

    for (const attempt of attempts) {
      console.log(`[OLX-TOKEN-API] Tentando com: ${attempt.name}`)

      try {
        const tokenResponse = await fetch('https://auth.olx.com.br/oauth/token', {
          method: 'POST',
          headers: attempt.headers,
          body: attempt.body,
        })

        const tokenData = await tokenResponse.json()

        console.log('[OLX-TOKEN-API] Resposta da OLX:', {
          attempt: attempt.name,
          status: tokenResponse.status,
          ok: tokenResponse.ok,
          hasToken: !!tokenData.access_token,
          error: tokenData.error,
        })

        if (tokenResponse.ok && tokenData.access_token) {
          // Sucesso!
          console.log('[OLX-TOKEN-API] ✅ Token obtido com sucesso!')
          return NextResponse.json({
            success: true,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type,
          })
        }

        // Guardar erro para tentar próximo método
        lastError = tokenData
      } catch (err: any) {
        console.error(`[OLX-TOKEN-API] Erro na tentativa ${attempt.name}:`, err.message)
        lastError = { error: err.message }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    console.error('[OLX-TOKEN-API] ❌ Todas as tentativas falharam')
    
    return NextResponse.json(
      {
        success: false,
        error: lastError?.error_description || lastError?.error || 'Todas as tentativas falharam',
        details: lastError,
        suggestions: [
          'Verifique se suas credenciais estão corretas',
          'Confirme se o Client ID está ativo no portal OLX',
          'Entre em contato com suporteintegrador@olxbr.com',
        ],
      },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[OLX-TOKEN-API] Erro fatal:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno ao gerar token',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
