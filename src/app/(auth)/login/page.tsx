'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Caricamento…</div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/dashboard'
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInEmail(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setError(error.message)
    router.push(next)
    router.refresh()
  }

  async function signInGoogle() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error) setError(error.message)
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Accedi</h1>
      <p className="mt-1 text-sm text-muted">Bentornato su Foveo.</p>

      <button onClick={signInGoogle} className="btn btn-ghost mt-6 w-full">Continua con Google</button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-line" /> oppure <div className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={signInEmail} className="space-y-3">
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Accesso…' : 'Accedi'}</button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Non hai un account? <Link href="/signup" className="font-semibold text-brand">Registrati</Link>
      </p>
    </div>
  )
}
