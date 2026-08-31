'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, ReceiptText } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'

type Billing = {
  firstName: string; lastName: string
  billingName: string; billingVat: string; billingCf: string
  billingAddress: string; billingCity: string; billingZip: string; billingCountry: string
}

type Copy = Dictionary['app']['profile']

function Note({ msg }: { msg: { t: 'ok' | 'err'; m: string } | null }) {
  if (!msg) return null
  return <p className={`mt-2 text-sm ${msg.t === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{msg.m}</p>
}

export function ProfileForm({ email, initial, t }: { email: string; initial: Billing; t: Copy }) {
  const router = useRouter()
  const [f, setF] = useState<Billing>(initial)
  const set = (k: keyof Billing, v: string) => setF((s) => ({ ...s, [k]: v }))

  const [newEmail, setNewEmail] = useState(email)
  const [emailStep, setEmailStep] = useState<'idle' | 'code'>('idle')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState('')
  const [m1, setM1] = useState<{ t: 'ok' | 'err'; m: string } | null>(null)
  const [m2, setM2] = useState<{ t: 'ok' | 'err'; m: string } | null>(null)
  const [m4, setM4] = useState<{ t: 'ok' | 'err'; m: string } | null>(null)

  async function saveName(e: React.FormEvent) {
    e.preventDefault(); setBusy('name'); setM1(null)
    const r = await fetch('/api/profile', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ firstName: f.firstName, lastName: f.lastName }) })
    setBusy('')
    if (!r.ok) return setM1({ t: 'err', m: (await r.json().catch(() => ({})))?.error || t.error })
    setM1({ t: 'ok', m: t.personal.saved }); router.refresh()
  }

  async function saveBilling(e: React.FormEvent) {
    e.preventDefault(); setBusy('billing'); setM4(null)
    const { firstName, lastName, ...billing } = f
    const r = await fetch('/api/profile', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(billing) })
    setBusy('')
    if (!r.ok) return setM4({ t: 'err', m: (await r.json().catch(() => ({})))?.error || t.error })
    setM4({ t: 'ok', m: t.billing.saved }); router.refresh()
  }

  async function requestEmailCode(e: React.FormEvent) {
    e.preventDefault(); setBusy('email'); setM2(null)
    const r = await fetch('/api/profile/email/request', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: newEmail }),
    })
    const j = await r.json().catch(() => ({} as any))
    setBusy('')
    if (!r.ok) return setM2({ t: 'err', m: j.error || t.error })
    setEmailStep('code'); setCode('')
    setM2({ t: 'ok', m: t.email.codeSent.replace('{email}', newEmail) })
  }

  async function confirmEmailCode(e: React.FormEvent) {
    e.preventDefault(); setBusy('email'); setM2(null)
    const r = await fetch('/api/profile/email/verify', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const j = await r.json().catch(() => ({} as any))
    setBusy('')
    if (!r.ok) return setM2({ t: 'err', m: j.error || t.error })
    setEmailStep('idle'); setCode('')
    setM2({ t: 'ok', m: t.email.updated })
    router.refresh()
  }

  const card = 'card p-5'
  const head = 'flex items-center gap-2 font-semibold'

  return (
    <div className="space-y-5">
      <form onSubmit={saveName} className={card}>
        <div className={head}><User size={18} className="text-brand" /> {t.personal.title}</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div><label className="label">{t.personal.firstName}</label><input className="input mt-1" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} autoComplete="given-name" /></div>
          <div><label className="label">{t.personal.lastName}</label><input className="input mt-1" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} autoComplete="family-name" /></div>
        </div>
        <Note msg={m1} />
        <button className="btn btn-primary mt-4" disabled={busy === 'name'}>{busy === 'name' ? t.personal.saving : t.personal.save}</button>
      </form>

      <form onSubmit={emailStep === 'idle' ? requestEmailCode : confirmEmailCode} className={card}>
        <div className={head}><Mail size={18} className="text-brand" /> {t.email.title}</div>
        <p className="mt-1 text-xs text-muted">
          {t.email.hint}
        </p>

        <label className="label mt-4 block">{t.email.label}</label>
        <input
          className="input mt-1"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          disabled={emailStep === 'code'}
          autoComplete="email"
        />

        {emailStep === 'code' && (
          <>
            <label className="label mt-4 block">{t.email.codeLabel}</label>
            <input
              className="input mt-1 text-center text-xl font-bold tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              /* niente maxLength: altrimenti un incolla con spazi verrebbe
                 troncato prima di essere ripulito */
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
            />
          </>
        )}

        <Note msg={m2} />

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn btn-primary" disabled={busy === 'email'}>
            {busy === 'email' ? t.email.wait : emailStep === 'idle' ? t.email.send : t.email.confirm}
          </button>
          {emailStep === 'code' && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setEmailStep('idle'); setCode(''); setM2(null); setNewEmail(email) }}
            >
              {t.email.cancel}
            </button>
          )}
        </div>
      </form>

      <form onSubmit={saveBilling} className={card}>
        <div className={head}><ReceiptText size={18} className="text-brand" /> {t.billing.title}</div>
        <p className="mt-1 text-xs text-muted">{t.billing.hint}</p>
        <div className="mt-4 space-y-3">
          <div><label className="label">{t.billing.name}</label><input className="input mt-1" value={f.billingName} onChange={(e) => set('billingName', e.target.value)} placeholder={t.billing.namePlaceholder} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t.billing.vat}</label><input className="input mt-1" value={f.billingVat} onChange={(e) => set('billingVat', e.target.value)} /></div>
            <div><label className="label">{t.billing.taxCode}</label><input className="input mt-1" value={f.billingCf} onChange={(e) => set('billingCf', e.target.value)} /></div>
          </div>
          <div><label className="label">{t.billing.address}</label><input className="input mt-1" value={f.billingAddress} onChange={(e) => set('billingAddress', e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">{t.billing.zip}</label><input className="input mt-1" value={f.billingZip} onChange={(e) => set('billingZip', e.target.value)} /></div>
            <div><label className="label">{t.billing.city}</label><input className="input mt-1" value={f.billingCity} onChange={(e) => set('billingCity', e.target.value)} /></div>
            <div><label className="label">{t.billing.country}</label><input className="input mt-1" value={f.billingCountry} onChange={(e) => set('billingCountry', e.target.value)} placeholder={t.billing.countryPlaceholder} /></div>
          </div>
        </div>
        <Note msg={m4} />
        <button className="btn btn-primary mt-4" disabled={busy === 'billing'}>{busy === 'billing' ? t.billing.saving : t.billing.save}</button>
      </form>
    </div>
  )
}
