import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { getWhopConfig } from '@/lib/settings'

export const runtime = 'nodejs'

/** Annulla l'abbonamento su Whop (a fine periodo): l'accesso resta fino al rinnovo. */
export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const sc = createServiceClient()
  const { data: ent } = await sc.from('entitlements')
    .select('whop_membership_id, source, status').eq('user_id', user.id).maybeSingle()
  if (!ent || ent.source !== 'whop' || !ent.whop_membership_id) {
    return NextResponse.json({ error: 'Nessun abbonamento Whop da annullare' }, { status: 400 })
  }

  const { apiKey } = await getWhopConfig()
  if (!apiKey) return NextResponse.json({ error: 'Configurazione Whop mancante' }, { status: 500 })

  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' }
  let ok = false
  let lastErr = ''
  for (const url of [
    `https://api.whop.com/api/v2/memberships/${ent.whop_membership_id}/cancel`,
    `https://api.whop.com/api/v1/memberships/${ent.whop_membership_id}/cancel`,
  ]) {
    try {
      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ cancel_at_period_end: true }) })
      if (r.ok) { ok = true; break }
      lastErr = `${r.status} ${(await r.text().catch(() => '')).slice(0, 120)}`
    } catch (e: any) { lastErr = String(e?.message || e) }
  }
  if (!ok) return NextResponse.json({ error: `Impossibile annullare su Whop (${lastErr})` }, { status: 502 })

  await sc.from('entitlements').update({ cancel_at_period_end: true, updated_at: new Date().toISOString() }).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
