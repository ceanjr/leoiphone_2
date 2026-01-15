import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { logger } from '@/lib/utils/logger'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verificação rápida: checar se há token de acesso nos cookies
  const accessToken = request.cookies.get('sb-aswejqbtejibrilrblnm-auth-token')

  // Proteção de rotas admin - verificar token primeiro
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!accessToken) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Tentar validar o usuário com timeout
    try {
      const authPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout')), 3000)
      )
      const { data, error } = (await Promise.race([
        authPromise,
        timeoutPromise,
      ])) as Awaited<ReturnType<typeof supabase.auth.getUser>>

      // Se houver erro de refresh token inválido, limpar cookies e redirecionar
      if (error && (error.message?.includes('Refresh Token') || error.code === 'refresh_token_not_found')) {
        logger.warn('Invalid refresh token, clearing session')
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        const response = NextResponse.redirect(url)
        // Limpar todos os cookies de auth do Supabase
        request.cookies.getAll().forEach((cookie) => {
          if (cookie.name.startsWith('sb-')) {
            response.cookies.delete(cookie.name)
          }
        })
        return response
      }

      const user = data.user

      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // Timeout - permitir acesso se há token (melhor UX)
      logger.warn('Auth check timeout, allowing access with token', error)
    }
  }

  // Redirecionar usuário logado da página de login para o admin
  if (request.nextUrl.pathname === '/login' && accessToken) {
    try {
      const { data, error } = await supabase.auth.getUser()
      // Só redirecionar se o token for válido
      if (!error && data.user) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/dashboard'
        return NextResponse.redirect(url)
      }
      // Se token inválido, limpar cookies e permitir ficar no login
      if (error) {
        request.cookies.getAll().forEach((cookie) => {
          if (cookie.name.startsWith('sb-')) {
            supabaseResponse.cookies.delete(cookie.name)
          }
        })
      }
    } catch {
      // Erro de timeout - não redirecionar, permitir login
    }
  }

  return supabaseResponse
}
