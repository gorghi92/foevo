'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, LogIn, Trash2, Search } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'

type U = {
  id: string; email: string; created: string; lastSignIn: string | null; banned: boolean
  tier: string; source: string; analyses: number; monthAnalyses: number; cost: number; referredBy?: string | null
}
type Copy = Dictionary['app']['admin']['users']

export function UsersPanel({ users, meId, t, dateLocale }: { users: U[]; meId: string; t: Copy; dateLocale: string }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState('')
  const [email, setEmail] = useState('')
  const [tier, setTier] = useState('base')

  const d = (s?: string | null) => (s ? new Date(s).toLocaleDateString(dateLocale) : '—')
  const filtered = useMemo(() => users.filter((u) => u.email.toLowerCase().includes(q.toLowerCase())), [users, q])

  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy('create')
    const r = await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, tier }) })
    setBusy('')
    if (!r.ok) return alert((await r.json().catch(() => ({})))?.error || t.error)
    setEmail(''); router.refresh()
  }
  async function del(u: U) {
    if (!confirm(t.confirmDelete.replace('{email}', u.email))) return
    setBusy(u.id)
    const r = await fetch('/api/admin/users', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: u.id }) })
    setBusy('')
    if (!r.ok) return alert((await r.json().catch(() => ({})))?.error || t.error)
    router.refresh()
  }
  async function setPlan(u: U, tierValue: string) {
    setBusy(u.id)
    const r = await fetch('/api/admin/entitlement', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: u.email, tier: tierValue, monthly_quota: tierValue === 'premium' ? 150 : 30, unlimited: false }) })
    setBusy('')
    if (!r.ok) return alert((await r.json().catch(() => ({})))?.error || t.error)
    router.refresh()
  }
  async function impersonate(u: U) {
    if (!confirm(t.confirmImpersonate.replace('{email}', u.email))) return
    setBusy(u.id)
    const r = await fetch('/api/admin/impersonate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: u.id }) })
    if (!r.ok) { setBusy(''); return alert((await r.json().catch(() => ({})))?.error || t.error) }
    window.location.href = '/dashboard'
  }

  return (
    <div>
      <form onSubmit={create} className="card mb-4 flex flex-wrap items-end gap-2 p-4">
        <div className="flex-1" style={{ minWidth: 220 }}>
          <label className="label">{t.newUser}</label>
          <input className="input mt-1" type="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <select className="input" style={{ width: 130 }} value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="base">base</option><option value="premium">premium</option>
        </select>
        <button className="btn btn-primary" disabled={busy === 'create'}><UserPlus size={15} /> {t.create}</button>
      </form>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1" style={{ maxWidth: 360 }}>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder={t.searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="text-sm text-muted">{filtered.length} / {users.length}</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-3">{t.colUser}</th><th className="p-3">{t.colPlan}</th><th className="p-3">{t.colReferredBy}</th><th className="p-3 text-right">{t.colAnalyses}</th><th className="p-3 text-right">{t.colCost}</th><th className="p-3">{t.colSignedUp}</th><th className="p-3">{t.colLastSignIn}</th><th className="p-3 text-right">{t.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-line/60">
                <td className="max-w-[220px] truncate p-3 font-medium">{u.email}{u.banned && <span className="ml-1 rounded bg-red-100 px-1 text-[10px] text-red-600">{t.banned}</span>}</td>
                <td className="p-3">
                  <select className="rounded border border-line bg-transparent px-1.5 py-1 text-xs" value={u.tier === 'nessuno' ? 'base' : u.tier} onChange={(e) => setPlan(u, e.target.value)} disabled={busy === u.id}>
                    <option value="base">base</option><option value="premium">premium</option>
                  </select>
                </td>
                <td className="p-3">{u.referredBy ? <span className="rounded bg-brand-soft px-1.5 py-0.5 text-xs font-semibold text-brand">{u.referredBy}</span> : <span className="text-xs text-muted">—</span>}</td>
                <td className="p-3 text-right">{u.monthAnalyses} / {u.analyses}</td>
                <td className="p-3 text-right text-muted">${u.cost.toFixed(4)}</td>
                <td className="p-3">{d(u.created)}</td>
                <td className="p-3">{d(u.lastSignIn)}</td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => impersonate(u)} disabled={busy === u.id} title={t.impersonate} className="rounded-lg border border-line p-1.5 hover:bg-bg"><LogIn size={14} /></button>
                    {u.id !== meId && <button onClick={() => del(u)} disabled={busy === u.id} title={t.delete} className="rounded-lg border border-line p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted">{t.empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
