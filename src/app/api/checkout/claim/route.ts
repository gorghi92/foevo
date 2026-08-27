import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getWhopConfig } from '@/lib/settings'
import { sendReceiptOnce } from '@/lib/email'

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

/**
 * Chiamata in polling dalla pagina di ritorno del checkout (flusso pay-first).
 * Attiva l'account SOLO a pagamento confermato:
 *  1) via preferita — l'entitlement Whop è già presente (creato dal webhook);
 *  2) auto-riparazione — verifica il pagamento direttamente sull'API Whop
 *     (payment_id dall'URL di ritorno) e, se pagato per la stessa email inserita,
 *     crea account + entitlement + pagamento e apre la sessione.
 * Nessun login se il pagamento non risulta pagato.
 */
export async function POST(req: Request) {
  const jar = cookies()
  const rawCookie = jar.get('fv_signup')?.value
  if (!rawCookie) return NextResponse.json({ status: 'no_session' })
  let info: { email?: string } = {}
  try { info = JSON.parse(rawCookie) } catch { return NextResponse.json({ status: 'no_session' }) }
  const cookieEmail = String(info.email || '').trim().toLowerCase()
  if (!cookieEmail) return NextResponse.json({ status: 'no_session' })

  const body = (await req.json().catch(() => ({}))) as { paymentId?: string }
  const paymentId = String(body.paymentId || '').trim()

  const sc = createServiceClient()

  // 1) L'entitlement Whop c'è già (webhook) → entra.
  const { data: prof } = await sc.from('profiles').select('id').ilike('email', cookieEmail).maybeSingle()
  if (prof) {
    const { data: ent } = await sc.from('entitlements').select('status, source').eq('user_id', prof.id).maybeSingle()
    if (ent?.status === 'active' && ent?.source === 'whop') {
      if (await openSession(cookieEmail)) { jar.delete('fv_signup'); return NextResponse.json({ status: 'ok' }) }
    }
  }

  // 2) Auto-riparazione via API Whop (non dipende dal webhook).
  if (paymentId) {
    const { apiKey } = await getWhopConfig()
    if (apiKey) {
      try {
        const h = { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' }
        const pr = await fetch(`https://api.whop.com/api/v2/payments/${encodeURIComponent(paymentId)}`, { headers: h })
        if (pr.ok) {
          const pay: any = await pr.json()
          const paid = String(pay?.status || '').toLowerCase() === 'paid'
          const plan: string | null = pay?.plan ?? null
          const membershipId: string | null = pay?.membership ?? null
          let email: string | null = null
          let valid = true
          let renewalEnd: number | null = null
          if (membershipId) {
            const mr = await fetch(`https://api.whop.com/api/v2/memberships/${encodeURIComponent(membershipId)}`, { headers: h })
            if (mr.ok) { const m: any = await mr.json(); const md = m?.data ?? m; email = md?.email ?? null; valid = md?.valid !== false; renewalEnd = md?.renewal_period_end ?? null }
          }
          const name = `${pay?.billing_first_name || ''} ${pay?.billing_last_name || ''}`.trim()
          const finalEmail = (email || cookieEmail).toLowerCase()

          // Sicurezza: attiva solo se il pagamento è per la stessa email inserita nel browser.
          if (paid && valid && plan && finalEmail === cookieEmail) {
            let userId = prof?.id as string | undefined
            if (!userId) {
              const { data: created } = await sc.auth.admin.createUser({ email: finalEmail, email_confirm: true, user_metadata: { full_name: name } })
              userId = created?.user?.id
              if (userId) { try { await sc.from('profiles').upsert({ id: userId, email: finalEmail, full_name: name }, { onConflict: 'id' }) } catch { /* trigger */ } }
            }
            if (userId) {
              const { data: pkg } = await sc.from('packages').select('id, tier, monthly_quota, unlimited').eq('whop_plan_id', plan).maybeSingle()
              if (pkg) {
                await sc.from('entitlements').upsert({
                  user_id: userId, package_id: (pkg as any).id, tier: (pkg as any).tier,
                  monthly_quota: (pkg as any).monthly_quota, unlimited: (pkg as any).unlimited,
                  status: 'active', source: 'whop', whop_membership_id: membershipId,
                  current_period_end: renewalEnd ? new Date(renewalEnd * 1000).toISOString() : null,
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' })
              }
              const cents = Math.round(Number(pay?.final_amount ?? pay?.total ?? pay?.subtotal ?? 0) * 100)
              await sc.from('payments').upsert({
                user_id: userId, email: finalEmail, amount_cents: cents,
                currency: String(pay?.currency || 'eur').toUpperCase(), status: 'paid',
                whop_payment_id: pay?.id ?? paymentId, whop_membership_id: membershipId, plan,
                description: 'Abbonamento Foevo',
                created_at: pay?.paid_at ? new Date(Number(pay.paid_at) * 1000).toISOString() : new Date().toISOString(),
              }, { onConflict: 'whop_payment_id' })

              await sendReceiptOnce(sc, {
                whopPaymentId: pay?.id ?? paymentId, to: finalEmail,
                planName: (pkg as any)?.tier ? ((pkg as any).tier === 'premium' ? 'Premium' : 'Base') : 'Abbonamento Foevo',
                amount: `${String(pay?.currency || 'eur').toUpperCase()} ${(cents / 100).toFixed(2)}`,
                date: new Date(pay?.paid_at ? Number(pay.paid_at) * 1000 : Date.now()).toLocaleDateString('it-IT'),
              })

              if (await openSession(finalEmail)) { jar.delete('fv_signup'); return NextResponse.json({ status: 'ok' }) }
            }
          }
        }
      } catch { /* riprova al prossimo poll */ }
    }
  }

  return NextResponse.json({ status: 'pending' })
}
