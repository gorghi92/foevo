import { redirect } from 'next/navigation'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { isBillable } from '@/lib/billing'
import { getDictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { RevenueLive } from './revenue-live'

export const dynamic = 'force-dynamic'

const eur = (cents: number) => `€${((cents || 0) / 100).toFixed(2)}`

export default async function RevenuePage() {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) redirect('/dashboard')

  const dict = getDictionary(getServerLocale())
  const t = dict.app.admin.revenue
  const fdate = (d?: string | null) => (d ? new Date(d).toLocaleDateString(dict.common.dateLocale) : '—')

  const sc = createServiceClient()
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

  const [{ data: ents }, { data: packages }, { data: payments }] = await Promise.all([
    sc.from('entitlements').select('user_id, tier, status, source, package_id, current_period_end, updated_at').limit(2000),
    sc.from('packages').select('id, name, price_monthly'),
    sc.from('payments').select('amount_cents, currency, created_at, status').limit(10000),
  ])

  const pkgById = new Map<string, any>((packages ?? []).map((p: any) => [p.id, p]))
  const uids = Array.from(new Set((ents ?? []).map((e: any) => e.user_id)))
  const emailMap = new Map<string, string>()
  if (uids.length) {
    const { data: profs } = await sc.from('profiles').select('id, email').in('id', uids)
    for (const p of profs ?? []) emailMap.set(p.id as string, (p.email as string) ?? '')
  }

  const planPrice = (e: any) => (e.package_id ? pkgById.get(e.package_id)?.price_monthly ?? 0 : 0)
  const rows = (ents ?? []).map((e: any) => ({
    email: emailMap.get(e.user_id) ?? e.user_id,
    tier: e.tier, status: e.status, source: e.source,
    priceCents: planPrice(e), renewal: e.current_period_end, updated: e.updated_at,
    plan: e.package_id ? pkgById.get(e.package_id)?.name ?? e.tier : e.tier,
  }))

  // Esclude account interni/test/review dal conteggio clienti (restano nel consumo, non qui).
  const billable = rows.filter((r) => isBillable(r.email))
  const active = billable.filter((r) => r.status === 'active' && r.priceCents > 0)
  const churned = billable.filter((r) => r.status === 'canceled' || r.status === 'past_due')
  const mrr = active.reduce((s, r) => s + r.priceCents, 0)

  const paid = (payments ?? []).filter((p: any) => p.status === 'paid')
  const revTotal = paid.reduce((s: number, p: any) => s + (Number(p.amount_cents) || 0), 0)
  const revMonth = paid.filter((p: any) => p.created_at >= monthStart).reduce((s: number, p: any) => s + (Number(p.amount_cents) || 0), 0)

  const Card = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-extrabold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  )

  return (
    <div>
      <div className="mb-4 flex items-center justify-end"><RevenueLive label={t.live} /></div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label={t.kpi.mrr} value={eur(mrr)} sub={t.kpi.mrrSub.replace('{n}', String(active.length))} />
        <Card label={t.kpi.collectedMonth} value={eur(revMonth)} sub={t.kpi.collectedMonthSub} />
        <Card label={t.kpi.collectedTotal} value={eur(revTotal)} sub={t.kpi.collectedTotalSub.replace('{n}', String(paid.length))} />
        <Card label={t.kpi.churned} value={String(churned.length)} sub={t.kpi.churnedSub} />
      </div>

      <h2 className="mt-6 text-lg font-bold">{t.activeTitle}</h2>
      <div className="card mt-2 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted"><th className="p-3">{t.colUser}</th><th className="p-3">{t.colPlan}</th><th className="p-3 text-right">{t.colPrice}</th><th className="p-3">{t.colSource}</th><th className="p-3">{t.colRenewal}</th></tr></thead>
          <tbody>
            {active.map((r, i) => (
              <tr key={i} className="border-b border-line/60">
                <td className="max-w-[240px] truncate p-3 font-medium">{r.email}</td>
                <td className="p-3">{r.plan}</td>
                <td className="p-3 text-right">{eur(r.priceCents)} <span className="text-xs text-muted">{t.plusVat}</span></td>
                <td className="p-3 text-xs">{r.source}</td>
                <td className="p-3">{fdate(r.renewal)}</td>
              </tr>
            ))}
            {active.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted">{t.activeEmpty}</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="mt-6 text-lg font-bold">{t.churnedTitle}</h2>
      <div className="card mt-2 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted"><th className="p-3">{t.colUser}</th><th className="p-3">{t.colPlan}</th><th className="p-3">{t.colStatus}</th><th className="p-3">{t.colUpdated}</th></tr></thead>
          <tbody>
            {churned.map((r, i) => (
              <tr key={i} className="border-b border-line/60">
                <td className="max-w-[240px] truncate p-3 font-medium">{r.email}</td>
                <td className="p-3">{r.plan}</td>
                <td className="p-3"><span className="rounded border border-line px-1.5 py-0.5 text-xs">{r.status}</span></td>
                <td className="p-3">{fdate(r.updated)}</td>
              </tr>
            ))}
            {churned.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted">{t.churnedEmpty}</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted">{t.note}</p>
    </div>
  )
}
