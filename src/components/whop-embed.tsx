'use client'

import { useEffect } from 'react'

const LOADER = 'https://js.whop.com/static/checkout/loader.js'

function ensureLoader() {
  if (typeof document === 'undefined') return
  if (document.querySelector(`script[src="${LOADER}"]`)) return
  const s = document.createElement('script')
  s.src = LOADER
  s.async = true
  s.defer = true
  document.head.appendChild(s)
}

/**
 * Checkout Whop embeddato. Il loader Whop idrata il div (data-attributes) e vi
 * inietta l'iframe di pagamento, mostrando il proprio stato di caricamento.
 */
export function WhopEmbed({ planId, email, fullName, returnUrl, minHeight = 520 }: {
  planId: string; email?: string; fullName?: string; returnUrl: string; minHeight?: number
}) {
  useEffect(() => { ensureLoader() }, [])
  return (
    <div
      key={planId}
      data-whop-checkout-plan-id={planId}
      data-whop-checkout-return-url={returnUrl}
      data-whop-checkout-prefill-email={email || undefined}
      data-whop-checkout-prefill-name={fullName || undefined}
      data-whop-checkout-theme="light"
      data-whop-checkout-theme-accent-color="#e5502e"
      style={{ minHeight }}
    />
  )
}
