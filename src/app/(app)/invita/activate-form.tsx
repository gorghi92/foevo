'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gift } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'

type Copy = Dictionary['app']['invita']

/** Attivazione del proprio link affiliato per un utente Foevo già loggato. */
export function ActivateForm({ t }: { t: Copy }) {
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
    if (!r.ok) return setError(j.error || t.error)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="card p-6">
        <div className="flex items-center gap-2 font-display text-xl font-extrabold">
          <Gift size={20} className="text-brand" /> {t.title}
        </div>
        <p className="mt-2 text-sm text-muted">
          {t.intro}
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <label className="label">{t.username}</label>
            <input className="input mt-1" value={username} onChange={(e) => setU(e.target.value)} autoComplete="username"
              placeholder={t.usernamePlaceholder} />
            <p className="mt-1 text-xs text-muted">{t.usernameHint}</p>
          </div>
          <div>
            <label className="label">{t.password}</label>
            <input className="input mt-1" type="password" value={password} onChange={(e) => setP(e.target.value)} autoComplete="new-password" />
            <p className="mt-1 text-xs text-muted">{t.passwordHint}</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? t.submitting : t.submit}</button>
        </form>
      </div>
    </div>
  )
}
