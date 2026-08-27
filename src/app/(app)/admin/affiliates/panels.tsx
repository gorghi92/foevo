'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Bell, Check, RotateCcw } from 'lucide-react'

const money = (c: number) => `€${((c || 0) / 100).toFixed(2)}`
const pct = (bps: number) => `${(bps / 100).toFixed(bps % 100 ? 1 : 0)}%`

// ---- avvisi (rimborsi/dispute) ----
type Alert = {
  id: string; kind: string; severity: string; title: string; body: string
  commission_id: string | null; whop_payment_id: string | null; amount_cents: number | null; created_at: string
}
export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
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
    if (!confirm('Stornare la commissione collegata? Verrà marcata come stornata e liberata da eventuali richieste di pagamento.')) return
    setBusy(alertId)
    const r = await fetch('/api/admin/affiliate/reverse', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ commissionId }) })
    const j = await r.json().catch(() => ({} as any))
    setBusy('')
    if (!r.ok) { setMsg((m) => ({ ...m, [alertId]: j.error || 'Storno non riuscito.' })); return }
    // stornata: segna anche l'avviso come letto
    await fetch('/api/admin/affiliate/alert', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: alertId }) })
    router.refresh()
  }

  return (
    <div className="card border-amber-300/70 bg-amber-50/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold text-amber-800">
          <Bell size={16} /> Avvisi da gestire ({alerts.length})
        </div>
        <button onClick={markAll} disabled={busy === 'all'} className="btn btn-ghost px-2.5 py-1 text-xs">Segna tutti letti</button>
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
                        <RotateCcw size={13} /> Storna commissione
                      </button>
                    )}
                    <button onClick={() => markRead(a.id)} disabled={!!busy} className="btn btn-ghost px-2.5 py-1 text-xs">
                      <Check size={13} /> Segna letto
                    </button>
                    <span className="ml-1 text-[11px] text-muted">{new Date(a.created_at).toLocaleString('it-IT')}</span>
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
export function RatesPanel({ init }: { init: { basePct: number; premiumPct: number; minEur: number; months: number } }) {
  const router = useRouter()
  const [f, setF] = useState(init)
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: Number(v) }))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('')
    const r = await fetch('/api/admin/affiliate/rates', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f),
    })
    setBusy(false)
    setMsg(r.ok ? 'Salvato.' : 'Errore nel salvataggio.')
    if (r.ok) router.refresh()
  }

  return (
    <form onSubmit={save} className="card p-5">
      <div className="font-semibold">Percentuali e regole</div>
      <p className="mt-1 text-xs text-muted">Valgono come default; puoi impostare un override per singolo affiliato dalla sua scheda.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div><label className="label">Base (%)</label><input type="number" step="0.5" className="input mt-1" value={f.basePct} onChange={(e) => set('basePct')(e.target.value)} /></div>
        <div><label className="label">Premium (%)</label><input type="number" step="0.5" className="input mt-1" value={f.premiumPct} onChange={(e) => set('premiumPct')(e.target.value)} /></div>
        <div><label className="label">Minimo pagamento (€)</label><input type="number" step="1" className="input mt-1" value={f.minEur} onChange={(e) => set('minEur')(e.target.value)} /></div>
        <div><label className="label">Durata (mesi)</label><input type="number" step="1" className="input mt-1" value={f.months} onChange={(e) => set('months')(e.target.value)} /></div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Salvo…' : 'Salva regole'}</button>
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
export function PayoutsPanel({ payouts }: { payouts: Payout[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState('')

  async function act(id: string, action: 'paid' | 'rejected') {
    if (action === 'rejected' && !confirm('Rifiutare questa richiesta? Le commissioni tornano disponibili.')) return
    setBusy(id)
    await fetch('/api/admin/affiliate/payout', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, action }),
    })
    setBusy(''); router.refresh()
  }

  if (!payouts.length) return <div className="card p-5 text-sm text-muted">Nessuna richiesta di pagamento in attesa.</div>
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <th className="p-3">Affiliato</th><th className="p-3">Intestatario</th><th className="p-3">IBAN</th>
          <th className="p-3 text-right">Importo</th><th className="p-3">Richiesta</th><th className="p-3 text-right">Azioni</th>
        </tr></thead>
        <tbody>
          {payouts.map((p) => (
            <tr key={p.id} className="border-b border-line/60">
              <td className="p-3">{p.affiliate?.username}<div className="text-xs text-muted">{p.affiliate?.email}</div></td>
              <td className="p-3">{p.holder_snapshot || '—'}</td>
              <td className="p-3 font-mono text-xs">{p.iban_snapshot || '—'}</td>
              <td className="p-3 text-right font-semibold">{money(p.amount_cents)}</td>
              <td className="p-3">{new Date(p.requested_at).toLocaleDateString('it-IT')}</td>
              <td className="p-3 text-right">
                <div className="inline-flex gap-1.5">
                  <button onClick={() => act(p.id, 'paid')} disabled={!!busy} className="btn btn-primary px-2.5 py-1 text-xs">Segna pagata</button>
                  <button onClick={() => act(p.id, 'rejected')} disabled={!!busy} className="btn btn-ghost px-2.5 py-1 text-xs">Rifiuta</button>
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
export function AffiliatesTable({ rows }: { rows: Row[] }) {
  if (!rows.length) return <div className="card p-5 text-sm text-muted">Nessun affiliato registrato.</div>
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <th className="p-3">Affiliato</th><th className="p-3">Codice</th><th className="p-3 text-right">Click</th>
          <th className="p-3 text-right">Clienti</th><th className="p-3 text-right">Guadagno</th>
          <th className="p-3 text-right">Disponibile</th><th className="p-3">%</th><th className="p-3">Stato</th>
        </tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line/60">
              <td className="p-3">
                <Link href={`/admin/affiliates/${r.id}`} className="font-semibold text-brand hover:underline">{r.username}</Link>
                <div className="text-xs text-muted">{r.full_name || r.email}</div>
              </td>
              <td className="p-3 font-mono text-xs">{r.code}</td>
              <td className="p-3 text-right">{r.clicks}</td>
              <td className="p-3 text-right">{r.conversions}</td>
              <td className="p-3 text-right">{money(r.earnedCents)}</td>
              <td className="p-3 text-right">{money(r.availableCents)}</td>
              <td className="p-3">{r.overrideBps != null ? <span className="font-semibold text-brand">{pct(r.overrideBps)}</span> : <span className="text-muted">default</span>}</td>
              <td className="p-3">{r.status === 'active' ? <span className="text-green-700">attivo</span> : <span className="text-red-600">sospeso</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
