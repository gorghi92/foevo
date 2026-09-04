import { redirect } from 'next/navigation'
import { getAffiliate } from '@/lib/affiliate/auth'
import { RegisterForm } from '../auth-forms'
import { getDictionary, isLocale, localePath, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

const pick = (locale: string): Locale => (isLocale(locale) ? locale : DEFAULT_LOCALE)

export default async function AffiliateRegisterPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale)
  const home = localePath(locale, '/affiliati')
  if (await getAffiliate()) redirect(home)
  return (
    <RegisterForm
      t={getDictionary(locale).affiliates.auth}
      home={home}
      loginHref={localePath(locale, '/affiliati/accedi')}
    />
  )
}
