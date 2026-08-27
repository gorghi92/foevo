import { createServiceClient } from '@/lib/supabase/server'
import { getAffiliateRules, rateForPlan, commissionCents, monthIndex } from './commission'

type SC = ReturnType<typeof createServiceClient>

/**
 * Attribuzione e maturazione commissioni. Tutto passa da qui, così la logica
 * del denaro sta in un solo posto e il webhook resta sottile.
 */

/** Click sul link: incrementa il contatore dell'affiliato. Ritorna il code se valido. */
export async function registerClick(sc: SC, code: string): Promise<boolean> {
  const c = String(code || '').toUpperCase()
  const { data: aff } = await sc.from('affiliates').select('id, clicks, status').eq('code', c).maybeSingle()
  if (!aff || aff.status !== 'active') return false
  await sc.from('affiliates').update({ clicks: (Number(aff.clicks) || 0) + 1 }).eq('id', aff.id)
  return true
}

/**
 * Registra l'intenzione: al checkout conosciamo email + code. Creiamo (una
 * sola volta) una referral in stato 'clicked' che legherà il pagamento.
 */
export async function recordReferral(sc: SC, code: string, email: string): Promise<void> {
  const c = String(code || '').toUpperCase()
  const em = String(email || '').trim().toLowerCase()
  if (!c || !em.includes('@')) return
  const { data: aff } = await sc.from('affiliates').select('id, status').eq('code', c).maybeSingle()
  if (!aff || aff.status !== 'active') return

  // Se l'utente è già stato attribuito (convertito) non si tocca.
  const { data: converted } = await sc.from('referrals')
    .select('id').eq('referred_email', em).eq('status', 'converted').limit(1).maybeSingle()
  if (converted) return

  // Aggiorna un lead esistente per questa email o creane uno nuovo.
  const { data: existing } = await sc.from('referrals')
    .select('id').eq('referred_email', em).eq('status', 'clicked').order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (existing) {
    await sc.from('referrals').update({ affiliate_id: aff.id, landing_at: new Date().toISOString() }).eq('id', existing.id)
  } else {
    await sc.from('referrals').insert({ affiliate_id: aff.id, referred_email: em, status: 'clicked' })
  }
}

/** Collega la referral all'utente appena creato (per la vista "chi ha portato chi"). */
export async function linkReferralUser(sc: SC, email: string, userId: string): Promise<void> {
  const em = String(email || '').trim().toLowerCase()
  if (!em || !userId) return
  const { data: ref } = await sc.from('referrals')
    .select('id, referred_user_id').eq('referred_email', em)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (ref && !ref.referred_user_id) {
    await sc.from('referrals').update({ referred_user_id: userId }).eq('id', ref.id)
  }
}

/**
 * Matura la commissione per un pagamento. Idempotente: se esiste già una
 * commissione con questo whop_payment_id non fa nulla. Rispetta la finestra di
 * N mesi dalla prima conversione.
 */
export async function attributePayment(sc: SC, args: {
  email: string | null
  whopPaymentId: string | null
  planWhopId: string | null
  amountCents: number
  paymentAtMs: number
}): Promise<void> {
  const email = String(args.email || '').trim().toLowerCase()
  if (!email || !args.whopPaymentId || args.amountCents <= 0) return

  // Idempotenza: già registrata?
  const { data: dup } = await sc.from('commissions').select('id').eq('whop_payment_id', args.whopPaymentId).maybeSingle()
  if (dup) return

  // Referral per questa email (la più recente).
  const { data: ref } = await sc.from('referrals')
    .select('id, affiliate_id, converted_at').eq('referred_email', email)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (!ref) return

  const { data: aff } = await sc.from('affiliates')
    .select('id, status, commission_override_bps').eq('id', ref.affiliate_id).maybeSingle()
  if (!aff || aff.status !== 'active') return

  const rules = await getAffiliateRules()
  const convertedAtMs = ref.converted_at ? new Date(ref.converted_at as string).getTime() : NaN
  const mIdx = monthIndex(convertedAtMs, args.paymentAtMs, rules.commissionMonths)
  if (mIdx == null) return // fuori dalla finestra di N mesi

  // Piano → tier + slug.
  let tier: string | null = null, slug: string | null = null
  if (args.planWhopId) {
    const { data: pkg } = await sc.from('packages').select('tier, slug').eq('whop_plan_id', args.planWhopId).maybeSingle()
    tier = (pkg?.tier as string) ?? null
    slug = (pkg?.slug as string) ?? null
  }

  const rateBps = rateForPlan(tier, rules, aff.commission_override_bps as number | null)
  const amount = commissionCents(args.amountCents, rateBps)
  if (amount <= 0) return

  // Prima conversione: segna la referral come convertita.
  if (!ref.converted_at) {
    await sc.from('referrals').update({
      status: 'converted', converted_at: new Date(args.paymentAtMs).toISOString(),
    }).eq('id', ref.id)
  }

  await sc.from('commissions').insert({
    affiliate_id: aff.id, referral_id: ref.id, whop_payment_id: args.whopPaymentId,
    base_amount_cents: args.amountCents, rate_bps: rateBps, amount_cents: amount,
    plan_slug: slug, month_index: mIdx, status: 'available',
  })
}

