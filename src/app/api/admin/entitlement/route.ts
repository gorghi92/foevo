import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const admin = await getUser()
  if (!isSuperadmin(admin?.email)) return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  const b = (await req.json().catch(() => ({}))) as any
  const email = String(b?.email || '').trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'email richiesta' }, { status: 400 })

  const sc = createServiceClient()
  const { data: prof } = await sc.from('profiles').select('id').eq('email', email).maybeSingle()
  if (!prof) return NextResponse.json({ error: 'Nessun utente con questa email' }, { status: 404 })

  const { error } = await sc.from('entitlements').upsert({
    user_id: prof.id,
    tier: b.tier === 'premium' ? 'premium' : 'base',
    monthly_quota: Number(b.monthly_quota ?? 0),
    unlimited: !!b.unlimited,
    status: 'active', source: 'manual', updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
