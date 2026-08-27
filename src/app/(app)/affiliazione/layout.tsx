import { redirect } from 'next/navigation'
import { Share2 } from 'lucide-react'
import { getUser } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { unreadAlerts } from '@/lib/affiliate/admin'
import { AffiliateAdminNav } from './nav'

export const dynamic = 'force-dynamic'

export default async function AffiliateAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) redirect('/dashboard')

  const { count } = await unreadAlerts(1).catch(() => ({ count: 0 }))
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand"><Share2 size={17} /></span>
        <div>
          <h1 className="font-display text-xl font-extrabold leading-tight">Affiliazione</h1>
          <p className="text-xs text-muted">Gestione completa del programma affiliati: andamento, affiliati, pagamenti e regole.</p>
        </div>
      </div>
      <div className="border-b border-line pb-2">
        <AffiliateAdminNav alertCount={count} />
      </div>
      <div>{children}</div>
    </div>
  )
}
