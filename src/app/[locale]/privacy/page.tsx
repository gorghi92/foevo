import type { Metadata } from 'next'
import { getDictionary, isLocale, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'
import { Rich } from '@/lib/i18n/rich'

type Params = { params: { locale: string } }

const pick = (locale: string): Locale => (isLocale(locale) ? locale : DEFAULT_LOCALE)

export function generateMetadata({ params }: Params): Metadata {
  return getDictionary(pick(params.locale)).privacy.meta
}

export default function PrivacyPage({ params }: Params) {
  const t = getDictionary(pick(params.locale)).privacy

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-extrabold">{t.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.updated}</p>

      <p className="mt-6"><Rich text={t.intro} /></p>

      <Section h={t.access.h} items={t.access.items} />
      <Section h={t.device.h} p={t.device.p} />
      <Section h={t.where.h} items={t.where.items} />
      <Section h={t.never.h} items={t.never.items} />
      <Section h={t.contact.h} p={t.contact.p} />
    </main>
  )
}

function Section({ h, p, items }: { h: string; p?: string; items?: readonly string[] }) {
  return (
    <>
      <h2 className="mt-8 text-xl font-bold">{h}</h2>
      {p && <p className="mt-2 text-muted"><Rich text={p} /></p>}
      {items && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          {items.map((li) => <li key={li}><Rich text={li} /></li>)}
        </ul>
      )}
    </>
  )
}
