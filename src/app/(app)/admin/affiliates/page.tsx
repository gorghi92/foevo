import { getAffiliateRules } from '@/lib/affiliate/commission'
import { listAffiliates, openPayouts, unreadAlerts } from '@/lib/affiliate/admin'
import { RatesPanel, PayoutsPanel, AffiliatesTable, AlertsPanel } from './panels'

export const dynamic = 'force-dynamic'

export default async function AdminAffiliatesPage() {
  const [rules, rows, payouts, alerts] = await Promise.all([
    getAffiliateRules(), listAffiliates(), openPayouts(), unreadAlerts(),
  ])

  const totals = rows.reduce((a, r) => ({
    affiliates: a.affiliates + 1,
    conversions: a.conversions + r.conversions,
    earned: a.earned + r.earnedCents,
    available: a.available + r.availableCents,
  }), { affiliates: 0, conversions: 0, earned: 0, available: 0 })

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <KPI label="Affiliati" value={String(totals.affiliates)} />
        <KPI label="Clienti portati" value={String(totals.conversions)} />
        <KPI label="Commissioni maturate" value={`€${(totals.earned / 100).toFixed(2)}`} />
        <KPI label="Da liquidare" value={`€${(totals.available / 100).toFixed(2)}`} />
      </div>

      <AlertsPanel alerts={alerts.alerts as any} />

      <RatesPanel init={{
        basePct: rules.baseBps / 100, premiumPct: rules.premiumBps / 100,
        minEur: rules.minPayoutCents / 100, months: rules.commissionMonths,
      }} />

      <div>
        <h2 className="mb-2 font-display text-lg font-extrabold">Richieste di pagamento</h2>
        <PayoutsPanel payouts={payouts as any} />
      </div>

      <div>
        <h2 className="mb-2 font-display text-lg font-extrabold">Affiliati</h2>
        <AffiliatesTable rows={rows} />
      </div>
    </div>
  )
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-extrabold">{value}</div>
    </div>
  )
}
