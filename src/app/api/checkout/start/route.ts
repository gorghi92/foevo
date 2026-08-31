import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { recordReferral } from '@/lib/affiliate/attribute'
import { m } from '@/lib/i18n/api'

export const runtime = 'nodejs'

/**
 * Avvia il checkout SENZA creare l'account: memorizza i dati inseriti in un
 * cookie firmato lato server e restituisce il piano Whop da caricare. L'account
 * verrà creato solo a pagamento confermato (dal webhook), e al ritorno l'utente
 * verrà loggato automaticamente in base a questo cookie.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; firstName?: string; lastName?: string; plan?: string }
  const email = String(body.email || '').trim().toLowerCase()
  const plan = String(body.plan || '').trim()
  if (!email || !email.includes('@')) return NextResponse.json({ error: m('invalidEmail') }, { status: 400 })
  if (!plan) return NextResponse.json({ error: m('planMissing') }, { status: 400 })
  const full_name = `${body.firstName || ''} ${body.lastName || ''}`.trim()

  const sc = createServiceClient()
  const { data: pkg } = await sc.from('packages').select('name, whop_plan_id, price_monthly, active').eq('slug', plan).maybeSingle()
  if (!pkg || !pkg.active) return NextResponse.json({ error: m('planUnavailable') }, { status: 404 })
  if (!pkg.whop_plan_id) return NextResponse.json({ error: m('checkoutNotConfigured') }, { status: 409 })

  cookies().set('fv_signup', JSON.stringify({ email, full_name, plan }), {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60,
  })

  // Se l'utente arriva da un link affiliato (cookie fv_ref), lega ora l'email
  // all'affiliato: la commissione maturerà quando il webhook conferma il pagamento.
  const ref = cookies().get('fv_ref')?.value
  if (ref) { try { await recordReferral(sc, ref, email) } catch (e) { console.error('[foevo] recordReferral', e) } }

  return NextResponse.json({ planId: pkg.whop_plan_id, planName: pkg.name, price: pkg.price_monthly, email, fullName: full_name })
}
