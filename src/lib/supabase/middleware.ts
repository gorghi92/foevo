import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookiesToSet = { name: string; value: string; options: CookieOptions }[]

// NB: '/a/' keeps the trailing slash so it matches public shared reports only,
// not '/admin' or '/analyses' (which must stay behind auth).
const PUBLIC_PREFIXES = ['/', '/login', '/signup', '/auth', '/api', '/extension', '/privacy', '/supporto', '/review', '/legal', '/a/', '/checkout']
const isPublic = (p: string) =>
  p === '/' || PUBLIC_PREFIXES.some((prefix) => prefix !== '/' && p.startsWith(prefix))

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // IMPORTANT: getUser() revalidates the token — do not trust getSession() for gating.
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (!user && !isPublic(path)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }
  if (user && (path === '/login' || path === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  return response
}
