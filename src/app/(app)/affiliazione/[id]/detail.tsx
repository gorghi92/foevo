'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const money = (c: number) => `€${((c || 0) / 100).toFixed(2)}`
const pct = (bps: number) => `${(bps / 100).toFixed(bps % 100 ? 1 : 0)}%`

export function OverrideControl({ id, current }: { id: string; current: number | null }) {
  const router = useRouter()
  const [val, setVal] = useState(current != null ? String(current / 100) : '')
  const [busy, setBusy] = useState(false)

  async function save(pctVal: number | null) {
    setBusy(true)
    await fetch('/api/admin/affiliate/override', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, pct: pctVal }),
    })
    setBusy(false); router.refresh()
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="label">Override percentuale</label>
        <input type="number" step="0.5" className="input mt-1 w-32" value={val} onChange={(e) => setVal(e.target.value)} placeholder="default" />
      </div>
      <button onClick={() => save(val === '' ? null : Number(val))} disabled={busy} className="btn btn-primary px-3 py-2 text-sm">Salva</button>
      {current != null && <button onClick={() => { setVal(''); save(null) }} disabled={busy} className="btn btn-ghost px-3 py-2 text-sm">Rimuovi override</button>}
    </div>
  )
}

export function StatusControl({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function toggle() {
    const next = status === 'active' ? 'suspended' : 'active'
    if (next === 'suspended' && !confirm('Sospendere questo affiliato? Le sue sessioni verranno chiuse.')) return
    setBusy(true)
    await fetch('/api/admin/affiliate/status', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status: next }),
    })
    setBusy(false); router.refresh()
  }
  return (
    <button onClick={toggle} disabled={busy} className={`btn px-3 py-2 text-sm ${status === 'active' ? 'btn-ghost text-red-600' : 'btn-primary'}`}>
      {status === 'active' ? 'Sospendi' : 'Riattiva'}
    </button>
  )
}

type Referral = { id: string; referred_email: string | null; referred_user_id: string | null; status: string; converted_at: string | null; created_at: string }
export function ReferralsTable({ rows }: { rows: Referral[] }) {
  if (!rows.length) return <p className="text-sm text-muted">Ancora nessun cliente portato.</p>
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <th className="p-3">Email</th><th className="p-3">Stato</th><th className="p-3">Convertito</th><th className="p-3">Primo contatto</th>
        </tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line/60">
              <td className="p-3">{r.referred_email || '—'}</td>
              <td className="p-3">{r.status === 'converted' ? <span className="font-semibold text-green-700">cliente</span> : <span className="text-muted">solo click</span>}</td>
              <td className="p-3">{r.converted_at ? new Date(r.converted_at).toLocaleDateString('it-IT') : '—'}</td>
              <td className="p-3">{new Date(r.created_at).toLocaleDateString('it-IT')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type Commission = { id: string; amount_cents: number; base_amount_cents: number; rate_bps: number; plan_slug: string | null; month_index: number; status: string; created_at: string }
export function CommissionsTable({ rows }: { rows: Commission[] }) {
  if (!rows.length) return <p className="text-sm text-muted">Nessuna commissione.</p>
  const STATUS: Record<string, string> = { available: 'disponibile', paid: 'pagata', reversed: 'stornata' }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <th className="p-3">Data</th><th className="p-3">Piano</th><th className="p-3">Mese</th>
          <th className="p-3 text-right">Base</th><th className="p-3 text-right">%</th><th className="p-3 text-right">Commissione</th><th className="p-3">Stato</th>
        </tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-b border-line/60">
              <td className="p-3">{new Date(c.created_at).toLocaleDateString('it-IT')}</td>
              <td className="p-3 capitalize">{c.plan_slug || '—'}</td>
              <td className="p-3">{c.month_index}/12</td>
              <td className="p-3 text-right">{money(c.base_amount_cents)}</td>
              <td className="p-3 text-right">{pct(c.rate_bps)}</td>
              <td className="p-3 text-right font-semibold">{money(c.amount_cents)}</td>
              <td className="p-3">{STATUS[c.status] || c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
