import { openPayouts } from '@/lib/affiliate/admin'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { PayoutsPanel } from '../panels'

export const dynamic = 'force-dynamic'

export default async function AffiliatePayoutsPage() {
  const dict = getDictionary(getServerLocale())
  const t = dict.app.affiliazione.payouts
  const payouts = await openPayouts()
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-base font-extrabold">{t.title}</h2>
        <p className="text-sm text-muted">{t.sub}</p>
      </div>
      <PayoutsPanel payouts={payouts as any} t={t} dateLocale={dict.common.dateLocale} />
    </div>
  )
}
