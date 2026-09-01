import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPassword, startSession } from '@/lib/affiliate/auth'
import { guard, ipKey, subjectKey } from '@/lib/rate-limit'
import { m } from '@/lib/i18n/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { username?: string; password?: string }
  const username = String(body.username || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!username || !password) {
    return NextResponse.json({ error: m('enterUsernameAndPassword') }, { status: 400 })
  }

  // Doppio freno: per IP (un attaccante che prova molti account) e per username
  // (una botnet che prova molte password sullo stesso account da IP diversi).
  const blocked = await guard(req, [
    { bucket: 'aff-login-ip', key: ipKey(req), windowSeconds: 900, max: 20 },
    { bucket: 'aff-login-user', key: subjectKey(`aff:${username}`), windowSeconds: 900, max: 8 },
  ])
  if (blocked) return blocked

  const sc = createServiceClient()
  const { data: aff } = await sc.from('affiliates')
    .select('id, password_hash, status').eq('username', username).maybeSingle()

  // Messaggio identico per utente inesistente e password errata: non riveliamo
  // quali username esistono.
  const fail = () => NextResponse.json({ error: m('wrongUsernameOrPassword') }, { status: 401 })
  if (!aff || !verifyPassword(password, String(aff.password_hash))) return fail()
  if (aff.status !== 'active') {
    return NextResponse.json({ error: m('accountSuspended') }, { status: 403 })
  }

  await startSession(aff.id as string)
  return NextResponse.json({ ok: true })
}
