import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAffiliate, startSession } from '@/lib/affiliate/auth'
import { referralLink, affiliateOverview, recentCommissions, payoutHistory, affiliateBank } from '@/lib/affiliate/data'
import { AffiliateDashboard } from '@/app/[locale]/affiliati/dashboard'
import { ActivateForm } from './activate-form'
import { getDictionary, localePath } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export default async function InvitaPage() {
  const locale = getServerLocale()
  const dict = getDictionary(locale)

  const user = await getUser()
  const sc = createServiceClient()

  // L'utente ha già attivato il suo link affiliato?
  const { data: aff } = await sc.from('affiliates')
    .select('id, code, full_name, status').eq('user_id', user!.id).maybeSingle()

  if (!aff || aff.status !== 'active') return <ActivateForm t={dict.app.invita} />

  // Assicura una sessione affiliato (così la dashboard riusata e i suoi endpoint
  // funzionano con lo stesso cookie del resto dell'area affiliati).
  const active = await getAffiliate()
  if (!active || active.id !== aff.id) await startSession(aff.id)

  const [overview, commissions, payouts, bank] = await Promise.all([
    affiliateOverview(aff.id), recentCommissions(aff.id), payoutHistory(aff.id), affiliateBank(aff.id),
  ])

  return (
    <div className="mx-auto max-w-4xl">
      <AffiliateDashboard
        name={aff.full_name || ''}
        link={referralLink(aff.code)}
        overview={overview}
        commissions={commissions as any}
        payouts={payouts as any}
        bank={bank as any}
        embedded
        t={dict.affiliates.dashboard}
        dateLocale={dict.common.dateLocale}
        loginHref={localePath(locale, '/affiliati/accedi')}
      />
    </div>
  )
}
