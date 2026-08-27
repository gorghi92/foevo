'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Trash2, ExternalLink } from 'lucide-react'

type Row = { id: string; url: string | null; title: string | null; status: string; tier: string | null; email: string; created: string; score: number | null; cost: number }
const d = (s: string) => new Date(s).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
const sc = (v: number | null) => (v == null ? '#999' : v >= 70 ? '#16a34a' : v >= 45 ? '#d97706' : '#dc2626')

export function AnalysesAdmin({ rows, emails }: { rows: Row[]; emails: string[] }) {
  const router = useRouter()
  const [user, setUser] = useState('')
  const [period, setPeriod] = useState('all')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState('')

  const filtered = useMemo(() => {
    const now = Date.now()
    const cutoff = period === 'today' ? now - 86400000 : period === '7d' ? now - 7 * 86400000 : period === '30d' ? now - 30 * 86400000 : 0
    const ql = q.toLowerCase()
    return rows.filter((r) =>
      (!user || r.email === user) &&
      (!cutoff || new Date(r.created).getTime() >= cutoff) &&
      (!ql || (r.url || '').toLowerCase().includes(ql) || (r.title || '').toLowerCase().includes(ql)),
    )
  }, [rows, user, period, q])

  const totalCost = filtered.reduce((s, r) => s + r.cost, 0)

  async function del(r: Row) {
    if (!confirm('Eliminare questa analisi?')) return
    setBusy(r.id)
    const res = await fetch('/api/admin/analysis', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: r.id }) })
    setBusy('')
    if (!res.ok) return alert((await res.json().catch(() => ({})))?.error || 'Errore')
    router.refresh()
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select className="input" style={{ width: 220 }} value={user} onChange={(e) => setUser(e.target.value)}>
          <option value="">Tutti gli utenti</option>
          {emails.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="input" style={{ width: 150 }} value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="all">Sempre</option><option value="today">Oggi</option><option value="7d">Ultimi 7 giorni</option><option value="30d">Ultimi 30 giorni</option>
        </select>
        <div className="relative flex-1" style={{ minWidth: 200, maxWidth: 320 }}>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Cerca url o titolo…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="ml-auto text-sm text-muted">{filtered.length} analisi · costo ${totalCost.toFixed(4)}</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Data</th><th className="p-3">Utente</th><th className="p-3">Pagina</th><th className="p-3">Tier</th><th className="p-3">Stato</th><th className="p-3 text-right">Conv.</th><th className="p-3 text-right">Costo</th><th className="p-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line/60">
                <td className="whitespace-nowrap p-3 text-xs">{d(r.created)}</td>
                <td className="max-w-[180px] truncate p-3">{r.email}</td>
                <td className="max-w-[240px] truncate p-3">{r.title || r.url || '—'}</td>
                <td className="p-3 text-xs">{r.tier || '—'}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3 text-right font-semibold" style={{ color: sc(r.score) }}>{r.score ?? '—'}</td>
                <td className="p-3 text-right text-muted">${r.cost.toFixed(4)}</td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/analyses/${r.id}`} title="Apri" className="rounded-lg border border-line p-1.5 hover:bg-bg"><ExternalLink size={14} /></Link>
                    <button onClick={() => del(r)} disabled={busy === r.id} title="Elimina" className="rounded-lg border border-line p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted">Nessuna analisi con questi filtri.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
