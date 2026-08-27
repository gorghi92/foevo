import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { AdminTabs } from './tabs'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) redirect('/dashboard')

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-1 flex items-center gap-2">
        <span className="heat-dot h-6 w-6 rounded-lg" aria-hidden />
        <h1 className="text-xl font-extrabold">Quartier generale</h1>
        <span className="ml-auto truncate text-xs text-muted">{user?.email}</span>
      </div>
      <p className="mb-4 text-sm text-muted">Controllo e gestione dell’intera piattaforma Foveo.</p>
      <AdminTabs />
      <div className="mt-5">{children}</div>
    </div>
  )
}
