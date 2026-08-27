import { redirect } from 'next/navigation'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

const usd = (n: number) => `$${(n || 0).toFixed(4)}`
const usd2 = (n: number) => `$${(n || 0).toFixed(2)}`
const eur = (cents: number) => `€${((cents || 0) / 100).toFixed(2)}`
const num = (n: number) => (n || 0).toLocaleString('it-IT')

export default async function UsagePage() {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) redirect('/dashboard')

  const sc = createServiceClient()
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

  const [{ data: analyses }, { data: ents }, { data: packages }] = await Promise.all([
    sc.from('analyses').select('user_id, tier, status, cost_usd, input_tokens, output_tokens, created_at').limit(10000),
    sc.from('entitlements').select('user_id, tier, package_id, status').limit(1000),
    sc.from('packages').select('id, name, price_monthly'),
  ])

  const rows = (analyses ?? []).filter((a: any) => a.status === 'done')
  const pkgById = new Map<string, any>((packages ?? []).map((p: any) => [p.id, p]))
  const entByUser = new Map<string, any>((ents ?? []).map((e: any) => [e.user_id, e]))

  // profili (email) per gli utenti coinvolti
  const userIds = Array.from(new Set([...rows.map((r: any) => r.user_id), ...(ents ?? []).map((e: any) => e.user_id)]))
  const emailMap = new Map<string, string>()
  if (userIds.length) {
    const { data: profs } = await sc.from('profiles').select('id, email').in('id', userIds)
    for (const p of profs ?? []) emailMap.set(p.id as string, (p.email as string) ?? '')
  }

  // aggregazione per utente
  type Agg = { userId: string; email: string; tier: string; planCents: number; mAnalyses: number; mCost: number; mTokens: number; tAnalyses: number; tCost: number; tTokens: number }
  const byUser = new Map<string, Agg>()
  const ensure = (uid: string): Agg => {
    let a = byUser.get(uid)
    if (!a) {
      const ent = entByUser.get(uid)
      const pkg = ent?.package_id ? pkgById.get(ent.package_id) : null
      a = { userId: uid, email: emailMap.get(uid) ?? uid, tier: ent?.status === 'active' ? (ent.tier ?? 'base') : 'trial', planCents: pkg?.price_monthly ?? 0, mAnalyses: 0, mCost: 0, mTokens: 0, tAnalyses: 0, tCost: 0, tTokens: 0 }
      byUser.set(uid, a)
    }
    return a
  }
  // includi anche utenti con solo entitlement (nessuna analisi)
  for (const e of ents ?? []) ensure(e.user_id)

  let totalCost = 0, monthCost = 0, monthAnalyses = 0, totalTokens = 0
  const tierCount: Record<string, number> = { base: 0, premium: 0 }
  const tierCost: Record<string, number> = { base: 0, premium: 0 }

  for (const r of rows) {
    const a = ensure(r.user_id)
    const cost = Number(r.cost_usd) || 0
    const toks = (Number(r.input_tokens) || 0) + (Number(r.output_tokens) || 0)
    a.tAnalyses++; a.tCost += cost; a.tTokens += toks
    totalCost += cost; totalTokens += toks
    const t = r.tier === 'premium' ? 'premium' : 'base'
    tierCount[t]++; tierCost[t] += cost
    if (r.created_at >= monthStart) {
      a.mAnalyses++; a.mCost += cost; a.mTokens += toks
      monthCost += cost; monthAnalyses++
    }
  }

  const list = Array.from(byUser.values()).sort((x, y) => y.mCost - x.mCost)
  const mrrCents = list.reduce((s, u) => s + (u.tier !== 'trial' ? u.planCents : 0), 0)
  const totalAnalyses = rows.length
  const avgCost = totalAnalyses ? totalCost / totalAnalyses : 0

  // serie giornaliera (ultimi 30 giorni)
  const DAYS = 30
  const dayMap = new Map<string, { cost: number; count: number }>()
  for (let i = 0; i < DAYS; i++) dayMap.set(new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10), { cost: 0, count: 0 })
  for (const r of rows) {
    const e = dayMap.get(String(r.created_at).slice(0, 10))
    if (e) { e.cost += Number(r.cost_usd) || 0; e.count++ }
  }
  const series = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v })).reverse()
  const maxCost = Math.max(1e-6, ...series.map((s) => s.cost))

  const Card = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-extrabold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  )

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Ricavo ricorrente (MRR)" value={eur(mrrCents)} sub="piani attivi" />
        <Card label="Costo AI questo mese" value={usd2(monthCost)} sub={`${num(monthAnalyses)} analisi`} />
        <Card label="Margine mese (stima)" value={`€${(mrrCents / 100 - monthCost).toFixed(2)}`} sub="MRR € − costo $ (≈ parità)" />
        <Card label="Costo medio / analisi" value={usd(avgCost)} sub={`${num(totalAnalyses)} totali`} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Costo AI totale" value={usd2(totalCost)} />
        <Card label="Token totali" value={num(totalTokens)} />
        <Card label="Analisi Base" value={num(tierCount.base)} sub={usd(tierCost.base)} />
        <Card label="Analisi Premium" value={num(tierCount.premium)} sub={usd(tierCost.premium)} />
      </div>

      <div className="card mt-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-semibold">Consumo giornaliero <span className="text-xs text-muted">· ultimi 30 giorni</span></div>
          <div className="text-xs text-muted">barre = costo AI ($) · picco {usd(maxCost)}</div>
        </div>
        <svg viewBox={`0 0 ${series.length * 18} 130`} preserveAspectRatio="none" style={{ width: '100%', height: 150 }}>
          <line x1={0} y1={110} x2={series.length * 18} y2={110} style={{ stroke: 'rgb(var(--line))' }} strokeWidth={1} />
          {series.map((s, i) => {
            const h = Math.round((s.cost / maxCost) * 100)
            return (
              <rect key={i} x={i * 18 + 3} y={110 - Math.max(1, h)} width={12} height={Math.max(1, h)} rx={2} style={{ fill: 'rgb(var(--brand))' }}>
                <title>{`${s.date}: ${usd(s.cost)} · ${num(s.count)} analisi`}</title>
              </rect>
            )
          })}
        </svg>
        <div className="mt-1 flex justify-between text-[10px] text-muted">
          <span>{series[0]?.date}</span><span>oggi</span>
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Utente</th>
              <th className="p-3">Piano</th>
              <th className="p-3 text-right">Analisi (mese)</th>
              <th className="p-3 text-right">Costo (mese)</th>
              <th className="p-3 text-right">Token (mese)</th>
              <th className="p-3 text-right">Margine mese</th>
              <th className="p-3 text-right">Analisi (tot)</th>
              <th className="p-3 text-right">Costo (tot)</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => {
              const margin = u.planCents / 100 - u.mCost
              return (
                <tr key={u.userId} className="border-b border-line/60">
                  <td className="max-w-[220px] truncate p-3 font-medium">{u.email}</td>
                  <td className="p-3"><span className="rounded border border-line px-1.5 py-0.5 text-xs">{u.tier}</span> {u.planCents ? <span className="text-xs text-muted">{eur(u.planCents)}</span> : null}</td>
                  <td className="p-3 text-right">{num(u.mAnalyses)}</td>
                  <td className="p-3 text-right">{usd(u.mCost)}</td>
                  <td className="p-3 text-right">{num(u.mTokens)}</td>
                  <td className="p-3 text-right font-semibold" style={{ color: margin >= 0 ? '#16a34a' : '#dc2626' }}>€{margin.toFixed(2)}</td>
                  <td className="p-3 text-right text-muted">{num(u.tAnalyses)}</td>
                  <td className="p-3 text-right text-muted">{usd(u.tCost)}</td>
                </tr>
              )
            })}
            {list.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted">Nessun dato ancora.</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted">
        I costi AI sono stimati dai token consumati (prezzi in <code>src/lib/attention/pricing.ts</code> — verifica quelli Qwen/DashScope).
        Il margine confronta il ricavo del piano (€) con il costo AI del mese ($) assumendo ≈ parità di cambio; le analisi fatte prima di questo aggiornamento non hanno costo registrato.
      </p>
    </div>
  )
}
