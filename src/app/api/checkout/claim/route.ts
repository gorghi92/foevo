import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getWhopConfig } from '@/lib/settings'
import { sendReceiptOnce } from '@/lib/email'
import { guard, ipKey } from '@/lib/rate-limit'
import { requestLocale } from '@/lib/i18n/api'

export const runtime = 'nodejs'

/** Apre la sessione (senza email) per un account già esistente. */
async function openSession(email: string): Promise<boolean> {
  const sc = createServiceClient()
  const { data: link, error } = await sc.auth.admin.generateLink({ type: 'magiclink', email })
  const tokenHash = (link as any)?.properties?.hashed_token as string | undefined
  if (error || !tokenHash) return false
  const supa = createClient()
  const { error: vErr } = await supa.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
  return !vErr
}

interface VerifiedPayment {
  paid: boolean
  valid: boolean
  plan: string | null
  membershipId: string | null
  /** Email che risulta a Whop come intestataria del pagamento. */
  payerEmail: string | null
  name: string
  amountCents: number
  currency: string
  paymentId: string
  paidAtMs: number
  renewalEnd: number | null
}

const firstEmail = (...vals: unknown[]): string | null => {
  for (const v of vals) {
    const s = typeof v === 'string' ? v.trim().toLowerCase() : ''
    if (s.includes('@')) return s
  }
  return null
}

