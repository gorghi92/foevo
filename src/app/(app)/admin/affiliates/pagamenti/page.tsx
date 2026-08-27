import { openPayouts } from '@/lib/affiliate/admin'
import { PayoutsPanel } from '../panels'

export const dynamic = 'force-dynamic'

export default async function AffiliatePayoutsPage() {
  const payouts = await openPayouts()
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-base font-extrabold">Richieste di pagamento</h2>
        <p className="text-sm text-muted">Segna come pagata dopo aver eseguito il bonifico, oppure rifiuta per riportare le commissioni disponibili.</p>
      </div>
      <PayoutsPanel payouts={payouts as any} />
    </div>
  )
}
