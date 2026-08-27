import { NextResponse } from 'next/server'
import { createHash, randomInt } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, extensionOtpEmail, emailConfigured } from '@/lib/email'

export const runtime = 'nodejs'

const TTL_MIN = 10
const COOLDOWN_S = 30

const hashCode = (email: string, code: string) =>
  createHash('sha256').update(`${email.toLowerCase()}:${code}`).digest('hex')

/**
 * Richiede un codice OTP per il login dell'estensione.
 * Per non rivelare quali email esistono, la risposta è sempre la stessa:
 * il codice viene inviato solo se l'account esiste davvero.
 */
export async function POST(req: Request) {
  const { email: raw } = (await req.json().catch(() => ({}))) as { email?: string }
  const email = String(raw || '').trim().toLowerCase()
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email non valida' }, { status: 400 })

  if (!(await emailConfigured())) {
    return NextResponse.json({ error: 'Invio email non configurato' }, { status: 503 })
  }

  const sc = createServiceClient()

  // Anti-spam: un codice ogni 30 secondi per email.
  const { data: last } = await sc.from('extension_otp')
    .select('created_at').eq('email', email).eq('purpose', 'extension')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (last?.created_at && Date.now() - new Date(last.created_at as string).getTime() < COOLDOWN_S * 1000) {
    return NextResponse.json({ error: 'Hai già richiesto un codice: attendi qualche secondo.' }, { status: 429 })
  }

  const { data: prof } = await sc.from('profiles').select('id').ilike('email', email).maybeSingle()
  if (prof) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    // Invalida i codici precedenti ancora validi per questa email.
    await sc.from('extension_otp').update({ used_at: new Date().toISOString() })
      .eq('email', email).eq('purpose', 'extension').is('used_at', null)
    await sc.from('extension_otp').insert({
      email, purpose: 'extension', code_hash: hashCode(email, code),
      expires_at: new Date(Date.now() + TTL_MIN * 60_000).toISOString(),
    })
    const { subject, html } = extensionOtpEmail(code)
    await sendEmail({ to: email, subject, html })
  }

  return NextResponse.json({ ok: true, ttlMinutes: TTL_MIN })
}
