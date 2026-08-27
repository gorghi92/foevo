import { NextResponse } from 'next/server'
import { createHash, randomInt } from 'crypto'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { sendEmail, emailChangeOtpEmail, emailConfigured } from '@/lib/email'

export const runtime = 'nodejs'

const TTL_MIN = 10
const COOLDOWN_S = 30
const PURPOSE = 'email_change'

const hashCode = (email: string, code: string) =>
  createHash('sha256').update(`${email.toLowerCase()}:${code}`).digest('hex')

/** Invia un codice di conferma al NUOVO indirizzo: il cambio avviene solo dopo la verifica. */
export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  if (!(await emailConfigured())) return NextResponse.json({ error: 'Invio email non configurato' }, { status: 503 })

  const { email: raw } = (await req.json().catch(() => ({}))) as { email?: string }
  const newEmail = String(raw || '').trim().toLowerCase()
  if (!newEmail || !newEmail.includes('@')) return NextResponse.json({ error: 'Email non valida' }, { status: 400 })
  if (newEmail === String(user.email || '').toLowerCase()) {
    return NextResponse.json({ error: 'È già la tua email attuale.' }, { status: 400 })
  }

  const sc = createServiceClient()
  const { data: taken } = await sc.from('profiles').select('id').ilike('email', newEmail).maybeSingle()
  if (taken) return NextResponse.json({ error: 'Questa email è già usata da un altro account.' }, { status: 409 })

  // Anti-spam per utente.
  const { data: last } = await sc.from('extension_otp')
    .select('created_at').eq('email', user.id).eq('purpose', PURPOSE)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (last?.created_at && Date.now() - new Date(last.created_at as string).getTime() < COOLDOWN_S * 1000) {
    return NextResponse.json({ error: 'Hai già richiesto un codice: attendi qualche secondo.' }, { status: 429 })
  }

  // La riga è indicizzata sull'id utente; il nuovo indirizzo sta in payload.
  await sc.from('extension_otp').update({ used_at: new Date().toISOString() })
    .eq('email', user.id).eq('purpose', PURPOSE).is('used_at', null)

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await sc.from('extension_otp').insert({
    email: user.id, purpose: PURPOSE, payload: newEmail,
    code_hash: hashCode(newEmail, code),
    expires_at: new Date(Date.now() + TTL_MIN * 60_000).toISOString(),
  })

  const { subject, html } = emailChangeOtpEmail(code, newEmail)
  const sent = await sendEmail({ to: newEmail, subject, html })
  if (!sent) return NextResponse.json({ error: 'Invio email non riuscito' }, { status: 502 })

  return NextResponse.json({ ok: true, email: newEmail, ttlMinutes: TTL_MIN })
}
