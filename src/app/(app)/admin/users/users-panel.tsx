'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, LogIn, Trash2, Search } from 'lucide-react'

type U = {
  id: string; email: string; created: string; lastSignIn: string | null; banned: boolean
  tier: string; source: string; analyses: number; monthAnalyses: number; cost: number; referredBy?: string | null
}
const d = (s?: string | null) => (s ? new Date(s).toLocaleDateString('it-IT') : '—')

export function UsersPanel({ users, meId }: { users: U[]; meId: string }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState('')
  const [email, setEmail] = useState('')
  const [tier, setTier] = useState('base')

  const filtered = useMemo(() => users.filter((u) => u.email.toLowerCase().includes(q.toLowerCase())), [users, q])

  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy('create')
    const r = await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, tier }) })
    setBusy('')
    if (!r.ok) return alert((await r.json().catch(() => ({})))?.error || 'Errore')
    setEmail(''); router.refresh()
  }
  async function del(u: U) {
    if (!confirm(`Eliminare ${u.email}? Azione irreversibile (rimuove anche le sue analisi).`)) return
    setBusy(u.id)
    const r = await fetch('/api/admin/users', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: u.id }) })
    setBusy('')
    if (!r.ok) return alert((await r.json().catch(() => ({})))?.error || 'Errore')
    router.refresh()
  }
  async function setPlan(u: U, t: string) {
    setBusy(u.id)
    const r = await fetch('/api/admin/entitlement', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: u.email, tier: t, monthly_quota: t === 'premium' ? 150 : 30, unlimited: false }) })
    setBusy('')
    if (!r.ok) return alert((await r.json().catch(() => ({})))?.error || 'Errore')
    router.refresh()
  }
  async function impersonate(u: U) {
    if (!confirm(`Aprire la sessione come ${u.email}? Potrai tornare al tuo account dal banner in alto.`)) return
    setBusy(u.id)
    const r = await fetch('/api/admin/impersonate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: u.id }) })
    if (!r.ok) { setBusy(''); return alert((await r.json().catch(() => ({})))?.error || 'Errore') }
    window.location.href = '/dashboard'
  }

  return (
    <div>
      <form onSubmit={create} className="card mb-4 flex flex-wrap items-end gap-2 p-4">
        <div className="flex-1" style={{ minWidth: 220 }}>
          <label className="label">Nuovo utente (email)</label>
          <input className="input mt-1" type="email" placeholder="email@dominio" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <select className="input" style={{ width: 130 }} value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="base">base</option><option value="premium">premium</option>
        </select>
        <button className="btn btn-primary" disabled={busy === 'create'}><UserPlus size={15} /> Crea</button>
      </form>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1" style={{ maxWidth: 360 }}>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Cerca per email…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="text-sm text-muted">{filtered.length} / {users.length}</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Utente</th><th className="p-3">Piano</th><th className="p-3">Da affiliato</th><th className="p-3 text-right">Analisi (mese/tot)</th><th className="p-3 text-right">Costo</th><th className="p-3">Registrato</th><th className="p-3">Ultimo accesso</th><th className="p-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-line/60">
                <td className="max-w-[220px] truncate p-3 font-medium">{u.email}{u.banned && <span className="ml-1 rounded bg-red-100 px-1 text-[10px] text-red-600">bloccato</span>}</td>
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
                    <button onClick={() => impersonate(u)} disabled={busy === u.id} title="Impersonifica" className="rounded-lg border border-line p-1.5 hover:bg-bg"><LogIn size={14} /></button>
                    {u.id !== meId && <button onClick={() => del(u)} disabled={busy === u.id} title="Elimina" className="rounded-lg border border-line p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted">Nessun utente.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
