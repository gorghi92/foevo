import { createServiceClient } from '@/lib/supabase/server'
import { getAffiliateRules } from './commission'

/** Base URL dell'app, per comporre il link referral. */
export const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || 'https://foevo.app').replace(/\/$/, '')
export const referralLink = (code: string) => `${appUrl()}/r/${code}`

export interface AffiliateOverview {
  clicks: number
  conversions: number
  earnedCents: number      // tutte le commissioni non stornate
  availableCents: number   // disponibili al prelievo
  paidCents: number        // già liquidate
  pendingPayoutCents: number // in richieste aperte
  minPayoutCents: number
}

export async function affiliateOverview(affiliateId: string): Promise<AffiliateOverview> {
  const sc = createServiceClient()
  const rules = await getAffiliateRules()

  const [{ data: aff }, { count: conversions }, { data: comms }, { data: payouts }] = await Promise.all([
    sc.from('affiliates').select('clicks').eq('id', affiliateId).maybeSingle(),
    sc.from('referrals').select('id', { count: 'exact', head: true }).eq('affiliate_id', affiliateId).eq('status', 'converted'),
    sc.from('commissions').select('amount_cents, status').eq('affiliate_id', affiliateId),
    sc.from('payout_requests').select('amount_cents, status').eq('affiliate_id', affiliateId).eq('status', 'requested'),
  ])
  const clicks = Number((aff as any)?.clicks) || 0

  let earned = 0, available = 0, paid = 0
  for (const c of comms ?? []) {
    const a = Number(c.amount_cents) || 0
    if (c.status === 'reversed') continue
    earned += a
    if (c.status === 'available') available += a
    else if (c.status === 'paid') paid += a
  }
  const pendingPayout = (payouts ?? []).reduce((s, p) => s + (Number(p.amount_cents) || 0), 0)

  return {
    clicks,
    conversions: conversions ?? 0,
    earnedCents: earned,
    availableCents: available,
    paidCents: paid,
    pendingPayoutCents: pendingPayout,
    minPayoutCents: rules.minPayoutCents,
  }
}

export async function recentCommissions(affiliateId: string, limit = 50) {
  const sc = createServiceClient()
  const { data } = await sc.from('commissions')
    .select('id, amount_cents, base_amount_cents, rate_bps, plan_slug, month_index, status, created_at')
    .eq('affiliate_id', affiliateId).order('created_at', { ascending: false }).limit(limit)
  return data ?? []
}

export async function payoutHistory(affiliateId: string, limit = 30) {
  const sc = createServiceClient()
  const { data } = await sc.from('payout_requests')
    .select('id, amount_cents, status, requested_at, processed_at, note')
    .eq('affiliate_id', affiliateId).order('requested_at', { ascending: false }).limit(limit)
  return data ?? []
}

export async function affiliateBank(affiliateId: string) {
  const sc = createServiceClient()
  const { data } = await sc.from('affiliate_bank')
    .select('holder, iban, bank_name, country').eq('affiliate_id', affiliateId).maybeSingle()
  return data ?? null
}
