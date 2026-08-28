import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { isBillable } from '@/lib/billing'
import { Users, Image, BarChart3, Wallet, Package, SlidersHorizontal, ServerCog, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const eur = (c: number) => `€${((c || 0) / 100).toFixed(2)}`
const usd = (n: number) => `$${(n || 0).toFixed(2)}`
const ago = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'ora'
  if (s < 3600) return `${Math.floor(s / 60)}m fa`
  if (s < 86400) return `${Math.floor(s / 3600)}h fa`
  return `${Math.floor(s / 86400)}g fa`
}

export default async function AdminOverview() {
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
    { label: 'Utenti', value: String(users ?? 0) },
    { label: 'Abbonamenti attivi', value: String(activeSubs ?? 0) },
    { label: 'MRR', value: eur(mrr), sub: 'IVA escl.' },
    { label: 'Costo AI (mese)', value: usd(monthCost) },
    { label: 'Analisi oggi', value: String(today ?? 0) },
    { label: 'Analisi mese', value: String(month ?? 0) },
    { label: 'Analisi totali', value: String(total ?? 0) },
    { label: 'Errori', value: String(errors ?? 0) },
  ]
  const sections = [
    { href: '/admin/users', label: 'Utenti', desc: 'Crea, modifica, elimina, impersonifica', icon: Users },
    { href: '/admin/analyses', label: 'Analisi', desc: 'Tutte le analisi, filtri e ricerca', icon: Image },
    { href: '/admin/usage', label: 'Consumo', desc: 'Costo AI e token per utente', icon: BarChart3 },
    { href: '/admin/revenue', label: 'Ricavi', desc: 'MRR, rinnovi, disiscritti', icon: Wallet },
    { href: '/admin/packages', label: 'Pacchetti', desc: 'Piani, prezzi e Plan ID Whop', icon: Package },
    { href: '/admin/settings', label: 'Impostazioni', desc: 'Configura Whop e lo storage', icon: SlidersHorizontal },
    { href: '/admin/system', label: 'Sistema', desc: 'Diagnostica e stato config', icon: ServerCog },
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
          <div className="mb-2 font-semibold">Ultime analisi</div>
          <div className="space-y-2">
            {(recentA ?? []).map((a: any) => (
              <Link key={a.id} href={`/analyses/${a.id}`} className="block rounded-lg p-2 hover:bg-bg">
                <div className="flex items-center gap-2 text-[13px]"><span className="truncate font-medium">{a.title || a.url || 'Analisi'}</span><span className="ml-auto text-xs text-muted">{ago(a.created_at)}</span></div>
                <div className="truncate text-xs text-muted">{emailMap.get(a.user_id) || '—'} · {a.status} · {a.tier || '—'}</div>
              </Link>
            ))}
            {(!recentA || recentA.length === 0) && <div className="text-sm text-muted">Nessuna analisi.</div>}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 font-semibold">Nuovi utenti</div>
          <div className="space-y-1.5">
            {(recentU ?? []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-2 text-[13px]"><span className="truncate">{u.email}</span><span className="ml-auto text-xs text-muted">{ago(u.created_at)}</span></div>
            ))}
            {(!recentU || recentU.length === 0) && <div className="text-sm text-muted">Nessuno.</div>}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 font-semibold">Ultimi pagamenti</div>
          <div className="space-y-1.5">
            {(recentP ?? []).map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[13px]"><span className="truncate">{p.email || '—'}</span><span className="ml-auto font-semibold">{eur(p.amount_cents)}</span><span className="text-xs text-muted">{ago(p.created_at)}</span></div>
            ))}
            {(!recentP || recentP.length === 0) && <div className="text-sm text-muted">Nessun pagamento.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
