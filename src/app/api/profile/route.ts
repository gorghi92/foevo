import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { m } from '@/lib/i18n/api'
import { serverError } from '@/lib/api-error'

export const runtime = 'nodejs'

const clean = (v: unknown) => { const s = String(v ?? '').trim(); return s || null }

/** Aggiorna nome/cognome e/o dati di fatturazione del profilo (update parziale). */
export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: m('notAuthenticated') }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>

  const patch: Record<string, string | null> = {}
  if ('firstName' in b || 'lastName' in b) {
    const first = clean(b.firstName), last = clean(b.lastName)
    patch.first_name = first
    patch.last_name = last
    patch.full_name = [first, last].filter(Boolean).join(' ') || null
  }
  const map: Record<string, string> = {
    billingName: 'billing_name', billingVat: 'billing_vat', billingCf: 'billing_cf',
    billingAddress: 'billing_address', billingCity: 'billing_city', billingZip: 'billing_zip', billingCountry: 'billing_country',
  }
  for (const [k, col] of Object.entries(map)) if (k in b) patch[col] = clean(b[k])

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: m('nothingToUpdate') }, { status: 400 })

  const sc = createServiceClient()
  const { error } = await sc.from('profiles').update(patch).eq('id', user.id)
  if (error) return serverError('profile', error)
  return NextResponse.json({ ok: true })
}
