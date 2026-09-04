import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAffiliate } from '@/lib/affiliate/auth'
import { m } from '@/lib/i18n/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** IBAN normalizzato (senza spazi, maiuscolo) e validato in modo essenziale. */
function normIban(v: string): string { return v.replace(/\s+/g, '').toUpperCase() }
function ibanLooksValid(v: string): boolean { return /^[A-Z]{2}[0-9A-Z]{13,32}$/.test(v) }

export async function POST(req: Request) {
  const aff = await getAffiliate()
  if (!aff) return NextResponse.json({ error: m('notAuthenticated') }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { holder?: string; iban?: string; bankName?: string; country?: string }

  const holder = String(b.holder || '').trim().slice(0, 140)
  const iban = normIban(String(b.iban || '')).slice(0, 40)
  const bankName = String(b.bankName || '').trim().slice(0, 140)
  const country = String(b.country || '').trim().toUpperCase().slice(0, 2)

  if (!holder) return NextResponse.json({ error: m('enterAccountHolder') }, { status: 400 })
  if (!ibanLooksValid(iban)) return NextResponse.json({ error: m('invalidIban') }, { status: 400 })

  const sc = createServiceClient()
  const { error } = await sc.from('affiliate_bank').upsert({
    affiliate_id: aff.id, holder, iban, bank_name: bankName || null, country: country || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'affiliate_id' })
  if (error) return NextResponse.json({ error: m('saveFailed') }, { status: 500 })
  return NextResponse.json({ ok: true })
}
