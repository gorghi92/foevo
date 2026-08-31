import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { isBillable } from '@/lib/billing'
import { getDictionary, type Dictionary } from '@/lib/i18n'
import { getServerLocale } from '@/lib/i18n/server'
import { Users, Image, BarChart3, Wallet, Package, SlidersHorizontal, ServerCog, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

type AgoCopy = Dictionary['app']['admin']['overview']['ago']

const eur = (c: number) => `€${((c || 0) / 100).toFixed(2)}`
const usd = (n: number) => `$${(n || 0).toFixed(2)}`
const ago = (d: string, t: AgoCopy) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return t.now
  if (s < 3600) return t.minutes.replace('{n}', String(Math.floor(s / 60)))
  if (s < 86400) return t.hours.replace('{n}', String(Math.floor(s / 3600)))
  return t.days.replace('{n}', String(Math.floor(s / 86400)))
}

export default async function AdminOverview() {
  const dict = getDictionary(getServerLocale())
  const t = dict.app.admin.overview

  const sc = createServiceClient()
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()

  const [
    { count: users }, { count: total }, { count: month }, { count: today }, { count: errors },
    { data: monthRows }, { data: ents }, { data: packages },
    { data: recentA }, { data: recentU }, { data: recentP },
  ] = await Promise.all([
    sc.from('profiles').select('id', { count: 'exact', head: true }),
    sc.from('analyses').select('id', { count: 'exact', head: true }),
    sc.from('analyses').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    sc.from('analyses').select('id', { count: 'exact', head: true }).gte('created_at', dayStart),
    sc.from('analyses').select('id', { count: 'exact', head: true }).eq('status', 'error'),
    sc.from('analyses').select('cost_usd, created_at').gte('created_at', monthStart).limit(10000),
    sc.from('entitlements').select('user_id, status, package_id').eq('status', 'active').limit(2000),
    sc.from('packages').select('id, price_monthly'),
    sc.from('analyses').select('id, url, title, status, tier, user_id, created_at').order('created_at', { ascending: false }).limit(8),
    sc.from('profiles').select('id, email, created_at').order('created_at', { ascending: false }).limit(6),
    sc.from('payments').select('email, amount_cents, currency, created_at').order('created_at', { ascending: false }).limit(6),
  ])

  const monthCost = (monthRows ?? []).reduce((s: number, r: any) => s + (Number(r.cost_usd) || 0), 0)
  const pkg = new Map<string, any>((packages ?? []).map((p: any) => [p.id, p]))

  // Email degli utenti con abbonamento attivo → per escludere account interni/test/review dal conteggio pagante.
  const entUids = Array.from(new Set((ents ?? []).map((e: any) => e.user_id).filter(Boolean)))
  const entEmail = new Map<string, string>()
  if (entUids.length) { const { data } = await sc.from('profiles').select('id, email').in('id', entUids); for (const p of data ?? []) entEmail.set(p.id, p.email) }
  const billableEnts = (ents ?? []).filter((e: any) => isBillable(entEmail.get(e.user_id)))
  const activeSubs = billableEnts.length
  const mrr = billableEnts.reduce((s: number, e: any) => s + (e.package_id ? pkg.get(e.package_id)?.price_monthly ?? 0 : 0), 0)

  // email map per recent analyses
  const aUids = Array.from(new Set((recentA ?? []).map((a: any) => a.user_id)))
  const emailMap = new Map<string, string>()
  if (aUids.length) { const { data } = await sc.from('profiles').select('id, email').in('id', aUids); for (const p of data ?? []) emailMap.set(p.id, p.email) }

  const kpis = [
    { label: t.kpi.users, value: String(users ?? 0) },
    { label: t.kpi.activeSubs, value: String(activeSubs ?? 0) },
    { label: t.kpi.mrr, value: eur(mrr), sub: t.kpi.mrrSub },
    { label: t.kpi.aiCostMonth, value: usd(monthCost) },
    { label: t.kpi.analysesToday, value: String(today ?? 0) },
    { label: t.kpi.analysesMonth, value: String(month ?? 0) },
    { label: t.kpi.analysesTotal, value: String(total ?? 0) },
    { label: t.kpi.errors, value: String(errors ?? 0) },
  ]
  const sections = [
    { href: '/admin/users', label: t.sections.usersLabel, desc: t.sections.usersDesc, icon: Users },
    { href: '/admin/analyses', label: t.sections.analysesLabel, desc: t.sections.analysesDesc, icon: Image },
    { href: '/admin/usage', label: t.sections.usageLabel, desc: t.sections.usageDesc, icon: BarChart3 },
    { href: '/admin/revenue', label: t.sections.revenueLabel, desc: t.sections.revenueDesc, icon: Wallet },
    { href: '/admin/packages', label: t.sections.packagesLabel, desc: t.sections.packagesDesc, icon: Package },
    { href: '/admin/settings', label: t.sections.settingsLabel, desc: t.sections.settingsDesc, icon: SlidersHorizontal },
    { href: '/admin/system', label: t.sections.systemLabel, desc: t.sections.systemDesc, icon: ServerCog },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <div className="text-[11px] uppercase tracking-wide text-muted">{k.label}</div>
            <div className="mt-1 font-display text-2xl font-extrabold">{k.value}</div>
            {k.sub && <div className="text-xs text-muted">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="card group flex items-start gap-3 p-4 hover:border-brand">
            <span className="rounded-lg bg-bg p-2 text-brand"><s.icon size={18} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 font-semibold">{s.label} <ArrowRight size={14} className="opacity-0 transition group-hover:opacity-100" /></span>
              <span className="block text-xs text-muted">{s.desc}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-1">
          <div className="mb-2 font-semibold">{t.recentAnalyses}</div>
          <div className="space-y-2">
            {(recentA ?? []).map((a: any) => (
              <Link key={a.id} href={`/analyses/${a.id}`} className="block rounded-lg p-2 hover:bg-bg">
                <div className="flex items-center gap-2 text-[13px]"><span className="truncate font-medium">{a.title || a.url || t.analysisFallback}</span><span className="ml-auto text-xs text-muted">{ago(a.created_at, t.ago)}</span></div>
                <div className="truncate text-xs text-muted">{emailMap.get(a.user_id) || '—'} · {a.status} · {a.tier || '—'}</div>
              </Link>
            ))}
            {(!recentA || recentA.length === 0) && <div className="text-sm text-muted">{t.noAnalyses}</div>}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 font-semibold">{t.newUsers}</div>
          <div className="space-y-1.5">
            {(recentU ?? []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-2 text-[13px]"><span className="truncate">{u.email}</span><span className="ml-auto text-xs text-muted">{ago(u.created_at, t.ago)}</span></div>
            ))}
            {(!recentU || recentU.length === 0) && <div className="text-sm text-muted">{t.noUsers}</div>}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 font-semibold">{t.recentPayments}</div>
          <div className="space-y-1.5">
            {(recentP ?? []).map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[13px]"><span className="truncate">{p.email || '—'}</span><span className="ml-auto font-semibold">{eur(p.amount_cents)}</span><span className="text-xs text-muted">{ago(p.created_at, t.ago)}</span></div>
            ))}
            {(!recentP || recentP.length === 0) && <div className="text-sm text-muted">{t.noPayments}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
