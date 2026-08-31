import { getAffiliateRules } from '@/lib/affiliate/commission'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { RatesPanel } from '../panels'

export const dynamic = 'force-dynamic'

export default async function AffiliateSettingsPage() {
  const t = getDictionary(getServerLocale()).app.affiliazione.settings
  const rules = await getAffiliateRules(true) // lettura fresca: riflette subito i salvataggi
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-base font-extrabold">{t.title}</h2>
        <p className="text-sm text-muted">{t.sub}</p>
      </div>
      <RatesPanel init={{
        basePct: rules.baseBps / 100, premiumPct: rules.premiumBps / 100,
        minEur: rules.minPayoutCents / 100, months: rules.commissionMonths,
      }} t={t} />
    </div>
  )
}
