'use client'

import { useEffect, useState } from 'react'
import { WhopEmbed } from '@/components/whop-embed'
import type { Dictionary } from '@/lib/i18n'
import { Rich } from '@/lib/i18n/rich'

export interface PlanOption { slug: string; name: string; price: number; tier: 'base' | 'premium' }

type Copy = Dictionary['app']['auth']['signup']

export function SignupForm({ t, plans }: { t: Copy; plans: PlanOption[] }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState('')
  const [checkout, setCheckout] = useState<{ planId: string; planName: string; price: number } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Il pacchetto scelto dalla landing arriva come ?plan=<slug>. Se manca o non
  // corrisponde a un piano attivo, lo si sceglie qui: senza piano non si procede.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('plan')
    if (p && plans.some((x) => x.slug === p)) setPlan(p)
    else if (plans.length === 1) setPlan(plans[0].slug)
  }, [plans])

  const selected = plans.find((p) => p.slug === plan) || null

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)

    if (!plan) { setLoading(false); return setError(t.noPlanSelected) }

    // NON creiamo l'account ora: salviamo i dati e apriamo il checkout.
    // L'account nasce solo a pagamento confermato (webhook), poi login automatico.
    const res = await fetch('/api/checkout/start', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, firstName, lastName, plan }),
    })
    const j = await res.json().catch(() => ({} as any))
    setLoading(false)
    if (!res.ok) return setError(j.error || t.error)
    setCheckout({ planId: j.planId, planName: j.planName, price: j.price })

  }

  // Step 2 (solo flusso a pagamento): checkout Whop in overlay pulito.
  if (checkout) {
    const returnUrl = `${window.location.origin}/checkout/complete?plan=${encodeURIComponent(plan)}`
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
        <div className="relative w-full max-w-md rounded-2xl bg-panel shadow-2xl">
          <div className="border-b border-line px-5 py-3">
            <div className="font-semibold">{t.checkout.activate} {checkout.planName}</div>
            <div className="text-xs text-muted">
              {`€${(checkout.price / 100).toFixed(0)} ${t.perMonth} · ${t.checkout.securePayment}`}
            </div>
          </div>
          <div className="max-h-[80vh] overflow-y-auto p-2">
            <WhopEmbed planId={checkout.planId} email={email} fullName={`${firstName} ${lastName}`.trim()} returnUrl={returnUrl} />
          </div>
          <div className="border-t border-line px-5 py-2 text-center">
            <button onClick={() => setCheckout(null)} className="text-xs text-muted hover:text-ink">← {t.checkout.edit}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{t.title}</h1>
      <p className="mt-1 text-sm text-muted">
        {selected ? <>{t.activating.pre}<b className="text-brand">{selected.name}</b>{t.activating.post}</> : null}
        {t.subtitle}
      </p>

      {plans.length > 1 && (
        <div className="mt-5 grid gap-2" role="radiogroup" aria-label={t.choosePlan}>
          {plans.map((p) => (
            <button
              key={p.slug}
              type="button"
              role="radio"
              aria-checked={plan === p.slug}
              onClick={() => { setPlan(p.slug); setError('') }}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                plan === p.slug ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand/50'
              }`}
            >
              <span className="font-semibold">{p.name}</span>
              <span className="text-sm text-muted">{`€${(p.price / 100).toFixed(0)} ${t.perMonth}`}</span>
            </button>
          ))}
        </div>
      )}

      {plans.length === 0 && (
        <p className="mt-5 rounded-xl border border-line bg-bg p-3 text-sm text-muted">
          {t.noPlans}
        </p>
      )}

      <form onSubmit={send} className="mt-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder={t.firstName} value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" autoFocus />
          <input className="input" placeholder={t.lastName} value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" />
        </div>
        <input className="input" type="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className="btn btn-primary w-full" disabled={loading || !plan}>
          {loading ? t.submitting : t.submit}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        <Rich text={t.haveAccount} />
      </p>
    </div>
  )
}
