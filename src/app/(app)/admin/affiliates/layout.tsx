import { Share2 } from 'lucide-react'
import { unreadAlerts } from '@/lib/affiliate/admin'
import { AffiliateAdminNav } from './nav'

export const dynamic = 'force-dynamic'

export default async function AffiliateAdminLayout({ children }: { children: React.ReactNode }) {
  const { count } = await unreadAlerts(1).catch(() => ({ count: 0 }))
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 font-display text-lg font-extrabold">
          <Share2 size={18} className="text-brand" /> Affiliazione
        </div>
        <p className="mt-0.5 text-sm text-muted">Gestione completa del programma affiliati: andamento, affiliati, pagamenti e regole.</p>
      </div>
      <div className="border-b border-line pb-2">
        <AffiliateAdminNav alertCount={count} />
      </div>
      <div>{children}</div>
    </div>
  )
}
