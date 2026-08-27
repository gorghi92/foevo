'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

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

/**
 * Flusso pay-first non autenticato: dopo il pagamento, l'account e il piano li
 * crea il webhook; qui interroghiamo /api/checkout/claim finché non risultano
 * pronti, poi entriamo automaticamente. Nessun login se il pagamento non è
 * confermato.
 */
export function ClaimPoller({ paymentId }: { paymentId?: string }) {
  const [state, setState] = useState<'pending' | 'ok' | 'none' | 'slow'>('pending')
  const [n, setN] = useState(0)
  const MAX = 25

  useEffect(() => {
    if (state === 'ok' || state === 'none') return
    let stop = false
    const t = setTimeout(async () => {
      try {
        const r = await fetch('/api/checkout/claim', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ paymentId: paymentId || '' }),
        })
        const j = await r.json().catch(() => ({}))
        if (stop) return
        if (j.status === 'ok') { setState('ok'); window.location.assign('/dashboard'); return }
        if (j.status === 'no_session') { setState('none'); return }
      } catch { /* riprova */ }
      if (!stop) setN((v) => { const nv = v + 1; if (nv >= MAX) setState('slow'); return nv })
    }, 3000)
    return () => { stop = true; clearTimeout(t) }
  }, [n, state])

  if (state === 'ok') {
    return (
      <>
        <CheckCircle2 size={44} className="mx-auto text-green-600" />
        <h1 className="mt-4 text-xl font-extrabold">Piano attivo 🎉</h1>
        <p className="mt-2 text-sm text-muted">Ti stiamo portando nella dashboard…</p>
      </>
    )
  }
  if (state === 'none') {
    return (
      <>
        <CheckCircle2 size={44} className="mx-auto text-green-600" />
        <h1 className="mt-4 text-xl font-extrabold">Pagamento confermato</h1>
        <p className="mt-2 text-sm text-muted">Accedi con la stessa email del pagamento per entrare: il piano è già attivo.</p>
        <Link href="/login" className="btn btn-primary mt-6 w-full">Accedi a Foveo</Link>
      </>
    )
  }
  return (
    <>
      <Loader2 size={44} className="mx-auto animate-spin text-brand" />
      <h1 className="mt-4 text-xl font-extrabold">Pagamento ricevuto</h1>
      <p className="mt-2 text-sm text-muted">
        {state === 'slow'
          ? 'La conferma sta impiegando più del previsto. Puoi accedere tra poco con la tua email.'
          : 'Stiamo attivando il tuo account e il tuo piano… ci vuole qualche secondo.'}
      </p>
      {state === 'slow' && <Link href="/login" className="btn btn-ghost mt-6 w-full">Accedi</Link>}
    </>
  )
}
