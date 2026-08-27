'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const supabase = createClient()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Il pacchetto scelto dalla landing arriva come ?plan=premium|base|test
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('plan')
    if (p === 'premium' || p === 'base' || p === 'test') setPlan(p)
  }, [])

  const planLabel = plan === 'premium' ? 'Premium' : plan === 'test' ? 'Test 1€' : 'Base'

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    // Dopo l'accesso: se ha scelto un pacchetto va dritto al checkout, altrimenti alla dashboard.
    const next = plan ? `/billing?checkout=${plan}` : '/dashboard'

    // Registrazione istantanea (niente link email): l'account viene creato e loggato lato server.
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, firstName, lastName }),
    })
    const j = await res.json().catch(() => ({} as any))

    if (res.ok && j.ok) {
      // Sessione già attiva → prosegui in modo sequenziale.
      window.location.assign(next)
      return
    }

    if (j.exists) {
      // Email già registrata → per sicurezza verifichiamo la proprietà con un link.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      })
      setLoading(false)
      if (error) return setError(error.message)
      setSent(true)
      return
    }

    setLoading(false)
    setError(j.error || 'Errore nella registrazione')
  }

  if (sent) {
    return (
      <div>
        <h1 className="text-xl font-bold">Hai già un account</h1>
        <p className="mt-2 text-sm text-muted">Questa email è già registrata. Ti abbiamo inviato un <b>link di accesso</b> a <b>{email}</b>: aprilo per entrare{plan ? ' e completare il pagamento' : ''}.</p>
        <Link href="/login" className="btn btn-ghost mt-6 w-full">Torna all’accesso</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Crea il tuo account</h1>
      <p className="mt-1 text-sm text-muted">
        {plan ? <>Stai attivando il piano <b className="text-brand">{planLabel}</b>. </> : null}
        Niente password: crei l’account e prosegui subito.
      </p>

      <form onSubmit={send} className="mt-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Nome" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" autoFocus />
          <input className="input" placeholder="Cognome" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" />
        </div>
        <input className="input" type="email" placeholder="La tua email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Attendi…' : plan ? 'Continua verso il pagamento' : 'Crea account'}</button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Hai già un account? <Link href="/login" className="font-semibold text-brand">Accedi</Link>
      </p>
    </div>
  )
}
