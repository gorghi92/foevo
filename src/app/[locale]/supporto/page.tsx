import type { Metadata } from 'next'
import Link from 'next/link'
import { SupportForm } from './support-form'
import { issueFormToken } from '@/lib/form-token'
import { CHROME_STORE_URL } from '@/lib/links'
import { getDictionary, isLocale, localePath, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'
import { Rich } from '@/lib/i18n/rich'
import { LanguageSwitcher } from '@/components/i18n/language-switcher'

// Il token è legato al momento del render, quindi la pagina non va messa in cache.
export const dynamic = 'force-dynamic'

type Params = { params: { locale: string } }

const pick = (locale: string): Locale => (isLocale(locale) ? locale : DEFAULT_LOCALE)

export function generateMetadata({ params }: Params): Metadata {
  return getDictionary(pick(params.locale)).support.meta
}

export default function SupportPage({ params }: Params) {
  const locale = pick(params.locale)
  const t = getDictionary(locale).support
  const privacyHref = localePath(locale, '/privacy')
  const fill = (s: string) => s.replace('STORE_URL', CHROME_STORE_URL).replace('PRIVACY_URL', privacyHref)

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <Link href={localePath(locale, '/')} className="text-sm font-semibold text-muted transition hover:text-ink">
          {t.backHome}
        </Link>
        <LanguageSwitcher current={locale} />
      </div>

      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-muted">{t.sub}</p>

      <h2 className="mt-10 font-display text-xl font-extrabold">{t.faqTitle}</h2>
      <div className="mt-4 space-y-3">
        {t.faq.map((f) => (
          <details key={f.q} className="card p-4">
            <summary className="cursor-pointer font-semibold">{f.q}</summary>
            <div className="mt-2 text-sm leading-relaxed text-muted"><Rich text={fill(f.a)} /></div>
          </details>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-extrabold">{t.formTitle}</h2>
      <p className="mt-2 text-sm text-muted">{t.formSub}</p>
      <SupportForm token={issueFormToken(Date.now())} t={t.form} privacyHref={privacyHref} />

      <p className="mt-10 text-xs text-muted">
        Foevo · <Link href={privacyHref} className="font-semibold text-brand">{t.footerPrivacy}</Link>
      </p>
    </main>
  )
}
