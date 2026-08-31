import { NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { generateKey } from '@/server/api-key'
import { m } from '@/lib/i18n/api'

export const runtime = 'nodejs'

const MAX_ATTEMPTS = 5

const hashCode = (email: string, code: string) =>
  createHash('sha256').update(`${email.toLowerCase()}:${code}`).digest('hex')

const safeEq = (a: string, b: string) => {
  try { return a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b)) } catch { return false }
}

/**
 * Verifica il codice OTP e, se valido, emette la API key del device per
 * l'estensione (stessa chiave che prima si otteneva con email+password).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; code?: string }
  const email = String(body.email || '').trim().toLowerCase()
  const code = String(body.code || '').replace(/\D/g, '')
  if (!email || code.length !== 6) return NextResponse.json({ error: m('emailAndCodeRequired') }, { status: 400 })

  const sc = createServiceClient()
  const { data: otp } = await sc.from('extension_otp')
    .select('id, code_hash, expires_at, attempts')
    .eq('email', email).eq('purpose', 'extension').is('used_at', null)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (!otp) return NextResponse.json({ error: m('noActiveCode') }, { status: 400 })
  if (new Date(otp.expires_at as string).getTime() < Date.now()) {
    return NextResponse.json({ error: m('codeExpired') }, { status: 400 })
  }
  if ((otp.attempts as number) >= MAX_ATTEMPTS) {
    await sc.from('extension_otp').update({ used_at: new Date().toISOString() }).eq('id', otp.id)
    return NextResponse.json({ error: m('tooManyAttempts') }, { status: 429 })
  }

  if (!safeEq(String(otp.code_hash), hashCode(email, code))) {
    await sc.from('extension_otp').update({ attempts: (otp.attempts as number) + 1 }).eq('id', otp.id)
    const left = MAX_ATTEMPTS - (otp.attempts as number) - 1
    return NextResponse.json({ error: left > 0 ? `Codice errato (${left} tentativi rimasti).` : 'Codice errato.' }, { status: 401 })
  }

  const { data: prof } = await sc.from('profiles').select('id, email').ilike('email', email).maybeSingle()
  if (!prof) return NextResponse.json({ error: m('accountNotFound') }, { status: 404 })

  // Consuma il codice: da qui in poi non è più riutilizzabile.
  await sc.from('extension_otp').update({ used_at: new Date().toISOString() }).eq('id', otp.id)

  // Revoca le vecchie chiavi dell'estensione ed emette quella nuova.
  await sc.from('api_keys').update({ revoked_at: new Date().toISOString() })
    .eq('user_id', prof.id).eq('name', 'Estensione').is('revoked_at', null)

  const { key, hash, prefix } = generateKey()
  const { error: insErr } = await sc.from('api_keys')
    .insert({ user_id: prof.id, name: 'Estensione', key_hash: hash, prefix, scopes: ['analyze:write'] })
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json({ key, email: prof.email ?? email })
}
