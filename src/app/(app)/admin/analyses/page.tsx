import { createServiceClient } from '@/lib/supabase/server'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { AnalysesAdmin } from './analyses-admin'

export const dynamic = 'force-dynamic'

export default async function AdminAnalysesPage() {
  const dict = getDictionary(getServerLocale())
  const sc = createServiceClient()
  const { data: analyses } = await sc
    .from('analyses')
    .select('id, url, title, status, tier, user_id, created_at, score_conversion, cost_usd')
    .order('created_at', { ascending: false })
    .limit(2000)

  const uids = Array.from(new Set((analyses ?? []).map((a: any) => a.user_id)))
  const emailMap = new Map<string, string>()
  if (uids.length) { const { data } = await sc.from('profiles').select('id, email').in('id', uids); for (const p of data ?? []) emailMap.set(p.id, p.email) }

  const rows = (analyses ?? []).map((a: any) => ({
    id: a.id, url: a.url, title: a.title, status: a.status, tier: a.tier,
    email: emailMap.get(a.user_id) || a.user_id, created: a.created_at,
    score: a.score_conversion, cost: Number(a.cost_usd) || 0,
  }))
  const emails = Array.from(new Set(rows.map((r) => r.email))).sort()

  return <AnalysesAdmin rows={rows} emails={emails} t={dict.app.admin.analyses} dateLocale={dict.common.dateLocale} />
}
