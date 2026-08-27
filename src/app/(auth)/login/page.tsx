'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Caricamento…</div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
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
    if (!res.ok || !j.ok) return setError(j.error || 'Errore, riprova.')
    setSent(true)
  }

  if (sent) {
    return (
      <div>
        <h1 className="text-xl font-bold">Controlla la tua email</h1>
        <p className="mt-2 text-sm text-muted">Ti abbiamo inviato un <b>link di accesso</b> a <b>{email}</b>. Aprilo su questo dispositivo per entrare. Il link scade a breve.</p>
        <button onClick={() => { setSent(false); setError('') }} className="btn btn-ghost mt-6 w-full">Usa un’altra email</button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Accedi a Foevo</h1>
      <p className="mt-1 text-sm text-muted">Ti inviamo un link di accesso via email — niente password.</p>

      <form onSubmit={send} className="mt-6 space-y-3">
        <input className="input" type="email" placeholder="La tua email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoFocus />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {notFound && (
          <p className="text-sm text-amber-600">Nessun account con questa email. <Link href="/signup" className="font-semibold text-brand underline">Registrati</Link> per iniziare.</p>
        )}
        <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Invio…' : 'Invia link di accesso'}</button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Non hai un account? <Link href="/signup" className="font-semibold text-brand">Registrati</Link>
      </p>
      <p className="mt-3 text-center text-xs text-muted">
        Accedendo accetti la <Link href="/privacy" className="font-semibold text-brand">privacy policy</Link>. La sessione resta attiva finché non esci.
      </p>
    </div>
  )
}
