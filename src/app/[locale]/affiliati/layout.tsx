import Link from 'next/link'
import { getDictionary, isLocale, localePath, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/i18n/language-switcher'

const pick = (locale: string): Locale => (isLocale(locale) ? locale : DEFAULT_LOCALE)

export default function AffiliateLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const locale = pick(params.locale)
  const t = getDictionary(locale).affiliates.layout

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href={localePath(locale, '/affiliati')} className="flex items-center gap-2.5">
            <span className="heat-dot h-7 w-7 rounded-lg" aria-hidden />
            <span className="font-display text-base font-extrabold tracking-tight">
              Foevo <span className="text-muted">{t.brandSuffix}</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher current={locale} />
            <Link href={localePath(locale, '/')} className="text-sm text-muted transition hover:text-ink">
              {t.backToSite}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  )
}
