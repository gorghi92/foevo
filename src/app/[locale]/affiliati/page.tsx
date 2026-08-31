import { redirect } from 'next/navigation'
import { getAffiliate } from '@/lib/affiliate/auth'
import {
  referralLink, affiliateOverview, recentCommissions, payoutHistory, affiliateBank,
} from '@/lib/affiliate/data'
import { AffiliateDashboard } from './dashboard'

export const dynamic = 'force-dynamic'

export default async function AffiliateHome() {
  const aff = await getAffiliate()
  if (!aff) redirect('/affiliati/accedi')

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
    />
  )
}
