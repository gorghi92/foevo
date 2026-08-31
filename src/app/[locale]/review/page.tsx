import type { Metadata } from 'next'
import { getDictionary, isLocale, localePath, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'
import { Rich } from '@/lib/i18n/rich'
import { LanguageSwitcher } from '@/components/i18n/language-switcher'

type Params = { params: { locale: string } }

const pick = (locale: string): Locale => (isLocale(locale) ? locale : DEFAULT_LOCALE)

const INBOX = 'https://www.mailinator.com/v4/public/inboxes.jsp?to=foevo-review'
const ACCOUNT = 'foevo-review@mailinator.com'

export function generateMetadata({ params }: Params): Metadata {
  return { ...getDictionary(pick(params.locale)).review.meta, robots: { index: false, follow: false } }
}

export default function ReviewPage({ params }: Params) {
  const locale = pick(params.locale)
  const t = getDictionary(locale).review
  // I riferimenti variabili (account, casella, privacy) stanno fuori dai dizionari.
  const fill = (s: string) =>
    s.replace('ACCOUNT', ACCOUNT).replace('INBOX_URL', INBOX).replace('PRIVACY_URL', localePath(locale, '/privacy'))

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">{t.kicker}</p>
        <LanguageSwitcher current={locale} />
      </div>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">{t.title}</h1>
      <p className="mt-3 text-muted">{t.intro}</p>

      <div className="card mt-6 p-5">
        <div className="text-sm">
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <span className="text-muted">{t.card.account}</span><b>{ACCOUNT}</b>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <span className="text-muted">{t.card.password}</span><span>{t.card.passwordValue}</span>
          </div>
          <div className="flex justify-between gap-4 py-2">
            <span className="text-muted">{t.card.inbox}</span>
            <a href={INBOX} target="_blank" rel="noreferrer" className="font-semibold text-brand">{t.card.inboxValue}</a>
          </div>
        </div>
      </div>

      <ol className="mt-8 space-y-5">
        {t.steps.map((s, i) => (
          <li key={s.t} className="flex gap-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
              {i + 1}
            </span>
            <div>
              <div className="font-semibold">{s.t}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted"><Rich text={fill(s.d)} /></p>
            </div>
          </li>
        ))}
      </ol>

      <div className="card mt-8 p-5 text-sm leading-relaxed text-muted">
        <Rich text={fill(t.permissions)} />
      </div>

      <p className="mt-8 text-xs text-muted">Foevo · foevo.app</p>
    </main>
  )
}
