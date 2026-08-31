import { redirect } from 'next/navigation'
import { getAffiliate } from '@/lib/affiliate/auth'
import {
  referralLink, affiliateOverview, recentCommissions, payoutHistory, affiliateBank,
} from '@/lib/affiliate/data'
import { AffiliateDashboard } from './dashboard'
import { getDictionary, isLocale, localePath, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

const pick = (locale: string): Locale => (isLocale(locale) ? locale : DEFAULT_LOCALE)

export default async function AffiliateHome({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale)
  const dict = getDictionary(locale)
  const loginHref = localePath(locale, '/affiliati/accedi')

  const aff = await getAffiliate()
  if (!aff) redirect(loginHref)

  const [overview, commissions, payouts, bank] = await Promise.all([
    affiliateOverview(aff.id),
    recentCommissions(aff.id),
    payoutHistory(aff.id),
    affiliateBank(aff.id),
  ])

  return (
    <AffiliateDashboard
      name={aff.full_name || ''}
      link={referralLink(aff.code)}
      overview={overview}
      commissions={commissions as any}
      payouts={payouts as any}
      bank={bank as any}
      t={dict.affiliates.dashboard}
      dateLocale={dict.common.dateLocale}
      loginHref={loginHref}
    />
  )
}
