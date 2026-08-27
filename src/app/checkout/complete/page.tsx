import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { getUser } from '@/lib/supabase/server'
import { resolveEntitlement } from '@/server/store'
import { ActivationPoller, ClaimPoller } from './poller'

export const dynamic = 'force-dynamic'

export default async function CheckoutComplete({ searchParams }: { searchParams: { status?: string; plan?: string; payment_id?: string; receipt_id?: string } }) {
  const status = searchParams.status ?? 'success'
  const planSlug = searchParams.plan ?? ''
  const paymentId = searchParams.payment_id || searchParams.receipt_id || ''
  const failed = status === 'error'

  const user = await getUser()
  const ent = user ? await resolveEntitlement(user.id) : null
  // Considera attivo se l'entitlement è attivo e (nessun piano richiesto o coincide col tier)
  const wantTier = planSlug === 'premium' ? 'premium' : planSlug === 'base' ? 'base' : ''
  const active = !!ent && ent.status === 'active' && ent.source !== 'none' && (!wantTier || ent.tier === wantTier)

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <Link href="/" className="mb-6 inline-flex items-center gap-2">
          <span className="heat-dot h-7 w-7 rounded-lg" aria-hidden />
          <span className="font-display text-base font-extrabold">Foveo</span>
        </Link>

        {failed ? (
          <>
            <XCircle size={44} className="mx-auto text-red-500" />
            <h1 className="mt-4 text-xl font-extrabold">Pagamento non completato</h1>
            <p className="mt-2 text-sm text-muted">Il pagamento è stato annullato o non è andato a buon fine. Puoi riprovare quando vuoi.</p>
            <Link href="/billing" className="btn btn-primary mt-6 w-full">Riprova</Link>
          </>
        ) : !user ? (
          <ClaimPoller paymentId={paymentId} />
        ) : active ? (
          <>
            <CheckCircle2 size={44} className="mx-auto text-green-600" />
            <h1 className="mt-4 text-xl font-extrabold">Piano attivo 🎉</h1>
            <p className="mt-2 text-sm text-muted">Il pagamento è confermato e il tuo piano <b>{ent!.tier === 'premium' ? 'Premium' : 'Base'}</b> è attivo. Buon lavoro con Foevo!</p>
            <Link href="/dashboard" className="btn btn-primary mt-6 w-full">Vai alla dashboard</Link>
          </>
        ) : (
          <>
            <Loader2 size={44} className="mx-auto animate-spin text-brand" />
            <h1 className="mt-4 text-xl font-extrabold">Pagamento ricevuto</h1>
            <p className="mt-2 text-sm text-muted">Grazie! Stiamo attivando il tuo piano.</p>
            <ActivationPoller done={active} />
            <Link href="/dashboard" className="btn btn-ghost mt-6 w-full">Vai alla dashboard</Link>
          </>
        )}
      </div>
    </div>
  )
}
