import { createServiceClient } from '@/lib/supabase/server'

/** Dati aggregati per il pannello superadmin dell'affiliazione. */

export interface AdminAffiliateRow {
  id: string; username: string; email: string; full_name: string | null
  code: string; status: string; clicks: number; overrideBps: number | null
  conversions: number; earnedCents: number; availableCents: number; paidCents: number
  createdAt: string
}

export async function listAffiliates(): Promise<AdminAffiliateRow[]> {
  const sc = createServiceClient()
  const { data: affs } = await sc.from('affiliates')
    .select('id, username, email, full_name, code, status, clicks, commission_override_bps, created_at')
    .order('created_at', { ascending: false })
  if (!affs?.length) return []

  const ids = affs.map((a) => a.id)
  const [{ data: comms }, { data: convs }] = await Promise.all([
    sc.from('commissions').select('affiliate_id, amount_cents, status').in('affiliate_id', ids),
    sc.from('referrals').select('affiliate_id').eq('status', 'converted').in('affiliate_id', ids),
  ])

  const money = new Map<string, { earned: number; available: number; paid: number }>()
  for (const c of comms ?? []) {
    if (c.status === 'reversed') continue
    const m = money.get(c.affiliate_id) ?? { earned: 0, available: 0, paid: 0 }
    const a = Number(c.amount_cents) || 0
    m.earned += a
    if (c.status === 'available') m.available += a
    else if (c.status === 'paid') m.paid += a
    money.set(c.affiliate_id, m)
  }
  const convCount = new Map<string, number>()
  for (const r of convs ?? []) convCount.set(r.affiliate_id, (convCount.get(r.affiliate_id) ?? 0) + 1)

  return affs.map((a) => {
    const m = money.get(a.id) ?? { earned: 0, available: 0, paid: 0 }
    return {
      id: a.id, username: a.username, email: a.email, full_name: a.full_name,
      code: a.code, status: a.status, clicks: Number(a.clicks) || 0,
      overrideBps: (a.commission_override_bps as number | null) ?? null,
      conversions: convCount.get(a.id) ?? 0,
      earnedCents: m.earned, availableCents: m.available, paidCents: m.paid,
      createdAt: a.created_at as string,
    }
  })
}

export async function affiliateDetail(id: string) {
  const sc = createServiceClient()
  const { data: aff } = await sc.from('affiliates')
    .select('id, username, email, full_name, code, status, clicks, commission_override_bps, created_at, user_id')
    .eq('id', id).maybeSingle()
  if (!aff) return null

  const [{ data: bank }, { data: referrals }, { data: comms }, { data: payouts }] = await Promise.all([
    sc.from('affiliate_bank').select('holder, iban, bank_name, country').eq('affiliate_id', id).maybeSingle(),
    sc.from('referrals').select('id, referred_email, referred_user_id, status, converted_at, created_at')
      .eq('affiliate_id', id).order('created_at', { ascending: false }).limit(200),
    sc.from('commissions').select('id, amount_cents, base_amount_cents, rate_bps, plan_slug, month_index, status, created_at')
      .eq('affiliate_id', id).order('created_at', { ascending: false }).limit(200),
    sc.from('payout_requests').select('id, amount_cents, status, requested_at, processed_at, note, iban_snapshot, holder_snapshot')
      .eq('affiliate_id', id).order('requested_at', { ascending: false }).limit(50),
  ])

  return { aff, bank: bank ?? null, referrals: referrals ?? [], comms: comms ?? [], payouts: payouts ?? [] }
}

/** Tutte le richieste di pagamento aperte, con l'affiliato. */
export async function openPayouts() {
  const sc = createServiceClient()
  const { data } = await sc.from('payout_requests')
    .select('id, affiliate_id, amount_cents, status, requested_at, holder_snapshot, iban_snapshot')
    .eq('status', 'requested').order('requested_at', { ascending: true })
  const rows = data ?? []
  if (!rows.length) return []
  const ids = Array.from(new Set(rows.map((r) => r.affiliate_id)))
  const { data: affs } = await sc.from('affiliates').select('id, username, email').in('id', ids)
  const byId = new Map((affs ?? []).map((a) => [a.id, a]))
  return rows.map((r) => ({ ...r, affiliate: byId.get(r.affiliate_id) ?? null }))
}
