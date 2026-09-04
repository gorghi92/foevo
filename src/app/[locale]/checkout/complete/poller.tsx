'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'

type Copy = Dictionary['checkout']

/** Il webhook Whop attiva il piano in modo asincrono: ricarichiamo la pagina
 *  server (che rilegge l'entitlement) finché non risulta attivo, con un limite. */
export function ActivationPoller({
  done, t, tries = 15, intervalMs = 3000,
}: { done: boolean; t: Copy; tries?: number; intervalMs?: number }) {
  const router = useRouter()
  const [n, setN] = useState(0)

  useEffect(() => {
    if (done || n >= tries) return
    const timer = setTimeout(() => { setN((v) => v + 1); router.refresh() }, intervalMs)
    return () => clearTimeout(timer)
  }, [done, n, tries, intervalMs, router])

  if (done) return null
  return <p className="mt-3 text-sm text-muted">{n >= tries ? t.activatingSlow : t.activating}</p>
}

/**
 * Flusso pay-first non autenticato: dopo il pagamento, l'account e il piano li
 * crea il webhook; qui interroghiamo /api/checkout/claim finché non risultano
 * pronti, poi entriamo automaticamente. Nessun login se il pagamento non è
 * confermato.
 */
export function ClaimPoller({ paymentId, t }: { paymentId?: string; t: Copy }) {
  const [state, setState] = useState<'pending' | 'ok' | 'none' | 'slow'>('pending')
  const [n, setN] = useState(0)
  const MAX = 25

  useEffect(() => {
    if (state === 'ok' || state === 'none') return
    let stop = false
    const timer = setTimeout(async () => {
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
    return () => { stop = true; clearTimeout(timer) }
  }, [n, state, paymentId])

  if (state === 'ok') {
    return (
      <>
        <CheckCircle2 size={44} className="mx-auto text-green-600" />
        <h1 className="mt-4 text-xl font-extrabold">{t.activeTitle}</h1>
        <p className="mt-2 text-sm text-muted">{t.claimRedirect}</p>
      </>
    )
  }
  if (state === 'none') {
    return (
      <>
        <CheckCircle2 size={44} className="mx-auto text-green-600" />
        <h1 className="mt-4 text-xl font-extrabold">{t.confirmedTitle}</h1>
        <p className="mt-2 text-sm text-muted">{t.confirmedBody}</p>
        <Link href="/login" className="btn btn-primary mt-6 w-full">{t.signIn}</Link>
      </>
    )
  }
  return (
    <>
      <Loader2 size={44} className="mx-auto animate-spin text-brand" />
      <h1 className="mt-4 text-xl font-extrabold">{t.receivedTitle}</h1>
      <p className="mt-2 text-sm text-muted">{state === 'slow' ? t.claimingSlow : t.claiming}</p>
      {state === 'slow' && <Link href="/login" className="btn btn-ghost mt-6 w-full">{t.login}</Link>}
    </>
  )
}
