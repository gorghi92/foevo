'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Dictionary } from '@/lib/i18n'

type Copy = Dictionary['app']['affiliazione']['detail']

const money = (c: number) => `€${((c || 0) / 100).toFixed(2)}`
const pct = (bps: number) => `${(bps / 100).toFixed(bps % 100 ? 1 : 0)}%`

export function OverrideControl({ id, current, t }: { id: string; current: number | null; t: Copy }) {
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
        <label className="label">{t.overrideLabel}</label>
        <input type="number" step="0.5" className="input mt-1 w-32" value={val} onChange={(e) => setVal(e.target.value)} placeholder={t.overridePlaceholder} />
      </div>
      <button onClick={() => save(val === '' ? null : Number(val))} disabled={busy} className="btn btn-primary px-3 py-2 text-sm">{t.overrideSave}</button>
      {current != null && <button onClick={() => { setVal(''); save(null) }} disabled={busy} className="btn btn-ghost px-3 py-2 text-sm">{t.overrideRemove}</button>}
    </div>
  )
}

export function StatusControl({ id, status, t }: { id: string; status: string; t: Copy }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function toggle() {
    const next = status === 'active' ? 'suspended' : 'active'
    if (next === 'suspended' && !confirm(t.confirmSuspend)) return
    setBusy(true)
    await fetch('/api/admin/affiliate/status', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status: next }),
    })
    setBusy(false); router.refresh()
  }
  return (
    <button onClick={toggle} disabled={busy} className={`btn px-3 py-2 text-sm ${status === 'active' ? 'btn-ghost text-red-600' : 'btn-primary'}`}>
      {status === 'active' ? t.suspend : t.reactivate}
    </button>
  )
}

type Referral = { id: string; referred_email: string | null; referred_user_id: string | null; status: string; converted_at: string | null; created_at: string }
export function ReferralsTable({ rows, t, dateLocale }: { rows: Referral[]; t: Copy; dateLocale: string }) {
  if (!rows.length) return <p className="text-sm text-muted">{t.referralsEmpty}</p>
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <th className="p-3">{t.refColEmail}</th><th className="p-3">{t.refColStatus}</th><th className="p-3">{t.refColConverted}</th><th className="p-3">{t.refColFirst}</th>
        </tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line/60">
              <td className="p-3">{r.referred_email || '—'}</td>
              <td className="p-3">{r.status === 'converted' ? <span className="font-semibold text-green-700">{t.refCustomer}</span> : <span className="text-muted">{t.refClickOnly}</span>}</td>
              <td className="p-3">{r.converted_at ? new Date(r.converted_at).toLocaleDateString(dateLocale) : '—'}</td>
              <td className="p-3">{new Date(r.created_at).toLocaleDateString(dateLocale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type Commission = { id: string; amount_cents: number; base_amount_cents: number; rate_bps: number; plan_slug: string | null; month_index: number; status: string; created_at: string }
export function CommissionsTable({ rows, t, dateLocale }: { rows: Commission[]; t: Copy; dateLocale: string }) {
  if (!rows.length) return <p className="text-sm text-muted">{t.commissionsEmpty}</p>
  const STATUS: Record<string, string> = t.comStatus
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <th className="p-3">{t.comColDate}</th><th className="p-3">{t.comColPlan}</th><th className="p-3">{t.comColMonth}</th>
          <th className="p-3 text-right">{t.comColBase}</th><th className="p-3 text-right">{t.comColRate}</th><th className="p-3 text-right">{t.comColCommission}</th><th className="p-3">{t.comColStatus}</th>
        </tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-b border-line/60">
              <td className="p-3">{new Date(c.created_at).toLocaleDateString(dateLocale)}</td>
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
