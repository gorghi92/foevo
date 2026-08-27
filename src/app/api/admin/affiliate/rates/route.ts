import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { clearSettingsCache } from '@/lib/settings'
import { getAffiliateRules } from '@/lib/affiliate/commission'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Valori correnti, sempre freschi dal DB: usato dal form per non mostrare mai
 *  una copia in cache del router/Next. */
export async function GET() {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  const r = await getAffiliateRules(true)
  return NextResponse.json({
    basePct: r.baseBps / 100, premiumPct: r.premiumBps / 100,
    minEur: r.minPayoutCents / 100, months: r.commissionMonths,
  }, { headers: { 'Cache-Control': 'no-store' } })
}

const bps = (pct: unknown) => Math.max(0, Math.min(10000, Math.round(Number(pct) * 100)))
const cents = (eur: unknown) => Math.max(0, Math.round(Number(eur) * 100))
const int = (v: unknown, min: number, max: number) => Math.max(min, Math.min(max, Math.round(Number(v))))

/** Salva le percentuali di affiliazione (inserite in % ed € dall'admin). */
export async function POST(req: Request) {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })

  const b = (await req.json().catch(() => ({}))) as { basePct?: number; premiumPct?: number; minEur?: number; months?: number }
  const rows = [
    { key: 'AFFILIATE_RATE_BASE_BPS', value: String(bps(b.basePct)) },
    { key: 'AFFILIATE_RATE_PREMIUM_BPS', value: String(bps(b.premiumPct)) },
    { key: 'AFFILIATE_MIN_PAYOUT_CENTS', value: String(cents(b.minEur)) },
    { key: 'AFFILIATE_COMMISSION_MONTHS', value: String(int(b.months, 1, 120)) },
  ].map((r) => ({ ...r, updated_at: new Date().toISOString() }))

  const { error } = await createServiceClient().from('app_settings').upsert(rows, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  clearSettingsCache()
  return NextResponse.json({ ok: true })
}
