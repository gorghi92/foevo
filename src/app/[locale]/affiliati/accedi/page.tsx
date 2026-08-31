import { redirect } from 'next/navigation'
import { getAffiliate } from '@/lib/affiliate/auth'
import { LoginForm } from '../auth-forms'
import { getDictionary, isLocale, localePath, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

const pick = (locale: string): Locale => (isLocale(locale) ? locale : DEFAULT_LOCALE)

export default async function AffiliateLoginPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale)
  const home = localePath(locale, '/affiliati')
  if (await getAffiliate()) redirect(home)
  return (
    <LoginForm
      t={getDictionary(locale).affiliates.auth}
      home={home}
      registerHref={localePath(locale, '/affiliati/registrati')}
    />
  )
}
