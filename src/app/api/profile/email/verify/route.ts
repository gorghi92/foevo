import { NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { guard, subjectKey } from '@/lib/rate-limit'
import { m } from '@/lib/i18n/api'
import { serverError } from '@/lib/api-error'

export const runtime = 'nodejs'

const MAX_ATTEMPTS = 5
const PURPOSE = 'email_change'

const hashCode = (email: string, code: string) =>
  createHash('sha256').update(`${email.toLowerCase()}:${code}`).digest('hex')

const safeEq = (a: string, b: string) => {
  try { return a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b)) } catch { return false }
}

/** Verifica il codice e applica il cambio email su account e profilo. */
export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: m('notAuthenticated') }, { status: 401 })

  const { code: rawCode } = (await req.json().catch(() => ({}))) as { code?: string }
  const code = String(rawCode || '').replace(/\D/g, '')
  if (code.length !== 6) return NextResponse.json({ error: m('enterSixDigitCode') }, { status: 400 })

  const blocked = await guard(req, [
    { bucket: 'email-verify-user', key: subjectKey(`user:${user.id}`), windowSeconds: 900, max: 15 },
  ])
  if (blocked) return blocked

  const sc = createServiceClient()
  const { data: otp } = await sc.from('extension_otp')
    .select('id, code_hash, expires_at, attempts, payload')
    .eq('email', user.id).eq('purpose', PURPOSE).is('used_at', null)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (!otp?.payload) return NextResponse.json({ error: m('noPendingEmailChange') }, { status: 400 })
  if (new Date(otp.expires_at as string).getTime() < Date.now()) {
    return NextResponse.json({ error: m('codeExpired') }, { status: 400 })
  }
  // Tentativo contato prima del confronto e con incremento atomico: leggere e
  // riscrivere `attempts` dal codice lasciava passare richieste parallele.
  const { data: attempts } = await sc.rpc('otp_attempt', { p_id: otp.id })
  const used = Number(attempts ?? MAX_ATTEMPTS)
  if (used > MAX_ATTEMPTS) {
    await sc.from('extension_otp').update({ used_at: new Date().toISOString() }).eq('id', otp.id)
    return NextResponse.json({ error: m('tooManyAttempts') }, { status: 429 })
  }

  const newEmail = String(otp.payload).toLowerCase()
  if (!safeEq(String(otp.code_hash), hashCode(newEmail, code))) {
    const left = MAX_ATTEMPTS - used
    return NextResponse.json(
      { error: left > 0 ? m('wrongCodeLeft', { n: left }) : m('wrongCode') },
      { status: 401 },
    )
  }

  // Ricontrolla che nel frattempo l'indirizzo non sia stato preso da altri.
  const { data: taken } = await sc.from('profiles').select('id').ilike('email', newEmail).maybeSingle()
  if (taken && taken.id !== user.id) {
    return NextResponse.json({ error: m('emailAlreadyUsed') }, { status: 409 })
  }

  const { error: upErr } = await sc.auth.admin.updateUserById(user.id, { email: newEmail, email_confirm: true })
  if (upErr) return serverError('profile/email/verify', upErr, 400)
  await sc.from('profiles').update({ email: newEmail }).eq('id', user.id)
  await sc.from('extension_otp').update({ used_at: new Date().toISOString() }).eq('id', otp.id)

  return NextResponse.json({ ok: true, email: newEmail })
}
