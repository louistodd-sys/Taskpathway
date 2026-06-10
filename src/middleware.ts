import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/verify-email']
const ACCEPT_INVITE_PREFIX = '/accept-invite'
const ONBOARDING_ROUTE = '/onboarding'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_ROUTES.some(r => pathname === r) || pathname.startsWith(ACCEPT_INVITE_PREFIX)
  const isOnboarding = pathname === ONBOARDING_ROUTE
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/verify-email'
  const isAppRoute = !isPublic && !isOnboarding

  if (!user && !isPublic && !isOnboarding) {
    const url = request.nextUrl.clone(); url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!user && isOnboarding) {
    const url = request.nextUrl.clone(); url.pathname = '/register'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone(); url.pathname = '/library'
    return NextResponse.redirect(url)
  }

  if (user && isAppRoute) {
    const { data: mem } = await supabase.from('memberships').select('id').eq('user_id', user.id).eq('active', true).maybeSingle()
    if (!mem) {
      const url = request.nextUrl.clone(); url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|og-image.png).*)'],
}
