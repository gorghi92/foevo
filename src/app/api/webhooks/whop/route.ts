import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getWhopConfig } from '@/lib/settings'
import { createHmac, timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function safeEq(a: string, b: string): boolean {
  try { return a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b)) } catch { return false }
}

/**
 * Verifica la firma "Standard Webhooks" usata da Whop:
 * header webhook-id / webhook-timestamp / webhook-signature ("v1,<base64>"),
 * contenuto firmato = `${id}.${timestamp}.${rawBody}`, HMAC-SHA256 in base64.
 * Proviamo sia la chiave grezza (come da doc Whop) sia quella base64-decodificata
 * (schema canonico), così funziona a prescindere dalla derivazione.
 */
function verifyWhop(raw: string, headers: Headers, secret: string): boolean {
  if (!secret) return false
  const id = headers.get('webhook-id') || ''
  const ts = headers.get('webhook-timestamp') || ''
  const sigHeader = headers.get('webhook-signature') || ''
  if (!id || !ts || !sigHeader) {
    // Fallback legacy: HMAC hex su body con header x-whop-signature.
    const legacy = headers.get('x-whop-signature') || ''
    if (!legacy) return false
    return safeEq(legacy, createHmac('sha256', secret).update(raw).digest('hex'))
  }
  // Anti-replay: rifiuta timestamp oltre 10 minuti di scarto (se numerico).
  const tsNum = Number(ts)
  if (Number.isFinite(tsNum) && Math.abs(Date.now() / 1000 - tsNum) > 600) return false

  const signedContent = `${id}.${ts}.${raw}`
  const keys: Buffer[] = [Buffer.from(secret, 'utf8')]
  const b64part = secret.includes('_') ? secret.split('_').slice(1).join('_') : secret
  try { const k = Buffer.from(b64part, 'base64'); if (k.length) keys.push(k) } catch { /* ignora */ }

  const expected = keys.map((k) => createHmac('sha256', k).update(signedContent).digest('base64'))
  const provided = sigHeader.split(' ').map((p) => (p.includes(',') ? p.split(',')[1] : p)).filter(Boolean)
  return provided.some((p) => expected.some((e) => safeEq(p, e)))
}

/** Best-effort: risolve l'email del cliente via API Whop quando il payload non la include. */
async function resolveWhopEmail(apiKey: string, ids: { membershipId?: string | null; userId?: string | null }): Promise<string | null> {
  if (!apiKey) return null
  const urls: string[] = []
  if (ids.membershipId) urls.push(`https://api.whop.com/api/v2/memberships/${ids.membershipId}`)
  if (ids.userId) urls.push(`https://api.whop.com/api/v2/users/${ids.userId}`, `https://api.whop.com/api/v2/members/${ids.userId}`)
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' } })
      if (!r.ok) continue
      const j: any = await r.json()
      const d = j?.data ?? j
      const email = d?.email ?? d?.user_email ?? d?.user?.email ?? null
      if (email) return String(email)
    } catch { /* prova il prossimo */ }
  }
  return null
}

export async function POST(req: Request) {
  const raw = await req.text()
  const { webhookSecret, apiKey } = await getWhopConfig()
  if (!verifyWhop(raw, req.headers, webhookSecret)) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })

  let payload: any
  try { payload = JSON.parse(raw) } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  // Whop invia l'evento come `action` (a volte `event`); normalizziamo.
  const event: string = String(payload?.action ?? payload?.event ?? '').replace(/_/g, '.')
  const data = payload?.data ?? {}
  const membershipId: string | null = data?.id ?? data?.membership_id ?? data?.membership ?? null
  const whopUserId: string | null = data?.user_id ?? (typeof data?.user === 'string' ? data.user : data?.user?.id) ?? null
  const plan: string | null = data?.plan_id ?? data?.plan?.id ?? (typeof data?.plan === 'string' ? data.plan : null) ?? data?.metadata?.plan_id ?? null

  let email: string | null =
    data?.user?.email ?? data?.email ?? data?.user_email ?? data?.member?.email ?? data?.metadata?.email ?? null
  if (!email) email = await resolveWhopEmail(apiKey, { membershipId, userId: whopUserId })

  const sc = createServiceClient()
  let userId: string | null = null
  if (email) {
    const { data: prof } = await sc.from('profiles').select('id').ilike('email', email).maybeSingle()
    userId = (prof?.id as string) ?? null
  }

  // Pagamenti: registrati anche senza utente collegato (per i ricavi/le fatture).
  if (event === 'payment.succeeded') {
    const rawAmt = Number(data?.final_amount ?? data?.amount ?? data?.subtotal ?? 0)
    // Whop può inviare importi in centesimi (interi) o in unità maggiori (decimali).
    const cents = Math.round(rawAmt * (Number.isInteger(rawAmt) ? 1 : 100))
    await sc.from('payments').upsert({
      user_id: userId, email,
      amount_cents: cents, currency: String(data?.currency || 'EUR').toUpperCase(), status: 'paid',
      whop_payment_id: data?.id ?? null,
      whop_membership_id: data?.membership_id ?? data?.membership ?? null,
      plan, description: data?.plan_name ?? data?.product ?? 'Abbonamento Foevo',
      created_at: data?.created_at ? new Date(Number(data.created_at) * 1000).toISOString() : new Date().toISOString(),
    }, { onConflict: 'whop_payment_id' })
    return NextResponse.json({ ok: true })
  }

  if (!userId) return NextResponse.json({ ok: true, note: 'no matching user' })

  if (event === 'membership.went_valid' && plan) {
    const { data: pkg } = await sc.from('packages')
      .select('id, tier, monthly_quota, unlimited').eq('whop_plan_id', plan).eq('active', true).maybeSingle()
    if (pkg) {
      const renewal = data?.renewal_period_end ?? null
      await sc.from('entitlements').upsert({
        user_id: userId, package_id: (pkg as any).id, tier: (pkg as any).tier,
        monthly_quota: (pkg as any).monthly_quota, unlimited: (pkg as any).unlimited,
        status: 'active', source: 'whop', whop_membership_id: membershipId,
        current_period_end: renewal ? new Date(renewal * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    }
  } else if (event === 'membership.went_invalid') {
    await sc.from('entitlements').update({ status: 'past_due', updated_at: new Date().toISOString() }).eq('user_id', userId).eq('source', 'whop')
  } else if (event === 'membership.cancelled') {
    await sc.from('entitlements').update({ status: 'canceled', updated_at: new Date().toISOString() }).eq('user_id', userId).eq('source', 'whop')
  }
  return NextResponse.json({ ok: true })
}
