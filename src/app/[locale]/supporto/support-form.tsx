'use client'

import { useState } from 'react'
import type { Dictionary } from '@/lib/i18n'
import { Rich } from '@/lib/i18n/rich'

type FormCopy = Dictionary['support']['form']

export function SupportForm({ token, t, privacyHref }: { token: string; t: FormCopy; privacyHref: string }) {
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
        token,
      }),
    })
    const j = await r.json().catch(() => ({} as any))
    setBusy(false)
    if (!r.ok) return setError(j.error || t.genericError)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="card mt-4 p-6">
        <p className="font-semibold text-green-700">{t.sentTitle}</p>
        <p className="mt-1 text-sm text-muted">{t.sentBody}</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="card mt-4 space-y-3 p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">{t.name}</label>
          <input id="name" name="name" className="input mt-1" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">{t.email} <span className="text-brand">*</span></label>
          <input id="email" name="email" type="email" required className="input mt-1" autoComplete="email" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="topic">{t.topic}</label>
        <select id="topic" name="topic" className="input mt-1" defaultValue={t.topics[0]}>
          {t.topics.map((x) => <option key={x}>{x}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="message">{t.message} <span className="text-brand">*</span></label>
        <textarea
          id="message" name="message" required rows={6} className="input mt-1"
          placeholder={t.messagePlaceholder}
        />
      </div>
      {/* esca anti-bot: nascosta agli utenti, ignorata dagli screen reader */}
      <input
        type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
        className="hidden" defaultValue=""
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? t.submitting : t.submit}</button>
      <p className="text-xs text-muted">
        <Rich text={t.privacyNote.replace('PRIVACY_URL', privacyHref)} />
      </p>
    </form>
  )
}
