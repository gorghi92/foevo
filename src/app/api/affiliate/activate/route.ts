import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { hashPassword, uniqueCode, startSession } from '@/lib/affiliate/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const USERNAME_RE = /^[a-z0-9._-]{3,32}$/

/**
 * "Consiglia a un amico": un utente Foevo loggato attiva il proprio account
 * affiliato, collegato al suo user_id. Riusa la stessa struttura degli affiliati
 * indipendenti (stesse tabelle, stesso link, stesse commissioni).
 */
export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const sc = createServiceClient()
  // Già affiliato? Apri semplicemente la sessione.
  const { data: existing } = await sc.from('affiliates').select('id').eq('user_id', user.id).maybeSingle()
  if (existing) { await startSession(existing.id); return NextResponse.json({ ok: true, already: true }) }

  const b = (await req.json().catch(() => ({}))) as { username?: string; password?: string }
  const username = String(b.username || '').trim().toLowerCase()
  const password = String(b.password || '')
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json({ error: 'Username: 3–32 caratteri, lettere minuscole, numeri, . _ -' }, { status: 400 })
  }
  if (password.length < 8) return NextResponse.json({ error: 'La password deve avere almeno 8 caratteri.' }, { status: 400 })

  const { data: taken } = await sc.from('affiliates').select('id').eq('username', username).maybeSingle()
  if (taken) return NextResponse.json({ error: 'Username già in uso.' }, { status: 409 })

  const code = await uniqueCode(sc)
  const { data: created, error } = await sc.from('affiliates').insert({
    username, email: user.email, full_name: (user.user_metadata as any)?.full_name || null,
    password_hash: hashPassword(password), code, user_id: user.id,
  }).select('id').single()
  if (error || !created) return NextResponse.json({ error: 'Attivazione non riuscita, riprova.' }, { status: 409 })

  await startSession(created.id)
  return NextResponse.json({ ok: true })
}