/**
 * Rimborso/dispute Whop su un pagamento. NON storna in automatico: crea un
 * avviso per il superadmin (e gli invia una email) così può decidere. Se al
 * pagamento era legata una commissione, l'avviso ne riporta lo stato.
 */
export async function handleRefund(sc: SC, args: {
  whopPaymentId: string | null
  email: string | null
  amountCents: number
  kind?: string
}): Promise<void> {
  if (!args.whopPaymentId) return
  const kind = args.kind || 'refund'

  // Commissione collegata (se esiste).
  const { data: comm } = await sc.from('commissions')
    .select('id, affiliate_id, amount_cents, status, payout_request_id')
    .eq('whop_payment_id', args.whopPaymentId).maybeSingle()

  let affiliate: any = null
  if (comm) {
    const { data } = await sc.from('affiliates').select('username, email').eq('id', comm.affiliate_id).maybeSingle()
    affiliate = data
  }

  const eur = (c: number) => `€${((c || 0) / 100).toFixed(2)}`
  const stateLabel = !comm ? 'nessuna commissione collegata'
    : comm.status === 'paid' ? 'commissione GIÀ LIQUIDATA — recupero manuale'
    : comm.payout_request_id ? 'commissione in una richiesta di pagamento aperta'
    : 'commissione ancora disponibile — puoi stornarla'

  const title = comm
    ? `Rimborso su una vendita da affiliato (${affiliate?.username || '—'})`
    : 'Rimborso su un pagamento'
  const body = [
    `Pagamento Whop ${args.whopPaymentId} rimborsato/contestato${args.email ? ` (${args.email})` : ''}.`,
    args.amountCents ? `Importo: ${eur(args.amountCents)}.` : '',
    comm ? `Commissione collegata: ${eur(comm.amount_cents)} — ${stateLabel}.` : 'Nessuna commissione collegata.',
  ].filter(Boolean).join(' ')

  const severity = comm && comm.status === 'paid' ? 'critical' : comm ? 'warning' : 'info'

  // Idempotente sull'indice (kind, whop_payment_id).
  await sc.from('admin_alerts').insert({
    kind, severity, title, body,
    affiliate_id: comm?.affiliate_id ?? null, commission_id: comm?.id ?? null,
    whop_payment_id: args.whopPaymentId, amount_cents: args.amountCents || null,
  })

  // Email al superadmin (best-effort): così l'avviso arriva anche senza login.
  try {
    const { sendEmail, refundAlertEmail } = await import('@/lib/email')
    const admins = (process.env.SUPERADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean)
    if (admins.length) {
      const { subject, html } = refundAlertEmail({
        title,
        paymentId: args.whopPaymentId,
        email: args.email,
        amount: args.amountCents ? eur(args.amountCents) : null,
        commissionAmount: comm ? eur(comm.amount_cents) : null,
        commissionState: comm ? stateLabel : null,
        affiliate: affiliate?.username ?? null,
        severity,
      })
      for (const to of admins) await sendEmail({ to, subject, html })
    }
  } catch (e) { console.error('[foevo] email avviso rimborso', e) }
}
