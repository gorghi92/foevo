'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/** Il webhook Whop attiva il piano in modo asincrono: ricarichiamo la pagina
 *  server (che rilegge l'entitlement) finché non risulta attivo, con un limite. */
export function ActivationPoller({ done, tries = 15, intervalMs = 3000 }: { done: boolean; tries?: number; intervalMs?: number }) {
  const router = useRouter()
  const [n, setN] = useState(0)

  useEffect(() => {
    if (done || n >= tries) return
    const t = setTimeout(() => { setN((v) => v + 1); router.refresh() }, intervalMs)
    return () => clearTimeout(t)
  }, [done, n, tries, intervalMs, router])

  if (done) return null
  return (
    <p className="mt-3 text-sm text-muted">
      {n >= tries
        ? 'L’attivazione sta impiegando più del previsto. Aggiorna tra poco: il piano si attiva appena Whop conferma il pagamento.'
        : 'Stiamo confermando il pagamento con Whop… questa pagina si aggiorna da sola.'}
    </p>
  )
}
