import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Registrazione senza attrito: crea l'account (email già confermata) e apre la
 * sessione lato server, così l'utente prosegue subito verso il pagamento senza
 * dover aprire un link email. Resta passwordless.
 *
 * Sicurezza: se l'email è già registrata NON facciamo auto-login (sarebbe un
 * takeover) — segnaliamo `exists` e il client invia un magic link di verifica.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; firstName?: string; lastName?: string }
  const email = String(body.email || '').trim().toLowerCase()
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email non valida' }, { status: 400 })
  const full_name = `${body.firstName || ''} ${body.lastName || ''}`.trim()

  const sc = createServiceClient()

  // Account già esistente → niente auto-login: verifica di proprietà via magic link.
  const { data: existing } = await sc.from('profiles').select('id').ilike('email', email).maybeSingle()
  if (existing) return NextResponse.json({ exists: true })

  const { data: created, error } = await sc.auth.admin.createUser({
    email, email_confirm: true,
    user_metadata: { full_name, first_name: body.firstName || '', last_name: body.lastName || '' },
  })
  if (error || !created?.user) {
    // Probabile race/duplicato: ripiega sul magic link.
    return NextResponse.json({ exists: true })
  }

  try { await sc.from('profiles').upsert({ id: created.user.id, email, full_name }, { onConflict: 'id' }) } catch { /* il profilo può arrivare via trigger */ }

  // Apre la sessione senza inviare email: genera il token e verificalo lato server.
  const { data: link, error: lErr } = await sc.auth.admin.generateLink({ type: 'magiclink', email })
  const tokenHash = (link as any)?.properties?.hashed_token as string | undefined
  if (lErr || !tokenHash) return NextResponse.json({ error: lErr?.message || 'Impossibile aprire la sessione' }, { status: 500 })

  const supa = createClient()
  const { error: vErr } = await supa.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
