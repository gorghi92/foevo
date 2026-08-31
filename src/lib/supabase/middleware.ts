import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { LOCALE_HEADER, splitLocale, type Locale } from '@/lib/i18n/config'

type CookiesToSet = { name: string; value: string; options: CookieOptions }[]

// NB: '/a/' keeps the trailing slash so it matches public shared reports only,
// not '/admin' or '/analyses' (which must stay behind auth).
const PUBLIC_PREFIXES = ['/', '/login', '/signup', '/auth', '/api', '/extension', '/privacy', '/supporto', '/review', '/legal', '/a/', '/checkout', '/affiliati', '/r/']
const isPublic = (p: string) =>
  p === '/' || PUBLIC_PREFIXES.some((prefix) => prefix !== '/' && p.startsWith(prefix))

export type SessionOptions = {
  /** Lingua risolta dal middleware, passata ai server component via header. */
  locale: Locale
  /** Se valorizzato, la risposta riscrive verso questo URL (usato per il prefisso lingua). */
  rewriteTo?: URL
}

export async function updateSession(request: NextRequest, opts: SessionOptions) {
  // La risposta va ricostruita ogni volta che Supabase aggiorna i cookie:
  // qui teniamo insieme rewrite di lingua e header, così non si perdono.
  const build = () => {
    const headers = new Headers(request.headers)
    headers.set(LOCALE_HEADER, opts.locale)
    return opts.rewriteTo
      ? NextResponse.rewrite(opts.rewriteTo, { request: { headers } })
      : NextResponse.next({ request: { headers } })
  }

  let response = build()

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
          response = build()
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // IMPORTANT: getUser() revalidates the token — do not trust getSession() for gating.
  const { data: { user } } = await supabase.auth.getUser()

  // Il gate va valutato sul percorso SENZA prefisso di lingua, altrimenti
  // /en/privacy verrebbe scambiata per una rotta privata.
  const rawPath = request.nextUrl.pathname
  const { path } = splitLocale(rawPath)

  if (!user && !isPublic(path)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', rawPath)
    return NextResponse.redirect(url)
  }
  if (user && (path === '/login' || path === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  return response
}
