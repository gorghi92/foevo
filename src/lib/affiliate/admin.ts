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

/**
 * Analitica dell'intero programma di affiliazione per la dashboard superadmin:
 * imbuto (click → iscrizioni → clienti attivi), rinnovi vs prime iscrizioni,
 * economia (ricavo generato, commissioni) e andamento degli ultimi 6 mesi.
 */
export interface AffiliateAnalytics {
  totalAffiliates: number; activeAffiliates: number
  clicks: number; referrals: number; conversions: number; activeCustomers: number
  signupRate: number; activeRate: number
  firstPayments: number; renewalPayments: number; renewalRate: number
  grossCents: number; earnedCents: number; availableCents: number; paidCents: number; reversedCents: number
  months: { key: string; label: string; conversions: number; grossCents: number }[]
}

export async function affiliateAnalytics(): Promise<AffiliateAnalytics> {
  const sc = createServiceClient()
  const [{ data: affs }, { data: refs }, { data: comms }] = await Promise.all([
    sc.from('affiliates').select('id, status, clicks'),
    sc.from('referrals').select('id, status, referred_user_id, converted_at'),
    sc.from('commissions').select('referral_id, base_amount_cents, amount_cents, month_index, status, created_at'),
  ])
  const affiliates = affs ?? [], referrals = refs ?? [], commissions = comms ?? []

  const totalAffiliates = affiliates.length
  const activeAffiliates = affiliates.filter((a) => a.status === 'active').length
  const clicks = affiliates.reduce((s, a) => s + (Number(a.clicks) || 0), 0)
  const converted = referrals.filter((r) => r.status === 'converted')
  const conversions = converted.length
  const signupRate = clicks > 0 ? conversions / clicks : 0

  // Clienti ancora attivi tra quelli portati (proxy di retention).
  const userIds = converted.map((r) => r.referred_user_id).filter(Boolean) as string[]
  let activeCustomers = 0
  if (userIds.length) {
    const { data: ents } = await sc.from('entitlements').select('user_id, status').in('user_id', userIds)
    activeCustomers = (ents ?? []).filter((e) => e.status === 'active').length
  }
  const activeRate = conversions > 0 ? activeCustomers / conversions : 0

  // Economia + rinnovi.
  let grossCents = 0, earnedCents = 0, availableCents = 0, paidCents = 0, reversedCents = 0
  let firstPayments = 0, renewalPayments = 0
  const renewedRefs = new Set<string>()
  // Andamento ultimi 6 mesi.
  const now = new Date()
  const buckets = new Map<string, { conversions: number; grossCents: number }>()
  const monthKeys: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthKeys.push(key); buckets.set(key, { conversions: 0, grossCents: 0 })
  }
  const keyOf = (iso: string | null) => {
    if (!iso) return null
    const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  for (const c of commissions) {
    const amt = Number(c.amount_cents) || 0, base = Number(c.base_amount_cents) || 0
    if (c.status === 'reversed') { reversedCents += amt; continue }
    grossCents += base; earnedCents += amt
    if (c.status === 'available') availableCents += amt
    else if (c.status === 'paid') paidCents += amt
    if ((Number(c.month_index) || 0) >= 2) { renewalPayments++; if (c.referral_id) renewedRefs.add(c.referral_id as string) }
    else firstPayments++
    const k = keyOf(c.created_at as string)
    if (k && buckets.has(k)) buckets.get(k)!.grossCents += base
  }
  const renewalRate = conversions > 0 ? renewedRefs.size / conversions : 0

  for (const r of converted) {
    const k = keyOf(r.converted_at as string)
    if (k && buckets.has(k)) buckets.get(k)!.conversions += 1
  }

  const MONTH_IT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
  const months = monthKeys.map((key) => {
    const b = buckets.get(key)!
    const m = Number(key.slice(5)) - 1
    return { key, label: MONTH_IT[m], conversions: b.conversions, grossCents: b.grossCents }
  })

  return {
    totalAffiliates, activeAffiliates, clicks, referrals: referrals.length, conversions, activeCustomers,
    signupRate, activeRate, firstPayments, renewalPayments, renewalRate,
    grossCents, earnedCents, availableCents, paidCents, reversedCents, months,
  }
}

/** Avvisi non letti per il superadmin (più il conteggio). */
export async function unreadAlerts(limit = 50) {
  const sc = createServiceClient()
  const [{ data }, { count }] = await Promise.all([
    sc.from('admin_alerts').select('id, kind, severity, title, body, commission_id, whop_payment_id, amount_cents, created_at')
      .eq('read', false).order('created_at', { ascending: false }).limit(limit),
    sc.from('admin_alerts').select('id', { count: 'exact', head: true }).eq('read', false),
  ])
  return { alerts: data ?? [], count: count ?? 0 }
}
