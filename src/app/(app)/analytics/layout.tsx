import { redirect } from 'next/navigation'
import { BarChart3 } from 'lucide-react'
import { getUser } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { AnalyticsNav } from './nav'

export const dynamic = 'force-dynamic'

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) redirect('/dashboard')

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand"><BarChart3 size={17} /></span>
        <div>
          <h1 className="font-display text-xl font-extrabold leading-tight">Analytics</h1>
          <p className="text-xs text-muted">Visite al sito, sorgenti e comportamento sulla landing — con heatmap dei click.</p>
        </div>
      </div>
      <div className="border-b border-line pb-2">
        <AnalyticsNav />
      </div>
      <div>{children}</div>
    </div>
  )
}
