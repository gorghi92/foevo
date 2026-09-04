'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Dictionary } from '@/lib/i18n'

type Copy = Dictionary['affiliates']['auth']

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

export function LoginForm({ t, home, registerHref }: { t: Copy; home: string; registerHref: string }) {
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
    if (!r.ok) return setError(j.error || t.loginError)
    router.push(home)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-3 p-6">
      <h1 className="font-display text-2xl font-extrabold">{t.loginTitle}</h1>
      <p className="text-sm text-muted">{t.loginSub}</p>
      <Field label={t.username} name="username" value={username} onChange={setU} autoComplete="username" />
      <Field label={t.password} name="password" type="password" value={password} onChange={setP} autoComplete="current-password" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? t.wait : t.login}</button>
      <p className="text-center text-sm text-muted">
        {t.noAccount} <Link href={registerHref} className="font-semibold text-brand">{t.goRegister}</Link>
      </p>
    </form>
  )
}

export function RegisterForm({ t, home, loginHref }: { t: Copy; home: string; loginHref: string }) {
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
    if (!r.ok) return setError(j.error || t.registerError)
    router.push(home)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-3 p-6">
      <h1 className="font-display text-2xl font-extrabold">{t.registerTitle}</h1>
      <p className="text-sm text-muted">{t.registerSub}</p>
      <Field label={t.fullName} name="fullName" value={f.fullName} onChange={set('fullName')} autoComplete="name" />
      <Field label={t.email} name="email" type="email" value={f.email} onChange={set('email')} autoComplete="email"
        hint={t.emailHint} />
      <Field label={t.username} name="username" value={f.username} onChange={set('username')} autoComplete="username"
        hint={t.usernameHint} />
      <Field label={t.password} name="password" type="password" value={f.password} onChange={set('password')} autoComplete="new-password"
        hint={t.passwordHint} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? t.wait : t.register}</button>
      <p className="text-center text-sm text-muted">
        {t.hasAccount} <Link href={loginHref} className="font-semibold text-brand">{t.goLogin}</Link>
      </p>
    </form>
  )
}
