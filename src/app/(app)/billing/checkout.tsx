'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'

const LOADER = 'https://js.whop.com/static/checkout/loader.js'

type Pkg = { id: string; name: string; tier: string; slug: string; price_monthly: number; features: string[]; whop_plan_id: string | null }

function ensureLoader() {
  if (typeof document === 'undefined') return
  if (document.querySelector(`script[src="${LOADER}"]`)) return
  const s = document.createElement('script')
  s.src = LOADER
  s.async = true
  s.defer = true
  document.head.appendChild(s)
}

function CheckoutModal({ pkg, email, fullName, onClose }: { pkg: Pkg; email: string; fullName: string; onClose: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ensureLoader()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const returnUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/checkout/complete?plan=${encodeURIComponent(pkg.slug)}`
    : `/checkout/complete?plan=${pkg.slug}`

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-panel shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <div className="font-semibold">Attiva {pkg.name}</div>
            <div className="text-xs text-muted">€{(pkg.price_monthly / 100).toFixed(0)} + IVA / mese · pagamento sicuro Whop</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-bg" aria-label="Chiudi"><X size={18} /></button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-2">
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted" aria-hidden>
            <Loader2 size={16} className="animate-spin" /> Carico il checkout…
          </div>
          {/* Whop embedded checkout: il loader idrata questo nodo e sovrappone l'iframe */}
          <div
            ref={mountRef}
            key={pkg.whop_plan_id || pkg.id}
            data-whop-checkout-plan-id={pkg.whop_plan_id || ''}
            data-whop-checkout-return-url={returnUrl}
            data-whop-checkout-prefill-email={email}
            data-whop-checkout-prefill-name={fullName}
            data-whop-checkout-theme="light"
            data-whop-checkout-theme-accent-color="#e5502e"
            style={{ minHeight: 480 }}
          />
        </div>
      </div>
    </div>
  )
}

export function Checkout({ packages, email, fullName, currentTier, currentStatus }: {
  packages: Pkg[]; email: string; fullName: string; currentTier: string; currentStatus: string
}) {
  const [active, setActive] = useState<Pkg | null>(null)

  // Auto-apertura dal flusso "registra → paga": /billing?checkout=<slug>
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('checkout')
    if (!slug) return
    const pkg = packages.find((p) => p.slug === slug && p.whop_plan_id)
    if (pkg) setActive(pkg)
  }, [packages])

  const isCurrent = (p: Pkg) => currentStatus === 'active' && p.tier === currentTier

  return (
    <>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {packages.map((p) => (
          <div key={p.id} className={`card p-6 ${p.tier === 'premium' ? 'ring-1 ring-brand' : ''}`}>
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-bold">{p.name}</h3>
              <span className="label">{p.tier === 'premium' ? 'Avanzato' : 'Standard'}</span>
            </div>
            <p className="mt-2">
              <span className="font-display text-3xl font-extrabold">€{(p.price_monthly / 100).toFixed(0)}</span>
              <span className="text-muted"> + IVA/mese</span>
            </p>
            <ul className="mt-4 space-y-2">
              {(p.features ?? []).map((f) => <li key={f} className="flex items-start gap-2 text-sm"><Check size={15} className="mt-0.5 text-brand" /> {f}</li>)}
            </ul>
            {isCurrent(p)
              ? <button disabled className="btn btn-ghost mt-5 w-full opacity-70">Piano attuale</button>
              : p.whop_plan_id
                ? <button onClick={() => setActive(p)} className="btn btn-primary mt-5 w-full">{p.tier === 'premium' ? 'Passa a Premium' : 'Attiva Base'}</button>
                : <button disabled className="btn btn-ghost mt-5 w-full opacity-60">Checkout non configurato</button>}
          </div>
        ))}
      </div>

      {active && <CheckoutModal pkg={active} email={email} fullName={fullName} onClose={() => setActive(null)} />}
    </>
  )
}
