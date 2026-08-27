'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
    setLoading(false)
    if (error) return setError(error.message)
    setSent(true)
  }

  if (sent) {
    return (
      <div>
        <h1 className="text-xl font-bold">Controlla la tua email</h1>
        <p className="mt-2 text-sm text-muted">Ti abbiamo inviato un <b>link di accesso</b> a <b>{email}</b>. Aprilo per creare l’account ed entrare.</p>
        <Link href="/login" className="btn btn-ghost mt-6 w-full">Torna all’accesso</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Crea il tuo account</h1>
      <p className="mt-1 text-sm text-muted">Inizia gratis con Foevo — niente password, solo la tua email.</p>

      <form onSubmit={send} className="mt-6 space-y-3">
        <input className="input" type="email" placeholder="La tua email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoFocus />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Invio…' : 'Registrati con email'}</button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Hai già un account? <Link href="/login" className="font-semibold text-brand">Accedi</Link>
      </p>
    </div>
  )
}
