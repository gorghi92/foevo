'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Dictionary } from '@/lib/i18n'
import { Rich } from '@/lib/i18n/rich'

type Copy = Dictionary['app']['auth']['login']

export function LoginForm({ t }: { t: Copy }) {
  const params = useSearchParams()
  const next = params.get('next') || '/dashboard'

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setNotFound(false); setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, next }),
    })
    const j = await res.json().catch(() => ({} as any))
    setLoading(false)
    if (j.notfound) return setNotFound(true)
    if (!res.ok || !j.ok) return setError(j.error || t.error)
    setSent(true)
  }

  if (sent) {
    return (
      <div>
        <h1 className="text-xl font-bold">{t.sent.title}</h1>
        <p className="mt-2 text-sm text-muted">
          <Rich text={t.sent.bodyPre} strongClass="" /><b>{email}</b><Rich text={t.sent.bodyPost} strongClass="" />
        </p>
        <button onClick={() => { setSent(false); setError('') }} className="btn btn-ghost mt-6 w-full">{t.sent.otherEmail}</button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.subtitle}</p>

      <form onSubmit={send} className="mt-6 space-y-3">
        <input className="input" type="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoFocus />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {notFound && (
          <p className="text-sm text-amber-600"><Rich text={t.notFound} /></p>
        )}
        <button className="btn btn-primary w-full" disabled={loading}>{loading ? t.sending : t.submit}</button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        <Rich text={t.noAccount} />
      </p>
      <p className="mt-3 text-center text-xs text-muted">
        <Rich text={t.terms} />
      </p>
    </div>
  )
}
