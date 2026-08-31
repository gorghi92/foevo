import { listAffiliates } from '@/lib/affiliate/admin'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { AffiliatesTable } from '../panels'

export const dynamic = 'force-dynamic'

export default async function AffiliatesListPage() {
  const t = getDictionary(getServerLocale()).app.affiliazione.list
  const rows = await listAffiliates()
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-base font-extrabold">{t.title}</h2>
        <p className="text-sm text-muted">{t.sub}</p>
      </div>
      <AffiliatesTable rows={rows} t={t} />
    </div>
  )
}
