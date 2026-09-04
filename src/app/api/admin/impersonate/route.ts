import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUser, createClient, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { m } from '@/lib/i18n/api'

export const runtime = 'nodejs'

/** Impersonifica un utente: salva la sessione del superadmin, poi apre una
 *  sessione come l'utente target. Il ritorno avviene via /impersonate/stop. */
export async function POST(req: Request) {
  const admin = await getUser()
  if (!isSuperadmin(admin?.email)) return NextResponse.json({ error: m('notAuthorized') }, { status: 403 })

  const { userId } = (await req.json().catch(() => ({}))) as { userId?: string }
  if (!userId) return NextResponse.json({ error: m('missingUserId') }, { status: 400 })

  const sc = createServiceClient()
  const { data: prof } = await sc.from('profiles').select('email').eq('id', userId).maybeSingle()
  const targetEmail = prof?.email as string | undefined
  if (!targetEmail) return NextResponse.json({ error: m('userNotFound') }, { status: 404 })

  const supa = createClient()
  const { data: { session } } = await supa.auth.getSession()
  const jar = cookies()
  if (session) {
    jar.set('imp_admin', JSON.stringify({ at: session.access_token, rt: session.refresh_token }), {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60,
    })
  }

  const { data: link, error } = await sc.auth.admin.generateLink({ type: 'magiclink', email: targetEmail })
  const tokenHash = (link as any)?.properties?.hashed_token
  if (error || !tokenHash) return NextResponse.json({ error: error?.message || 'Impossibile generare la sessione' }, { status: 400 })

  const { error: vErr } = await supa.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 400 })

  jar.set('imp_active', targetEmail, { httpOnly: false, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 })
  return NextResponse.json({ ok: true, email: targetEmail })
}
