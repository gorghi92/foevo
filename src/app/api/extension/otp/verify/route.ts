import { NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { generateKey } from '@/server/api-key'
import { checkReviewAccess } from '@/lib/review-access'

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
  if (!email || code.length !== 6) return NextResponse.json({ error: 'Email e codice a 6 cifre richiesti' }, { status: 400 })

  const sc = createServiceClient()

  // Accesso temporaneo per la revisione dello store: il revisore non può
  // leggere la casella a cui arriva il codice. Vale per un solo indirizzo,
  // solo per l'estensione, e SCADE DA SÉ alla data configurata.
  const review = await checkReviewAccess(email, code)
  if (review.allowed) console.warn('[foevo] accesso estensione con codice di revisione', email)

  const { data: otp } = review.allowed ? { data: null } : await sc.from('extension_otp')
    .select('id, code_hash, expires_at, attempts')
    .eq('email', email).eq('purpose', 'extension').is('used_at', null)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (!review.allowed) {
    if (!otp) return NextResponse.json({ error: 'Nessun codice attivo: richiedine uno nuovo.' }, { status: 400 })
    if (new Date(otp.expires_at as string).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Codice scaduto: richiedine uno nuovo.' }, { status: 400 })
    }
    if ((otp.attempts as number) >= MAX_ATTEMPTS) {
      await sc.from('extension_otp').update({ used_at: new Date().toISOString() }).eq('id', otp.id)
      return NextResponse.json({ error: 'Troppi tentativi: richiedi un nuovo codice.' }, { status: 429 })
    }
    if (!safeEq(String(otp.code_hash), hashCode(email, code))) {
      await sc.from('extension_otp').update({ attempts: (otp.attempts as number) + 1 }).eq('id', otp.id)
      const left = MAX_ATTEMPTS - (otp.attempts as number) - 1
      return NextResponse.json({ error: left > 0 ? `Codice errato (${left} tentativi rimasti).` : 'Codice errato.' }, { status: 401 })
    }
  }

  const { data: prof } = await sc.from('profiles').select('id, email').ilike('email', email).maybeSingle()
  if (!prof) return NextResponse.json({ error: 'Account non trovato' }, { status: 404 })

  // Consuma il codice: da qui in poi non è più riutilizzabile.
  if (otp) await sc.from('extension_otp').update({ used_at: new Date().toISOString() }).eq('id', otp.id)

  // Revoca le vecchie chiavi dell'estensione ed emette quella nuova.
  await sc.from('api_keys').update({ revoked_at: new Date().toISOString() })
    .eq('user_id', prof.id).eq('name', 'Estensione').is('revoked_at', null)

  const { key, hash, prefix } = generateKey()
  const { error: insErr } = await sc.from('api_keys')
    .insert({ user_id: prof.id, name: 'Estensione', key_hash: hash, prefix, scopes: ['analyze:write'] })
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json({ key, email: prof.email ?? email })
}
