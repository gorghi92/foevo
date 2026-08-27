'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WhopEmbed } from '@/components/whop-embed'

export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState('')
  const [checkout, setCheckout] = useState<{ planId: string; planName: string; price: number } | null>(null)
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

    if (plan) {
      // Flusso a pagamento: NON creiamo l'account ora. Salviamo i dati e apriamo il
      // checkout; l'account nasce solo a pagamento confermato (webhook), poi login auto.
      const res = await fetch('/api/checkout/start', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName, plan }),
      })
      const j = await res.json().catch(() => ({} as any))
      setLoading(false)
      if (!res.ok) return setError(j.error || 'Errore')
      setCheckout({ planId: j.planId, planName: j.planName, price: j.price })
      return
    }

    // Flusso gratuito (nessun pagamento): registrazione istantanea passwordless.
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, firstName, lastName }),
    })
    const j = await res.json().catch(() => ({} as any))
    if (res.ok && j.ok) { window.location.assign('/dashboard'); return }
    if (j.exists) {
      // Email già registrata → link di accesso brandizzato (poi al checkout se c'è un piano).
      const next = plan ? `/billing?checkout=${plan}` : '/dashboard'
      const lr = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, next }),
      })
      const lj = await lr.json().catch(() => ({} as any))
      setLoading(false)
      if (!lr.ok || !lj.ok) return setError(lj.error || 'Errore')
      setSent(true)
      return
    }
    setLoading(false)
    setError(j.error || 'Errore nella registrazione')
  }

  // Step 2 (solo flusso a pagamento): checkout Whop in overlay pulito.
  if (checkout) {
    const returnUrl = `${window.location.origin}/checkout/complete?plan=${encodeURIComponent(plan)}`
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
        <div className="relative w-full max-w-md rounded-2xl bg-panel shadow-2xl">
          <div className="border-b border-line px-5 py-3">
            <div className="font-semibold">Attiva {checkout.planName}</div>
            <div className="text-xs text-muted">€{(checkout.price / 100).toFixed(0)} + IVA / mese · pagamento sicuro Whop</div>
          </div>
          <div className="max-h-[80vh] overflow-y-auto p-2">
            <WhopEmbed planId={checkout.planId} email={email} fullName={`${firstName} ${lastName}`.trim()} returnUrl={returnUrl} />
          </div>
          <div className="border-t border-line px-5 py-2 text-center">
            <button onClick={() => setCheckout(null)} className="text-xs text-muted hover:text-ink">← Modifica i dati</button>
          </div>
        </div>
      </div>
    )
  }

  if (sent) {
    return (
      <div>
        <h1 className="text-xl font-bold">Hai già un account</h1>
        <p className="mt-2 text-sm text-muted">Questa email è già registrata. Ti abbiamo inviato un <b>link di accesso</b> a <b>{email}</b>: aprilo per entrare.</p>
        <Link href="/login" className="btn btn-ghost mt-6 w-full">Torna all’accesso</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Crea il tuo account</h1>
      <p className="mt-1 text-sm text-muted">
        {plan ? <>Stai attivando il piano <b className="text-brand">{planLabel}</b>. </> : null}
        Niente password: {plan ? 'inserisci i dati e prosegui al pagamento.' : 'crei l’account e prosegui subito.'}
      </p>

      <form onSubmit={send} className="mt-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Nome" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" autoFocus />
          <input className="input" placeholder="Cognome" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" />
        </div>
        <input className="input" type="email" placeholder="La tua email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Attendi…' : plan ? 'Vai al pagamento' : 'Crea account'}</button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Hai già un account? <Link href="/login" className="font-semibold text-brand">Accedi</Link>
      </p>
    </div>
  )
}
