import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAffiliate } from '@/lib/affiliate/auth'
import { getAffiliateRules } from '@/lib/affiliate/commission'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Richiesta di pagamento: raccoglie tutte le commissioni "available", verifica
 * il minimo e le coordinate, crea la richiesta e "impegna" quelle commissioni
 * marcandole con il payout_request_id (così non finiscono in due richieste).
 */
export async function POST() {
  const aff = await getAffiliate()
  if (!aff) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const sc = createServiceClient()
  const rules = await getAffiliateRules()

  const { data: bank } = await sc.from('affiliate_bank')
    .select('holder, iban').eq('affiliate_id', aff.id).maybeSingle()
  if (!bank?.iban || !bank?.holder) {
    return NextResponse.json({ error: 'Prima inserisci le coordinate bancarie (IBAN e intestatario).', code: 'no_bank' }, { status: 400 })
  }

  const { data: comms } = await sc.from('commissions')
    .select('id, amount_cents').eq('affiliate_id', aff.id).eq('status', 'available').is('payout_request_id', null)
  const ids = (comms ?? []).map((c) => c.id)
  const total = (comms ?? []).reduce((s, c) => s + (Number(c.amount_cents) || 0), 0)

  if (total < rules.minPayoutCents) {
    return NextResponse.json({
      error: `Il minimo per richiedere il pagamento è €${(rules.minPayoutCents / 100).toFixed(2)}. Disponibili: €${(total / 100).toFixed(2)}.`,
      code: 'below_min',
    }, { status: 400 })
  }

  const { data: pr, error } = await sc.from('payout_requests').insert({
    affiliate_id: aff.id, amount_cents: total, status: 'requested',
    holder_snapshot: bank.holder, iban_snapshot: bank.iban,
  }).select('id').single()
  if (error || !pr) return NextResponse.json({ error: 'Richiesta non riuscita, riprova.' }, { status: 500 })

  // Impegna le commissioni: legate alla richiesta, non più prelevabili altrove.
  await sc.from('commissions').update({ payout_request_id: pr.id }).in('id', ids)

  return NextResponse.json({ ok: true, amountCents: total })
}
