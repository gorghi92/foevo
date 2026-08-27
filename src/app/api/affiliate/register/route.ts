import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { hashPassword, uniqueCode, startSession } from '@/lib/affiliate/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const USERNAME_RE = /^[a-z0-9._-]{3,32}$/

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    username?: string; email?: string; password?: string; fullName?: string; userId?: string
  }
  const username = String(body.username || '').trim().toLowerCase()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const fullName = String(body.fullName || '').trim().slice(0, 120)

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json({ error: 'Username: 3–32 caratteri, solo lettere minuscole, numeri, . _ -' }, { status: 400 })
  }
  if (!email.includes('@') || email.length < 5) {
    return NextResponse.json({ error: 'Inserisci un indirizzo email valido.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'La password deve avere almeno 8 caratteri.' }, { status: 400 })
  }

  const sc = createServiceClient()

  const { data: exists } = await sc.from('affiliates').select('id').eq('username', username).maybeSingle()
  if (exists) return NextResponse.json({ error: 'Username già in uso: scegline un altro.' }, { status: 409 })

  const code = await uniqueCode(sc)
  const { data: created, error } = await sc.from('affiliates').insert({
    username, email, full_name: fullName || null,
    password_hash: hashPassword(password), code,
    user_id: body.userId || null,
  }).select('id, code').single()

  if (error || !created) {
    // Corsa sull'unicità (username o code) → riprova a segnalarlo con chiarezza.
    const msg = /username/i.test(error?.message || '') ? 'Username già in uso.' : 'Registrazione non riuscita, riprova.'
    return NextResponse.json({ error: msg }, { status: 409 })
  }

  await startSession(created.id)
  return NextResponse.json({ ok: true, code: created.code })
}
