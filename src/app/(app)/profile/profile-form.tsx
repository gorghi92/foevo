'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, ReceiptText } from 'lucide-react'

type Billing = {
  firstName: string; lastName: string
  billingName: string; billingVat: string; billingCf: string
  billingAddress: string; billingCity: string; billingZip: string; billingCountry: string
}

function Note({ msg }: { msg: { t: 'ok' | 'err'; m: string } | null }) {
  if (!msg) return null
  return <p className={`mt-2 text-sm ${msg.t === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{msg.m}</p>
}

export function ProfileForm({ email, initial }: { email: string; initial: Billing }) {
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
    if (!r.ok) return setM1({ t: 'err', m: (await r.json().catch(() => ({})))?.error || 'Errore' })
    setM1({ t: 'ok', m: 'Dati aggiornati.' }); router.refresh()
  }

  async function saveBilling(e: React.FormEvent) {
    e.preventDefault(); setBusy('billing'); setM4(null)
    const { firstName, lastName, ...billing } = f
    const r = await fetch('/api/profile', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(billing) })
    setBusy('')
    if (!r.ok) return setM4({ t: 'err', m: (await r.json().catch(() => ({})))?.error || 'Errore' })
    setM4({ t: 'ok', m: 'Dati di fatturazione salvati.' }); router.refresh()
  }

  async function requestEmailCode(e: React.FormEvent) {
    e.preventDefault(); setBusy('email'); setM2(null)
    const r = await fetch('/api/profile/email/request', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: newEmail }),
    })
    const j = await r.json().catch(() => ({} as any))
    setBusy('')
    if (!r.ok) return setM2({ t: 'err', m: j.error || 'Errore' })
    setEmailStep('code'); setCode('')
    setM2({ t: 'ok', m: `Ti abbiamo inviato un codice a ${newEmail}. Inseriscilo qui sotto per confermare.` })
  }

  async function confirmEmailCode(e: React.FormEvent) {
    e.preventDefault(); setBusy('email'); setM2(null)
    const r = await fetch('/api/profile/email/verify', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const j = await r.json().catch(() => ({} as any))
    setBusy('')
    if (!r.ok) return setM2({ t: 'err', m: j.error || 'Errore' })
    setEmailStep('idle'); setCode('')
    setM2({ t: 'ok', m: 'Email aggiornata. Da ora accedi con il nuovo indirizzo.' })
    router.refresh()
  }

  const card = 'card p-5'
  const head = 'flex items-center gap-2 font-semibold'

  return (
    <div className="space-y-5">
      <form onSubmit={saveName} className={card}>
        <div className={head}><User size={18} className="text-brand" /> Dati personali</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div><label className="label">Nome</label><input className="input mt-1" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} autoComplete="given-name" /></div>
          <div><label className="label">Cognome</label><input className="input mt-1" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} autoComplete="family-name" /></div>
        </div>
        <Note msg={m1} />
        <button className="btn btn-primary mt-4" disabled={busy === 'name'}>{busy === 'name' ? 'Salvo…' : 'Salva'}</button>
      </form>

      <form onSubmit={emailStep === 'idle' ? requestEmailCode : confirmEmailCode} className={card}>
        <div className={head}><Mail size={18} className="text-brand" /> Email di accesso</div>
        <p className="mt-1 text-xs text-muted">
          Per cambiarla ti mandiamo un codice al nuovo indirizzo: il cambio è effettivo solo dopo la conferma.
        </p>

        <label className="label mt-4 block">Email</label>
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
            <label className="label mt-4 block">Codice ricevuto via email</label>
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
            {busy === 'email' ? 'Attendi…' : emailStep === 'idle' ? 'Invia codice' : 'Conferma cambio'}
          </button>
          {emailStep === 'code' && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setEmailStep('idle'); setCode(''); setM2(null); setNewEmail(email) }}
            >
              Annulla
            </button>
          )}
        </div>
      </form>

      <form onSubmit={saveBilling} className={card}>
        <div className={head}><ReceiptText size={18} className="text-brand" /> Dati di fatturazione</div>
        <p className="mt-1 text-xs text-muted">Compaiono nelle fatture PDF che scarichi. Compila ciò che ti serve.</p>
        <div className="mt-4 space-y-3">
          <div><label className="label">Intestazione / Ragione sociale</label><input className="input mt-1" value={f.billingName} onChange={(e) => set('billingName', e.target.value)} placeholder="Nome o azienda" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">P. IVA</label><input className="input mt-1" value={f.billingVat} onChange={(e) => set('billingVat', e.target.value)} /></div>
            <div><label className="label">Codice fiscale</label><input className="input mt-1" value={f.billingCf} onChange={(e) => set('billingCf', e.target.value)} /></div>
          </div>
          <div><label className="label">Indirizzo</label><input className="input mt-1" value={f.billingAddress} onChange={(e) => set('billingAddress', e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">CAP</label><input className="input mt-1" value={f.billingZip} onChange={(e) => set('billingZip', e.target.value)} /></div>
            <div><label className="label">Città</label><input className="input mt-1" value={f.billingCity} onChange={(e) => set('billingCity', e.target.value)} /></div>
            <div><label className="label">Paese</label><input className="input mt-1" value={f.billingCountry} onChange={(e) => set('billingCountry', e.target.value)} placeholder="IT" /></div>
          </div>
        </div>
        <Note msg={m4} />
        <button className="btn btn-primary mt-4" disabled={busy === 'billing'}>{busy === 'billing' ? 'Salvo…' : 'Salva fatturazione'}</button>
      </form>
    </div>
  )
}
