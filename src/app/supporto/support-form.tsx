'use client'

import { useState } from 'react'

const TOPICS = [
  'Estensione Chrome',
  'Analisi e report',
  'Account e accesso',
  'Pagamenti e fatture',
  'Altro',
]

export function SupportForm() {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true); setError('')
    const f = new FormData(e.currentTarget)
    const r = await fetch('/api/support', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: f.get('name'), email: f.get('email'),
        topic: f.get('topic'), message: f.get('message'),
        website: f.get('website'), // esca anti-bot
      }),
    })
    const j = await r.json().catch(() => ({} as any))
    setBusy(false)
    if (!r.ok) return setError(j.error || 'Invio non riuscito. Riprova tra poco.')
    setSent(true)
  }

  if (sent) {
    return (
      <div className="card mt-4 p-6">
        <p className="font-semibold text-green-700">Messaggio inviato.</p>
        <p className="mt-1 text-sm text-muted">
          Ti rispondiamo all’indirizzo che hai indicato, di solito entro un giorno lavorativo.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="card mt-4 space-y-3 p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Nome</label>
          <input id="name" name="name" className="input mt-1" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email <span className="text-brand">*</span></label>
          <input id="email" name="email" type="email" required className="input mt-1" autoComplete="email" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="topic">Argomento</label>
        <select id="topic" name="topic" className="input mt-1" defaultValue={TOPICS[0]}>
          {TOPICS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="message">Messaggio <span className="text-brand">*</span></label>
        <textarea
          id="message" name="message" required rows={6} className="input mt-1"
          placeholder="Cosa stavi facendo, cosa ti aspettavi e cosa è successo. Se c'è un messaggio d'errore, incollalo qui."
        />
      </div>
      {/* esca anti-bot: nascosta agli utenti, ignorata dagli screen reader */}
      <input
        type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
        className="hidden" defaultValue=""
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Invio…' : 'Invia messaggio'}</button>
      <p className="text-xs text-muted">
        Usiamo il tuo indirizzo solo per risponderti. Vedi la <a href="/privacy" className="font-semibold text-brand">privacy policy</a>.
      </p>
    </form>
  )
}
