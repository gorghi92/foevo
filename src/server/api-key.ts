import { createHash, randomBytes } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { consume, ipKey } from '@/lib/rate-limit'
import { m } from '@/lib/i18n/api'

/** Programmatic access keys for the Chrome extension. Only the SHA-256 hash is stored. */
const PREFIX = 'fv_'

export function generateKey() {
  const secret = randomBytes(24).toString('base64url')
  const key = `${PREFIX}${secret}`
  return { key, hash: createHash('sha256').update(key).digest('hex'), prefix: key.slice(0, 11) }
}
export function fingerprint(key: string) {
  return createHash('sha256').update(key).digest('hex')
}

export type Auth =
  | { ok: true; userId: string; keyId: string }
  | { ok: false; status: number; error: string }

/**
 * Conta solo i tentativi FALLITI: chi ha una chiave valida non paga il costo di
 * una scrittura in più a ogni chiamata, mentre chi tira a indovinare esaurisce
 * il budget in fretta. Il segreto ha 24 byte casuali, quindi indovinarlo è già
 * fuori portata; questo evita che ci provino comunque a spese nostre.
 */
async function tooManyFailures(req: Request): Promise<boolean> {
  const verdict = await consume([
    { bucket: 'apikey-fail-ip', key: ipKey(req), windowSeconds: 900, max: 30 },
  ])
  return !verdict.ok
}

export async function authenticate(req: Request): Promise<Auth> {
  const header = req.headers.get('authorization') ?? ''
  const key = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
  if (!key || !key.startsWith(PREFIX)) {
    if (await tooManyFailures(req)) return { ok: false, status: 429, error: m('tooManyRequests', undefined, req) }
    return { ok: false, status: 401, error: m('apiKeyMissing', undefined, req) }
  }
  const sc = createServiceClient()
  const { data } = await sc
    .from('api_keys')
    .select('id, user_id, revoked_at, expires_at')
    .eq('key_hash', fingerprint(key))
    .maybeSingle()
  if (!data) {
    if (await tooManyFailures(req)) return { ok: false, status: 429, error: m('tooManyRequests', undefined, req) }
    return { ok: false, status: 401, error: m('apiKeyInvalid', undefined, req) }
  }
  if (data.revoked_at) return { ok: false, status: 401, error: m('apiKeyRevoked', undefined, req) }
  if (data.expires_at && new Date(data.expires_at as string).getTime() < Date.now()) {
    return { ok: false, status: 401, error: m('apiKeyExpired', undefined, req) }
  }
  void sc.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)
  return { ok: true, userId: data.user_id as string, keyId: data.id as string }
}

export async function withKey(
  req: Request,
  work: (ctx: { userId: string; keyId: string }) => Promise<Response>,
): Promise<Response> {
  const auth = await authenticate(req)
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  try {
    return await work({ userId: auth.userId, keyId: auth.keyId })
  } catch (e) {
    console.error('[foevo] errore non gestito su rotta con API key', e)
    return Response.json({ error: m('internalError', undefined, req) }, { status: 500 })
  }
}
