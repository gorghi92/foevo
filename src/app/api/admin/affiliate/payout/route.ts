import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'

export const runtime = 'nodejs'

/**
 * Evasione di una richiesta di pagamento.
 *  - 'paid'     → segna la richiesta pagata e porta a 'paid' le commissioni collegate.
 *  - 'rejected' → rifiuta e "libera" le commissioni (tornano disponibili).
 */
export async function POST(req: Request) {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  const b = (await req.json().catch(() => ({}))) as { id?: string; action?: 'paid' | 'rejected'; note?: string }
  if (!b.id || !['paid', 'rejected'].includes(String(b.action))) {
    return NextResponse.json({ error: 'Parametri non validi' }, { status: 400 })
  }

  const sc = createServiceClient()
  const { data: pr } = await sc.from('payout_requests').select('id, status').eq('id', b.id).maybeSingle()
  if (!pr) return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 })
  if (pr.status !== 'requested') return NextResponse.json({ error: 'Richiesta già evasa' }, { status: 409 })

  const now = new Date().toISOString()
  await sc.from('payout_requests').update({
    status: b.action, processed_at: now, note: String(b.note || '').slice(0, 500) || null,
  }).eq('id', b.id)

  if (b.action === 'paid') {
    await sc.from('commissions').update({ status: 'paid' }).eq('payout_request_id', b.id)
  } else {
    // Rifiutata: le commissioni tornano disponibili per una nuova richiesta.
    await sc.from('commissions').update({ payout_request_id: null }).eq('payout_request_id', b.id)
  }
  return NextResponse.json({ ok: true })
}
