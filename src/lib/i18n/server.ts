import { cookies, headers } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER, isLocale, localeFromAcceptLanguage, type Locale } from './config'

/**
 * Lingua da usare nei server component fuori dal sito pubblico (app autenticata,
 * email, API): header impostato dal middleware → cookie → Accept-Language → default.
 * Sul sito pubblico la lingua arriva invece dal segmento [locale] dell'URL.
 */
export function getServerLocale(): Locale {
  try {
    const h = headers()
    const fromHeader = h.get(LOCALE_HEADER)
    if (isLocale(fromHeader)) return fromHeader

    const fromCookie = cookies().get(LOCALE_COOKIE)?.value
    if (isLocale(fromCookie)) return fromCookie

    const fromAccept = localeFromAcceptLanguage(h.get('accept-language'))
    if (fromAccept) return fromAccept
  } catch {
    // fuori da un contesto di richiesta: resta il default
  }
  return DEFAULT_LOCALE
}
