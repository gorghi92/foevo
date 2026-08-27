import { listAffiliates } from '@/lib/affiliate/admin'
import { AffiliatesTable } from '../panels'

export const dynamic = 'force-dynamic'

export default async function AffiliatesListPage() {
  const rows = await listAffiliates()
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-base font-extrabold">Affiliati registrati</h2>
        <p className="text-sm text-muted">Ogni riga apre la scheda con link, referral e commissioni dell’affiliato.</p>
      </div>
      <AffiliatesTable rows={rows} />
    </div>
  )
}
