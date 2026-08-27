import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'crypto'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Autenticazione degli affiliati: credenziali proprie (username + password) e
 * sessioni nostre, separate dall'auth Supabase. Le password sono hashate con
 * scrypt; le sessioni sono token opachi di cui salviamo solo lo sha256.
 */

export const AFFILIATE_COOKIE = 'fv_aff'
const SESSION_DAYS = 30

// ---- password (scrypt) ----
export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 32)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = String(stored || '').split(':')
  if (!saltHex || !hashHex) return false
  try {
    const expected = Buffer.from(hashHex, 'hex')
    const got = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length)
    return expected.length === got.length && timingSafeEqual(expected, got)
  } catch {
    return false
  }
}

// ---- codice referral (mai due uguali: unicità garantita dal DB) ----
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // niente 0/O/1/I: leggibili
export function randomCode(len = 8): string {
  const b = randomBytes(len)
  let out = ''
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[b[i] % CODE_ALPHABET.length]
  return out
}

/** Genera un codice non ancora presente in `affiliates.code`. */
export async function uniqueCode(sc: ReturnType<typeof createServiceClient>): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const code = randomCode(8)
    const { data } = await sc.from('affiliates').select('id').eq('code', code).maybeSingle()
    if (!data) return code
  }
  // Estrema improbabilità: allunga il codice.
  return randomCode(12)
}

// ---- sessioni ----
const tokenHash = (raw: string) => createHash('sha256').update(raw).digest('hex')

/** Crea una sessione e imposta il cookie. Ritorna il token grezzo. */
export async function startSession(affiliateId: string): Promise<void> {
  const raw = randomBytes(32).toString('base64url')
  const sc = createServiceClient()
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5)
  await sc.from('affiliate_sessions').insert({
    token_hash: tokenHash(raw), affiliate_id: affiliateId, expires_at: expires.toISOString(),
  })
  cookies().set(AFFILIATE_COOKIE, raw, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', expires,
  })
}

export interface AffiliateSession {
  id: string; username: string; email: string; full_name: string | null
  code: string; status: string; user_id: string | null; commission_override_bps: number | null
}

/** Legge la sessione dal cookie, o null. */
export async function getAffiliate(): Promise<AffiliateSession | null> {
  const raw = cookies().get(AFFILIATE_COOKIE)?.value
  if (!raw) return null
  const sc = createServiceClient()
  const { data: sess } = await sc.from('affiliate_sessions')
    .select('affiliate_id, expires_at').eq('token_hash', tokenHash(raw)).maybeSingle()
  if (!sess || new Date(sess.expires_at as string).getTime() < Date.now()) return null
  const { data: aff } = await sc.from('affiliates')
    .select('id, username, email, full_name, code, status, user_id, commission_override_bps')
    .eq('id', sess.affiliate_id).maybeSingle()
  if (!aff || aff.status !== 'active') return null
  return aff as AffiliateSession
}

/** Elimina la sessione corrente e cancella il cookie. */
export async function endSession(): Promise<void> {
  const raw = cookies().get(AFFILIATE_COOKIE)?.value
  if (raw) { try { await createServiceClient().from('affiliate_sessions').delete().eq('token_hash', tokenHash(raw)) } catch {} }
  cookies().delete(AFFILIATE_COOKIE)
}
