'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gift } from 'lucide-react'

/** Attivazione del proprio link affiliato per un utente Foevo già loggato. */
export function ActivateForm() {
  const router = useRouter()
  const [username, setU] = useState('')
  const [password, setP] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    const r = await fetch('/api/affiliate/activate', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }),
    })
    const j = await r.json().catch(() => ({} as any))
    setBusy(false)
    if (!r.ok) return setError(j.error || 'Attivazione non riuscita.')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="card p-6">
        <div className="flex items-center gap-2 font-display text-xl font-extrabold">
          <Gift size={20} className="text-brand" /> Invita e guadagna
        </div>
        <p className="mt-2 text-sm text-muted">
          Consiglia Foevo e guadagni una commissione su ogni persona che si abbona dal tuo link — per i primi 12 mesi
          del suo abbonamento. I pagamenti si richiedono via bonifico, dai 10 € in su.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <label className="label">Scegli uno username</label>
            <input className="input mt-1" value={username} onChange={(e) => setU(e.target.value)} autoComplete="username"
              placeholder="es. mario.rossi" />
            <p className="mt-1 text-xs text-muted">3–32 caratteri: lettere minuscole, numeri, . _ -</p>
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input mt-1" type="password" value={password} onChange={(e) => setP(e.target.value)} autoComplete="new-password" />
            <p className="mt-1 text-xs text-muted">Ti serve per accedere all’area affiliati anche da fuori Foevo. Almeno 8 caratteri.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Attivo…' : 'Attiva il mio link'}</button>
        </form>
      </div>
    </div>
  )
}
