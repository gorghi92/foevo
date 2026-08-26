'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function signUp(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
    setLoading(false)
    if (error) return setError(error.message)
    if (data.session) { router.push('/dashboard'); router.refresh() }
    else setDone(true) // email confirmation required
  }

  async function google() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
    if (error) setError(error.message)
  }

  if (done) {
    return (
      <div>
        <h1 className="text-xl font-bold">Controlla la tua email</h1>
        <p className="mt-2 text-sm text-muted">Ti abbiamo inviato un link per confermare l’account. Aprilo per continuare.</p>
        <Link href="/login" className="btn btn-ghost mt-6 w-full">Torna all’accesso</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Crea il tuo account</h1>
      <p className="mt-1 text-sm text-muted">Inizia gratis con Foveo.</p>

      <button onClick={google} className="btn btn-ghost mt-6 w-full">Continua con Google</button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-line" /> oppure <div className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={signUp} className="space-y-3">
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <input className="input" type="password" placeholder="Password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Creazione…' : 'Registrati'}</button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Hai già un account? <Link href="/login" className="font-semibold text-brand">Accedi</Link>
      </p>
    </div>
  )
}
