'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LOCALES, LOCALE_COOKIE, isLocalizedPath, localePath, splitLocale, type Locale } from '@/lib/i18n/config'

/**
 * Cambio lingua. Sul sito pubblico naviga alla stessa pagina nell'altra lingua
 * (`/supporto` ↔ `/en/supporto`); nell'app autenticata, che non ha prefisso,
 * salva la preferenza in un cookie e ricarica.
 * In entrambi i casi il cookie viene scritto: la scelta resta anche dopo il login.
 */
export function LanguageSwitcher({ current, className = '' }: { current: Locale; className?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { path } = splitLocale(pathname)

  const choose = (locale: Locale) => {
    if (locale === current) return
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`
    if (isLocalizedPath(path)) router.push(localePath(locale, path))
    else router.refresh()
  }

  return (
    <div className={`inline-flex items-center rounded-lg border border-line p-0.5 ${className}`} role="group" aria-label="Lingua / Language">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-current={l === current ? 'true' : undefined}
          className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase transition ${
            l === current ? 'bg-brand text-brand-fg' : 'text-muted hover:text-ink'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
