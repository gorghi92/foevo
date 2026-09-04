import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { getUser } from '@/lib/supabase/server'
import { resolveEntitlement, planLabel } from '@/server/store'
import { ActivationPoller, ClaimPoller } from './poller'
import { getDictionary, isLocale, localePath, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'
import { Rich } from '@/lib/i18n/rich'

export const dynamic = 'force-dynamic'

const pick = (locale: string): Locale => (isLocale(locale) ? locale : DEFAULT_LOCALE)

export default async function CheckoutComplete({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { status?: string; plan?: string; payment_id?: string; receipt_id?: string }
}) {
  const locale = pick(params.locale)
  const t = getDictionary(locale).checkout

  const status = searchParams.status ?? 'success'
  const planSlug = searchParams.plan ?? ''
  const paymentId = searchParams.payment_id || searchParams.receipt_id || ''
  const failed = status === 'error'

  const user = await getUser()
  const ent = user ? await resolveEntitlement(user.id) : null
  // Attivo se l'entitlement è attivo e, quando l'URL dichiara un piano,
  // è proprio quello: il confronto è sullo slug perché Starter e Base
  // condividono il tier `base`.
  const active =
    !!ent && ent.status === 'active' && ent.source !== 'none' &&
    (!planSlug || !ent.planSlug || ent.planSlug === planSlug)

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <Link href={localePath(locale, '/')} className="mb-6 inline-flex items-center gap-2">
          <span className="heat-dot h-7 w-7 rounded-lg" aria-hidden />
          <span className="font-display text-base font-extrabold">Foevo</span>
        </Link>

        {failed ? (
          <>
            <XCircle size={44} className="mx-auto text-red-500" />
            <h1 className="mt-4 text-xl font-extrabold">{t.failedTitle}</h1>
            <p className="mt-2 text-sm text-muted">{t.failedBody}</p>
            <Link href="/billing" className="btn btn-primary mt-6 w-full">{t.retry}</Link>
          </>
        ) : !user ? (
          <ClaimPoller paymentId={paymentId} t={t} />
        ) : active ? (
          <>
            <CheckCircle2 size={44} className="mx-auto text-green-600" />
            <h1 className="mt-4 text-xl font-extrabold">{t.activeTitle}</h1>
            <p className="mt-2 text-sm text-muted">
              <Rich text={t.activeBody.replace('PLAN', planLabel(ent!))} />
            </p>
            <Link href="/dashboard" className="btn btn-primary mt-6 w-full">{t.toDashboard}</Link>
          </>
        ) : (
          <>
            <Loader2 size={44} className="mx-auto animate-spin text-brand" />
            <h1 className="mt-4 text-xl font-extrabold">{t.receivedTitle}</h1>
            <p className="mt-2 text-sm text-muted">{t.receivedBody}</p>
            <ActivationPoller done={active} t={t} />
            <Link href="/dashboard" className="btn btn-ghost mt-6 w-full">{t.toDashboard}</Link>
          </>
        )}
      </div>
    </div>
  )
}
