import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'

export const runtime = 'nodejs'

async function guard() {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) return { ok: false as const, user }
  return { ok: true as const, user }
}

/** Crea un utente (passwordless: confermato, accede via magic link). */
export async function POST(req: Request) {
  const g = await guard()
  if (!g.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  const { email, tier } = (await req.json().catch(() => ({}))) as { email?: string; tier?: string }
  if (!email) return NextResponse.json({ error: 'Email richiesta' }, { status: 400 })

  const sc = createServiceClient()
  const { data, error } = await sc.auth.admin.createUser({ email, email_confirm: true })
  if (error || !data.user) return NextResponse.json({ error: error?.message || 'Errore creazione' }, { status: 400 })

  if (tier === 'premium' || tier === 'base') {
    const { data: pkg } = await sc.from('packages').select('id, monthly_quota, unlimited').eq('slug', tier).maybeSingle()
    await sc.from('entitlements').upsert({
      user_id: data.user.id, package_id: pkg?.id ?? null, tier,
      monthly_quota: pkg?.monthly_quota ?? (tier === 'premium' ? 150 : 30), unlimited: pkg?.unlimited ?? false,
      status: 'active', source: 'manual', updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }
  return NextResponse.json({ id: data.user.id, email: data.user.email })
}

/** Elimina un utente (e a cascata i suoi dati). */
export async function DELETE(req: Request) {
  const g = await guard()
  if (!g.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  const { userId } = (await req.json().catch(() => ({}))) as { userId?: string }
  if (!userId) return NextResponse.json({ error: 'userId richiesto' }, { status: 400 })
  if (userId === g.user?.id) return NextResponse.json({ error: 'Non puoi eliminare il tuo account' }, { status: 400 })

  const sc = createServiceClient()
  const { error } = await sc.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
