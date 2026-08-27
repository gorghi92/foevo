import { redirect } from 'next/navigation'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { RevenueLive } from './revenue-live'

export const dynamic = 'force-dynamic'

const eur = (cents: number) => `€${((cents || 0) / 100).toFixed(2)}`
const fdate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('it-IT') : '—')

export default async function RevenuePage() {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) redirect('/dashboard')

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

  const active = rows.filter((r) => r.status === 'active' && r.priceCents > 0)
  const churned = rows.filter((r) => r.status === 'canceled' || r.status === 'past_due')
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
      <div className="mb-4 flex items-center justify-end"><RevenueLive /></div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="MRR (IVA escl.)" value={eur(mrr)} sub={`${active.length} abbonamenti attivi`} />
        <Card label="Incassato questo mese" value={eur(revMonth)} sub="IVA inclusa (Whop)" />
        <Card label="Incassato totale" value={eur(revTotal)} sub={`${paid.length} pagamenti`} />
        <Card label="Disiscritti" value={String(churned.length)} sub="canceled / past_due" />
      </div>

      <h2 className="mt-6 text-lg font-bold">Abbonati attivi</h2>
      <div className="card mt-2 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted"><th className="p-3">Utente</th><th className="p-3">Piano</th><th className="p-3 text-right">Prezzo</th><th className="p-3">Fonte</th><th className="p-3">Prossimo rinnovo</th></tr></thead>
          <tbody>
            {active.map((r, i) => (
              <tr key={i} className="border-b border-line/60">
                <td className="max-w-[240px] truncate p-3 font-medium">{r.email}</td>
                <td className="p-3">{r.plan}</td>
                <td className="p-3 text-right">{eur(r.priceCents)} <span className="text-xs text-muted">+ IVA</span></td>
                <td className="p-3 text-xs">{r.source}</td>
                <td className="p-3">{fdate(r.renewal)}</td>
              </tr>
            ))}
            {active.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted">Nessun abbonamento attivo.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="mt-6 text-lg font-bold">Disiscritti / sospesi</h2>
      <div className="card mt-2 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted"><th className="p-3">Utente</th><th className="p-3">Piano</th><th className="p-3">Stato</th><th className="p-3">Aggiornato</th></tr></thead>
          <tbody>
            {churned.map((r, i) => (
              <tr key={i} className="border-b border-line/60">
                <td className="max-w-[240px] truncate p-3 font-medium">{r.email}</td>
                <td className="p-3">{r.plan}</td>
                <td className="p-3"><span className="rounded border border-line px-1.5 py-0.5 text-xs">{r.status}</span></td>
                <td className="p-3">{fdate(r.updated)}</td>
              </tr>
            ))}
            {churned.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted">Nessun disiscritto.</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted">MRR calcolato sui piani attivi (prezzo IVA esclusa). L’incassato è quanto riscosso da Whop (IVA inclusa). I dati arrivano dai webhook Whop in tempo quasi reale.</p>
    </div>
  )
}
