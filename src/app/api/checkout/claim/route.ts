import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Chiamata (in polling) dalla pagina di ritorno del checkout per il flusso
 * pay-first non autenticato. Apre la sessione SOLO quando esiste già un account
 * per l'email inserita con un entitlement Whop attivo — cioè a pagamento
 * confermato (l'account e l'entitlement li crea il webhook). Nessun login se il
 * pagamento non è confermato.
 */
export async function POST() {
  const jar = cookies()
  const raw = jar.get('fv_signup')?.value
  if (!raw) return NextResponse.json({ status: 'no_session' })
  let info: { email?: string } = {}
  try { info = JSON.parse(raw) } catch { return NextResponse.json({ status: 'no_session' }) }
  const email = String(info.email || '').trim().toLowerCase()
  if (!email) return NextResponse.json({ status: 'no_session' })

  const sc = createServiceClient()
  const { data: prof } = await sc.from('profiles').select('id').ilike('email', email).maybeSingle()
  if (!prof) return NextResponse.json({ status: 'pending' }) // il webhook non ha ancora creato l'account

  const { data: ent } = await sc.from('entitlements')
    .select('status, source').eq('user_id', prof.id).maybeSingle()
  const paid = ent?.status === 'active' && ent?.source === 'whop'
  if (!paid) return NextResponse.json({ status: 'pending' }) // pagamento non ancora confermato

  // Pagamento confermato → apri la sessione senza email e pulisci il cookie.
  const { data: link, error } = await sc.auth.admin.generateLink({ type: 'magiclink', email })
  const tokenHash = (link as any)?.properties?.hashed_token as string | undefined
  if (error || !tokenHash) return NextResponse.json({ status: 'pending' })

  const supa = createClient()
  const { error: vErr } = await supa.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
  if (vErr) return NextResponse.json({ status: 'pending' })

  jar.delete('fv_signup')
  return NextResponse.json({ status: 'ok' })
}
