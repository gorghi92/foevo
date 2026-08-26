'use client'

import { useState } from 'react'
import { Copy, Trash2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Row = { id: string; name: string | null; prefix: string; created_at: string; revoked_at: string | null; last_used_at: string | null }

export default function ApiKeys({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial)
  const [name, setName] = useState('')
  const [fresh, setFresh] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const supabase = createClient()

  async function create() {
    setBusy(true); setFresh(null)
    const res = await fetch('/api/keys', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name }) })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) return alert(data.error || 'Errore')
    setFresh(data.key)
    setRows((r) => [data.row, ...r])
    setName('')
  }

  async function revoke(id: string) {
    if (!confirm('Revocare questa chiave? L’estensione che la usa smetterà di funzionare.')) return
    setRows((r) => r.map((x) => (x.id === id ? { ...x, revoked_at: new Date().toISOString() } : x)))
    await supabase.from('api_keys').update({ revoked_at: new Date().toISOString() }).eq('id', id)
  }

  return (
    <div className="mt-6 space-y-5">
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1" style={{ minWidth: 200 }}>
          <label className="label">Nome (opzionale)</label>
          <input className="input mt-1" placeholder="es. Chrome desktop" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button onClick={create} disabled={busy} className="btn btn-primary"><Plus size={15} /> Crea chiave</button>
      </div>

      {fresh && (
        <div className="card border-brand p-4" style={{ borderColor: 'rgb(var(--brand))' }}>
          <p className="text-sm font-semibold">Copia la chiave adesso — non sarà più mostrata:</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg bg-bg px-3 py-2 font-mono text-sm">{fresh}</code>
            <button className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(fresh)}><Copy size={15} /></button>
          </div>
        </div>
      )}

      <div className="card divide-y divide-line">
        {rows.length === 0 && <p className="p-5 text-sm text-muted">Nessuna chiave.</p>}
        {rows.map((k) => (
          <div key={k.id} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{k.name || 'Chiave'} {k.revoked_at && <span className="ml-1 text-xs text-red-500">(revocata)</span>}</div>
              <div className="font-mono text-xs text-muted">{k.prefix}…</div>
            </div>
            {!k.revoked_at && <button onClick={() => revoke(k.id)} className="text-muted hover:text-red-500" title="Revoca"><Trash2 size={16} /></button>}
          </div>
        ))}
      </div>
    </div>
  )
}
