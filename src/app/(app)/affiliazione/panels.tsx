'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Bell, Check, RotateCcw } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'

type Copy = Dictionary['app']['affiliazione']

const money = (c: number) => `€${((c || 0) / 100).toFixed(2)}`
const pct = (bps: number) => `${(bps / 100).toFixed(bps % 100 ? 1 : 0)}%`

// ---- avvisi (rimborsi/dispute) ----
type Alert = {
  id: string; kind: string; severity: string; title: string; body: string
  commission_id: string | null; whop_payment_id: string | null; amount_cents: number | null; created_at: string
}
export function AlertsPanel({ alerts, t, dateLocale }: { alerts: Alert[]; t: Copy['alerts']; dateLocale: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<Record<string, string>>({})

  if (!alerts.length) return null

  async function markRead(id: string) {
    setBusy(id)
    await fetch('/api/admin/affiliate/alert', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) })
    setBusy(''); router.refresh()
  }
  async function markAll() {
    setBusy('all')
    await fetch('/api/admin/affiliate/alert', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ all: true }) })
    setBusy(''); router.refresh()
  }
  async function reverse(alertId: string, commissionId: string) {
    if (!confirm(t.confirmReverse)) return
    setBusy(alertId)
    const r = await fetch('/api/admin/affiliate/reverse', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ commissionId }) })
    const j = await r.json().catch(() => ({} as any))
    setBusy('')
    if (!r.ok) { setMsg((m) => ({ ...m, [alertId]: j.error || t.reverseError })); return }
    // stornata: segna anche l'avviso come letto
    await fetch('/api/admin/affiliate/alert', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: alertId }) })
    router.refresh()
  }

  return (
    <div className="card border-amber-300/70 bg-amber-50/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold text-amber-800">
          <Bell size={16} /> {t.title.replace('{n}', String(alerts.length))}
        </div>
        <button onClick={markAll} disabled={busy === 'all'} className="btn btn-ghost px-2.5 py-1 text-xs">{t.markAll}</button>
      </div>
      <div className="mt-3 space-y-2.5">
        {alerts.map((a) => {
          const critical = a.severity === 'critical'
          return (
            <div key={a.id} className={`rounded-lg border p-3 ${critical ? 'border-red-300 bg-red-50' : 'border-line bg-panel'}`}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className={`mt-0.5 shrink-0 ${critical ? 'text-red-600' : 'text-amber-600'}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink">{a.title}</div>
                  <p className="mt-0.5 text-xs text-muted">{a.body}</p>
                  {msg[a.id] && <p className="mt-1 text-xs text-red-600">{msg[a.id]}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {a.commission_id && (
                      <button onClick={() => reverse(a.id, a.commission_id!)} disabled={!!busy} className="btn btn-ghost border border-red-300 px-2.5 py-1 text-xs text-red-700">
                        <RotateCcw size={13} /> {t.reverse}
                      </button>
                    )}
                    <button onClick={() => markRead(a.id)} disabled={!!busy} className="btn btn-ghost px-2.5 py-1 text-xs">
                      <Check size={13} /> {t.markRead}
                    </button>
                    <span className="ml-1 text-[11px] text-muted">{new Date(a.created_at).toLocaleString(dateLocale)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- configurazione percentuali ----
export function RatesPanel({ init, t }: { init: { basePct: number; premiumPct: number; minEur: number; months: number }; t: Copy['settings'] }) {
  const router = useRouter()
  const [f, setF] = useState(init)
  // Riallinea ai valori del server dopo un router.refresh() (post-salvataggio).
  useEffect(() => { setF(init) }, [init.basePct, init.premiumPct, init.minEur, init.months])
  // Al montaggio legge SEMPRE i valori vivi dal DB (bypassa la cache del router
  // di Next: navigando tra le schede potrebbe servire una copia vecchia).
  useEffect(() => {
    let alive = true
    fetch('/api/admin/affiliate/rates', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((live) => { if (alive && live && typeof live.basePct === 'number') setF(live) })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: Number(v) }))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('')
    const r = await fetch('/api/admin/affiliate/rates', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f),
    })
    setBusy(false)
    setMsg(r.ok ? t.saved : t.saveError)
    if (r.ok) router.refresh()
  }

  return (
    <form onSubmit={save} className="card p-5">
      <div className="font-semibold">{t.panelTitle}</div>
      <p className="mt-1 text-xs text-muted">{t.panelSub}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div><label className="label">{t.base}</label><input type="number" step="0.5" className="input mt-1" value={f.basePct} onChange={(e) => set('basePct')(e.target.value)} /></div>
        <div><label className="label">{t.premium}</label><input type="number" step="0.5" className="input mt-1" value={f.premiumPct} onChange={(e) => set('premiumPct')(e.target.value)} /></div>
        <div><label className="label">{t.minPayout}</label><input type="number" step="1" className="input mt-1" value={f.minEur} onChange={(e) => set('minEur')(e.target.value)} /></div>
        <div><label className="label">{t.months}</label><input type="number" step="1" className="input mt-1" value={f.months} onChange={(e) => set('months')(e.target.value)} /></div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="btn btn-primary" disabled={busy}>{busy ? t.saving : t.save}</button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </form>
  )
}

// ---- richieste di pagamento aperte ----
type Payout = {
  id: string; amount_cents: number; requested_at: string; holder_snapshot: string | null
  iban_snapshot: string | null; affiliate: { username: string; email: string } | null
}
export function PayoutsPanel({ payouts, t, dateLocale }: { payouts: Payout[]; t: Copy['payouts']; dateLocale: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState('')

  async function act(id: string, action: 'paid' | 'rejected') {
    if (action === 'rejected' && !confirm(t.confirmReject)) return
    setBusy(id)
    await fetch('/api/admin/affiliate/payout', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, action }),
    })
    setBusy(''); router.refresh()
  }

  if (!payouts.length) return <div className="card p-5 text-sm text-muted">{t.empty}</div>
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <th className="p-3">{t.colAffiliate}</th><th className="p-3">{t.colHolder}</th><th className="p-3">{t.colIban}</th>
          <th className="p-3 text-right">{t.colAmount}</th><th className="p-3">{t.colRequested}</th><th className="p-3 text-right">{t.colActions}</th>
        </tr></thead>
        <tbody>
          {payouts.map((p) => (
            <tr key={p.id} className="border-b border-line/60">
              <td className="p-3">{p.affiliate?.username}<div className="text-xs text-muted">{p.affiliate?.email}</div></td>
              <td className="p-3">{p.holder_snapshot || '—'}</td>
              <td className="p-3 font-mono text-xs">{p.iban_snapshot || '—'}</td>
              <td className="p-3 text-right font-semibold">{money(p.amount_cents)}</td>
              <td className="p-3">{new Date(p.requested_at).toLocaleDateString(dateLocale)}</td>
              <td className="p-3 text-right">
                <div className="inline-flex gap-1.5">
                  <button onClick={() => act(p.id, 'paid')} disabled={!!busy} className="btn btn-primary px-2.5 py-1 text-xs">{t.markPaid}</button>
                  <button onClick={() => act(p.id, 'rejected')} disabled={!!busy} className="btn btn-ghost px-2.5 py-1 text-xs">{t.reject}</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---- lista affiliati ----
type Row = {
  id: string; username: string; email: string; full_name: string | null; code: string
  status: string; clicks: number; overrideBps: number | null; conversions: number
  earnedCents: number; availableCents: number; paidCents: number
}
export function AffiliatesTable({ rows, t }: { rows: Row[]; t: Copy['list'] }) {
  if (!rows.length) return <div className="card p-5 text-sm text-muted">{t.empty}</div>
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <th className="p-3">{t.colAffiliate}</th><th className="p-3">{t.colCode}</th><th className="p-3 text-right">{t.colClicks}</th>
          <th className="p-3 text-right">{t.colCustomers}</th><th className="p-3 text-right">{t.colEarned}</th>
          <th className="p-3 text-right">{t.colAvailable}</th><th className="p-3">{t.colRate}</th><th className="p-3">{t.colStatus}</th>
        </tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line/60">
              <td className="p-3">
                <Link href={`/affiliazione/${r.id}`} className="font-semibold text-brand hover:underline">{r.username}</Link>
                <div className="text-xs text-muted">{r.full_name || r.email}</div>
              </td>
              <td className="p-3 font-mono text-xs">{r.code}</td>
              <td className="p-3 text-right">{r.clicks}</td>
              <td className="p-3 text-right">{r.conversions}</td>
              <td className="p-3 text-right">{money(r.earnedCents)}</td>
              <td className="p-3 text-right">{money(r.availableCents)}</td>
              <td className="p-3">{r.overrideBps != null ? <span className="font-semibold text-brand">{pct(r.overrideBps)}</span> : <span className="text-muted">{t.rateDefault}</span>}</td>
              <td className="p-3">{r.status === 'active' ? <span className="text-green-700">{t.statusActive}</span> : <span className="text-red-600">{t.statusSuspended}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
