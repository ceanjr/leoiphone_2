import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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
      const {
        data: { user },
      } = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 3000)
        ),
      ]) as any

      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // Em caso de timeout ou erro, permitir acesso se houver token
      console.warn('Auth check timeout, allowing access with token')
    }
  }

  // Redirecionar usuário logado da página de login para o admin
  if (request.nextUrl.pathname === '/login' && accessToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
