import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { m } from '@/lib/i18n/api'

export const runtime = 'nodejs'

/** Storna una commissione: la mette a 'reversed' e la libera da eventuali richieste. */
export async function POST(req: Request) {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) return NextResponse.json({ error: m('superadminOnly') }, { status: 403 })
  const b = (await req.json().catch(() => ({}))) as { commissionId?: string }
  if (!b.commissionId) return NextResponse.json({ error: m('missingCommissionId') }, { status: 400 })
  const sc = createServiceClient()
  const { data: c } = await sc.from('commissions').select('id, status').eq('id', b.commissionId).maybeSingle()
  if (!c) return NextResponse.json({ error: m('commissionNotFound') }, { status: 404 })
  if (c.status === 'paid') return NextResponse.json({ error: m('alreadySettled'), code: 'already_paid' }, { status: 409 })
  await sc.from('commissions').update({ status: 'reversed', payout_request_id: null }).eq('id', b.commissionId)
  return NextResponse.json({ ok: true })
}