/** Interroga Whop sul pagamento indicato nell'URL di ritorno. */
async function verifyPayment(apiKey: string, paymentId: string): Promise<VerifiedPayment | null> {
  const h = { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' }
  const pr = await fetch(`https://api.whop.com/api/v2/payments/${encodeURIComponent(paymentId)}`, { headers: h })
  if (!pr.ok) return null
  const pay: any = await pr.json()
  const membershipId: string | null = pay?.membership ?? pay?.membership_id ?? null

  let payerEmail = firstEmail(pay?.user_email, pay?.email, pay?.user?.email, pay?.billing_email, pay?.billing?.email)
  let valid = true
  let renewalEnd: number | null = null

  if (membershipId) {
    const mr = await fetch(`https://api.whop.com/api/v2/memberships/${encodeURIComponent(membershipId)}`, { headers: h })
    if (mr.ok) {
      const mj: any = await mr.json()
      const md = mj?.data ?? mj
      payerEmail = payerEmail ?? firstEmail(md?.email, md?.user_email, md?.user?.email)
      valid = md?.valid !== false
      renewalEnd = md?.renewal_period_end ?? null
    }
  }

  return {
    paid: String(pay?.status || '').toLowerCase() === 'paid',
    valid,
    plan: pay?.plan ?? pay?.plan_id ?? null,
    membershipId,
    payerEmail,
    name: `${pay?.billing_first_name || ''} ${pay?.billing_last_name || ''}`.trim(),
    amountCents: Math.round(Number(pay?.final_amount ?? pay?.total ?? pay?.subtotal ?? 0) * 100),
    currency: String(pay?.currency || 'eur').toUpperCase(),
    paymentId: pay?.id ?? paymentId,
    paidAtMs: pay?.paid_at ? Number(pay.paid_at) * 1000 : Date.now(),
    renewalEnd,
  }
}

/**
 * Chiamata in polling dalla pagina di ritorno del checkout (flusso pay-first).
 *
 * L'unica prova che chi chiede la sessione ha davvero pagato è il pagamento
 * verificato presso Whop: il cookie `fv_signup` dice soltanto quale email è
 * stata digitata nel modulo, e quel modulo è pubblico. Quindi la sessione si
 * apre solo se Whop conferma che quel pagamento è saldato ED è intestato alla
 * stessa email del cookie. Senza questa doppia condizione la risposta è
 * "pending" e l'utente entra dal link di accesso via email: l'account e il
 * piano li crea comunque il webhook.
 */
export async function POST(req: Request) {
  const jar = cookies()
  const rawCookie = jar.get('fv_signup')?.value
  if (!rawCookie) return NextResponse.json({ status: 'no_session' })
  let info: { email?: string } = {}
  try { info = JSON.parse(rawCookie) } catch { return NextResponse.json({ status: 'no_session' }) }
  const cookieEmail = String(info.email || '').trim().toLowerCase()
  if (!cookieEmail) return NextResponse.json({ status: 'no_session' })

  // La pagina interroga ogni 3 secondi: il tetto lascia respirare il polling
  // legittimo e ferma chi prova a ciclare pagamenti o email.
  const blocked = await guard(req, [
    { bucket: 'claim-ip', key: ipKey(req), windowSeconds: 600, max: 120 },
  ])
  if (blocked) return blocked

  const body = (await req.json().catch(() => ({}))) as { paymentId?: string }
  const paymentId = String(body.paymentId || '').trim().slice(0, 128)
  if (!paymentId) return NextResponse.json({ status: 'pending' })

  const { apiKey } = await getWhopConfig()
  if (!apiKey) return NextResponse.json({ status: 'pending' })

  let pay: VerifiedPayment | null = null
  try { pay = await verifyPayment(apiKey, paymentId) } catch { return NextResponse.json({ status: 'pending' }) }
  if (!pay || !pay.paid || !pay.valid || !pay.plan) return NextResponse.json({ status: 'pending' })

  if (!pay.payerEmail) {
    // Pagamento valido ma Whop non ci dice a chi è intestato: senza quel dato
    // non possiamo distinguere il pagante da chi ha solo scritto la sua email.
    console.warn('[foevo] claim: pagamento senza email intestataria', pay.paymentId)
    return NextResponse.json({ status: 'pending' })
  }
  if (pay.payerEmail !== cookieEmail) return NextResponse.json({ status: 'pending' })

  const sc = createServiceClient()
  const { data: prof } = await sc.from('profiles').select('id').ilike('email', cookieEmail).maybeSingle()
  let userId = prof?.id as string | undefined
  if (!userId) {
    const { data: created } = await sc.auth.admin.createUser({
      email: cookieEmail, email_confirm: true, user_metadata: { full_name: pay.name },
    })
    userId = created?.user?.id
    if (userId) {
      try { await sc.from('profiles').upsert({ id: userId, email: cookieEmail, full_name: pay.name }, { onConflict: 'id' }) } catch { /* trigger */ }
    }
  }
  if (!userId) return NextResponse.json({ status: 'pending' })

  const { data: pkg } = await sc.from('packages')
    .select('id, tier, monthly_quota, unlimited').eq('whop_plan_id', pay.plan).maybeSingle()
  if (pkg) {
    await sc.from('entitlements').upsert({
      user_id: userId, package_id: (pkg as any).id, tier: (pkg as any).tier,
      monthly_quota: (pkg as any).monthly_quota, unlimited: (pkg as any).unlimited,
      status: 'active', source: 'whop', whop_membership_id: pay.membershipId,
      current_period_end: pay.renewalEnd ? new Date(pay.renewalEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }

  await sc.from('payments').upsert({
    user_id: userId, email: cookieEmail, amount_cents: pay.amountCents,
    currency: pay.currency, status: 'paid',
    whop_payment_id: pay.paymentId, whop_membership_id: pay.membershipId, plan: pay.plan,
    description: 'Abbonamento Foevo',
    created_at: new Date(pay.paidAtMs).toISOString(),
  }, { onConflict: 'whop_payment_id' })

  await sendReceiptOnce(sc, {
    locale: requestLocale(req),
    whopPaymentId: pay.paymentId, to: cookieEmail,
    planName: (pkg as any)?.tier ? ((pkg as any).tier === 'premium' ? 'Premium' : 'Base') : 'Abbonamento Foevo',
    amount: `${pay.currency} ${(pay.amountCents / 100).toFixed(2)}`,
    date: new Date(pay.paidAtMs).toLocaleDateString('it-IT'),
  })

  if (await openSession(cookieEmail)) {
    jar.delete('fv_signup')
    return NextResponse.json({ status: 'ok' })
  }
  return NextResponse.json({ status: 'pending' })
}
