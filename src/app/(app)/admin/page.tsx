import { redirect } from 'next/navigation'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import AdminPanel from './panel'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) redirect('/dashboard')

  const sc = createServiceClient()
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

  const [packages, ents, total, month, done, err, activeEnt] = await Promise.all([
    sc.from('packages').select('*').order('order_index'),
    sc.from('entitlements').select('user_id, tier, monthly_quota, unlimited, status, source, current_period_end').order('updated_at', { ascending: false }).limit(200),
    sc.from('analyses').select('id', { count: 'exact', head: true }),
    sc.from('analyses').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    sc.from('analyses').select('id', { count: 'exact', head: true }).eq('status', 'done'),
    sc.from('analyses').select('id', { count: 'exact', head: true }).eq('status', 'error'),
    sc.from('entitlements').select('user_id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  // map emails onto entitlements
  const ids = (ents.data ?? []).map((e: any) => e.user_id)
  const emailMap = new Map<string, string>()
  if (ids.length) {
    const { data: profs } = await sc.from('profiles').select('id, email').in('id', ids)
    for (const p of profs ?? []) emailMap.set(p.id as string, (p.email as string) ?? '')
  }
  const entitlements = (ents.data ?? []).map((e: any) => ({ ...e, email: emailMap.get(e.user_id) ?? e.user_id }))

  const stats = {
    total: total.count ?? 0, month: month.count ?? 0, done: done.count ?? 0,
    error: err.count ?? 0, activeEntitlements: activeEnt.count ?? 0,
  }

  return <AdminPanel packages={packages.data ?? []} entitlements={entitlements} stats={stats} />
}
