/**
 * Configurazione i18n. L'italiano è la lingua di default e vive senza prefisso
 * nell'URL (`/supporto`); l'inglese sta sotto `/en` (`/en/supporto`).
 * Nell'app autenticata non c'è prefisso: la lingua è una preferenza utente.
 */

export const LOCALES = ['it', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'it'
export const LOCALE_COOKIE = 'foevo_locale'
/** Header impostato dal middleware, così server component e layout sanno la lingua. */
export const LOCALE_HEADER = 'x-foevo-locale'

export const LOCALE_LABEL: Record<Locale, string> = { it: 'Italiano', en: 'English' }

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v)
}

/** Prime sezioni di URL che hanno una versione tradotta (il resto non è prefissato). */
export const LOCALIZED_ROOTS = ['privacy', 'supporto', 'review', 'affiliati', 'checkout', 'a'] as const

/** true se il percorso appartiene al sito pubblico localizzato (prefisso ammesso). */
export function isLocalizedPath(pathname: string): boolean {
  if (pathname === '/') return true
  const first = pathname.split('/')[1] || ''
  return (LOCALIZED_ROOTS as readonly string[]).includes(first)
}

/**
 * Costruisce il percorso per una lingua: l'italiano resta senza prefisso,
 * l'inglese viene prefissato con /en. `path` è sempre il percorso "pulito".
 */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (locale === DEFAULT_LOCALE) return clean
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`
}

/** Rimuove un eventuale prefisso di lingua, restituendo lingua e percorso pulito. */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  const seg = pathname.split('/')[1]
  if (isLocale(seg)) {
    const rest = pathname.slice(seg.length + 1) || '/'
    return { locale: seg, path: rest.startsWith('/') ? rest : `/${rest}` }
  }
  return { locale: null, path: pathname }
}

/** Sceglie la lingua migliore leggendo l'header Accept-Language. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null
  const parts = header
    .split(',')
    .map((p) => {
      const [tag, q] = p.trim().split(';q=')
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)
  for (const p of parts) {
    const base = p.tag.split('-')[0]
    if (isLocale(base)) return base
  }
  return null
}
