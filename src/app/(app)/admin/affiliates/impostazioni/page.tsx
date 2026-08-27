import { getAffiliateRules } from '@/lib/affiliate/commission'
import { RatesPanel } from '../panels'

export const dynamic = 'force-dynamic'

export default async function AffiliateSettingsPage() {
  const rules = await getAffiliateRules()
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-base font-extrabold">Regole di affiliazione</h2>
        <p className="text-sm text-muted">Percentuali di default per piano, durata della finestra di commissione e soglia minima di pagamento.</p>
      </div>
      <RatesPanel init={{
        basePct: rules.baseBps / 100, premiumPct: rules.premiumBps / 100,
        minEur: rules.minPayoutCents / 100, months: rules.commissionMonths,
      }} />
    </div>
  )
}
