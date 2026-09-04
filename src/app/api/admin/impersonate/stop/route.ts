import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { m } from '@/lib/i18n/api'

export const runtime = 'nodejs'

/** Termina l'impersonificazione ripristinando la sessione del superadmin. */
export async function POST() {
  const jar = cookies()
  const raw = jar.get('imp_admin')?.value
  if (!raw) return NextResponse.json({ error: m('noActiveImpersonation') }, { status: 400 })

  let toks: { at?: string; rt?: string } = {}
  try { toks = JSON.parse(raw) } catch { return NextResponse.json({ error: m('invalidSession') }, { status: 400 }) }
  if (!toks.at || !toks.rt) return NextResponse.json({ error: m('invalidSession') }, { status: 400 })

  const supa = createClient()
  const { error } = await supa.auth.setSession({ access_token: toks.at, refresh_token: toks.rt })
  jar.delete('imp_admin')
  jar.delete('imp_active')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
