import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import {
  DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, isLocalizedPath, localeFromAcceptLanguage, splitLocale, type Locale,
} from '@/lib/i18n/config'

/**
 * Gestisce lingua e sessione.
 *
 * Sito pubblico: l'italiano vive senza prefisso (`/supporto`), l'inglese sotto
 * `/en` (`/en/supporto`). L'URL è la fonte di verità — nessun redirect
 * automatico per lingua, così i link restano stabili e la SEO pulita.
 * App autenticata: nessun prefisso, la lingua arriva dal cookie o dal browser.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { locale: urlLocale, path } = splitLocale(pathname)

  // `/it/...` non è canonico: l'italiano sta senza prefisso.
  if (urlLocale === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone()
    url.pathname = path
    return NextResponse.redirect(url)
  }

  let locale: Locale
  let rewriteTo: URL | undefined

  if (urlLocale) {
    // URL già prefissato (/en/...): la lingua è quella e la rotta esiste così com'è.
    locale = urlLocale
  } else if (isLocalizedPath(pathname)) {
    // Pagina pubblica senza prefisso → è l'italiano: riscrivi verso /it/...
    locale = DEFAULT_LOCALE
    rewriteTo = new URL(`/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}${request.nextUrl.search}`, request.url)
  } else {
    // App autenticata, auth, api: lingua da preferenza utente.
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value
    locale = isLocale(cookieLocale)
      ? cookieLocale
      : localeFromAcceptLanguage(request.headers.get('accept-language')) ?? DEFAULT_LOCALE
  }

  return await updateSession(request, { locale, rewriteTo })
}

export const config = {
  matcher: [
    // run on everything except static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|zip)$).*)',
  ],
}
