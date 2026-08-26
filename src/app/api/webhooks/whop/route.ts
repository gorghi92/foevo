import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createHmac, timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function verify(raw: string, sig: string): boolean {
  const secret = process.env.WHOP_WEBHOOK_SECRET
  if (!secret) return false
  const expected = createHmac('sha256', secret).update(raw).digest('hex')
  try { return timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) } catch { return false }
}

export async function POST(req: Request) {
  const raw = await req.text()
  const sig = req.headers.get('x-whop-signature') ?? ''
  if (!verify(raw, sig)) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })

  let payload: any
  try { payload = JSON.parse(raw) } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const event = payload?.event as string
  const data = payload?.data ?? {}
  const email: string | null = data?.user?.email ?? data?.email ?? data?.metadata?.email ?? null
  const plan: string | null = data?.plan ?? data?.plan_id ?? data?.metadata?.plan_id ?? null
  const membershipId: string | null = data?.id ?? null

  const sc = createServiceClient()
  let userId: string | null = null
  if (email) {
    const { data: prof } = await sc.from('profiles').select('id').eq('email', email).maybeSingle()
    userId = (prof?.id as string) ?? null
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
