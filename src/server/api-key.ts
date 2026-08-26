import { createHash, randomBytes } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

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

export async function authenticate(req: Request): Promise<Auth> {
  const header = req.headers.get('authorization') ?? ''
  const key = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
  if (!key || !key.startsWith(PREFIX)) {
    return { ok: false, status: 401, error: 'Chiave mancante. Usa: Authorization: Bearer fv_...' }
  }
  const sc = createServiceClient()
  const { data } = await sc
    .from('api_keys')
    .select('id, user_id, revoked_at, expires_at')
    .eq('key_hash', fingerprint(key))
    .maybeSingle()
  if (!data) return { ok: false, status: 401, error: 'Chiave non valida' }
  if (data.revoked_at) return { ok: false, status: 401, error: 'Chiave revocata' }
  if (data.expires_at && new Date(data.expires_at as string).getTime() < Date.now()) {
    return { ok: false, status: 401, error: 'Chiave scaduta' }
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
    return Response.json({ error: e instanceof Error ? e.message : 'Errore interno' }, { status: 500 })
  }
}
