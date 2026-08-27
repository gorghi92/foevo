import { getUser, createServiceClient } from '@/lib/supabase/server'
import { UsersPanel } from './users-panel'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const me = await getUser()
  const sc = createServiceClient()
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

  const [{ data: list }, { data: ents }, { data: analyses }] = await Promise.all([
    sc.auth.admin.listUsers({ page: 1, perPage: 500 }),
    sc.from('entitlements').select('user_id, tier, status, source').limit(2000),
    sc.from('analyses').select('user_id, cost_usd, created_at, status').limit(10000),
  ])

  const entByUser = new Map<string, any>((ents ?? []).map((e: any) => [e.user_id, e]))
  const usageByUser = new Map<string, { count: number; monthCount: number; cost: number }>()
  for (const a of analyses ?? []) {
    const u = usageByUser.get(a.user_id) || { count: 0, monthCount: 0, cost: 0 }
    if (a.status === 'done') { u.count++; u.cost += Number(a.cost_usd) || 0; if (a.created_at >= monthStart) u.monthCount++ }
    usageByUser.set(a.user_id, u)
  }

  const users = (list?.users ?? []).map((u: any) => {
    const ent = entByUser.get(u.id)
    const usage = usageByUser.get(u.id) || { count: 0, monthCount: 0, cost: 0 }
    return {
      id: u.id, email: u.email ?? '—',
      created: u.created_at, lastSignIn: u.last_sign_in_at ?? null,
      banned: !!u.banned_until && new Date(u.banned_until) > now,
      tier: ent?.status === 'active' ? (ent.tier ?? 'base') : 'trial',
      source: ent?.source ?? '—',
      analyses: usage.count, monthAnalyses: usage.monthCount, cost: usage.cost,
    }
  }).sort((a, b) => (b.created || '').localeCompare(a.created || ''))

  return <UsersPanel users={users} meId={me?.id ?? ''} />
}
