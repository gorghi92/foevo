'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function Field(props: {
  label: string; name: string; type?: string; value: string; onChange: (v: string) => void
  placeholder?: string; autoComplete?: string; hint?: string
}) {
  return (
    <div>
      <label className="label" htmlFor={props.name}>{props.label}</label>
      <input
        id={props.name} name={props.name} type={props.type || 'text'} className="input mt-1"
        value={props.value} onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder} autoComplete={props.autoComplete}
      />
      {props.hint && <p className="mt-1 text-xs text-muted">{props.hint}</p>}
    </div>
  )
}

export function LoginForm() {
  const router = useRouter()
  const [username, setU] = useState('')
  const [password, setP] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    const r = await fetch('/api/affiliate/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const j = await r.json().catch(() => ({} as any))
    setBusy(false)
    if (!r.ok) return setError(j.error || 'Accesso non riuscito.')
    router.push('/affiliati')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-3 p-6">
      <h1 className="font-display text-2xl font-extrabold">Accedi</h1>
      <p className="text-sm text-muted">Area affiliati Foevo.</p>
      <Field label="Username" name="username" value={username} onChange={setU} autoComplete="username" />
      <Field label="Password" name="password" type="password" value={password} onChange={setP} autoComplete="current-password" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Attendi…' : 'Accedi'}</button>
      <p className="text-center text-sm text-muted">
        Non sei ancora affiliato? <Link href="/affiliati/registrati" className="font-semibold text-brand">Registrati</Link>
      </p>
    </form>
  )
}

export function RegisterForm() {
  const router = useRouter()
  const [f, setF] = useState({ fullName: '', email: '', username: '', password: '' })
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    const r = await fetch('/api/affiliate/register', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f),
    })
    const j = await r.json().catch(() => ({} as any))
    setBusy(false)
    if (!r.ok) return setError(j.error || 'Registrazione non riuscita.')
    router.push('/affiliati')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-3 p-6">
      <h1 className="font-display text-2xl font-extrabold">Diventa affiliato</h1>
      <p className="text-sm text-muted">Promuovi Foevo e guadagna una commissione su ogni cliente che porti.</p>
      <Field label="Nome e cognome" name="fullName" value={f.fullName} onChange={set('fullName')} autoComplete="name" />
      <Field label="Email" name="email" type="email" value={f.email} onChange={set('email')} autoComplete="email"
        hint="La usiamo per avvisarti sui pagamenti. Non è pubblica." />
      <Field label="Username" name="username" value={f.username} onChange={set('username')} autoComplete="username"
        hint="3–32 caratteri: lettere minuscole, numeri, . _ -" />
      <Field label="Password" name="password" type="password" value={f.password} onChange={set('password')} autoComplete="new-password"
        hint="Almeno 8 caratteri." />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Attendi…' : 'Crea account affiliato'}</button>
      <p className="text-center text-sm text-muted">
        Hai già un account? <Link href="/affiliati/accedi" className="font-semibold text-brand">Accedi</Link>
      </p>
    </form>
  )
}
