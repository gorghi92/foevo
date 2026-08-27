import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  const b = (await req.json().catch(() => ({}))) as { id?: string; status?: string }
  if (!b.id || !['active', 'suspended'].includes(String(b.status))) {
    return NextResponse.json({ error: 'Parametri non validi' }, { status: 400 })
  }
  const sc = createServiceClient()
  const { error } = await sc.from('affiliates')
    .update({ status: b.status, updated_at: new Date().toISOString() }).eq('id', b.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Sospendendo, invalida le sessioni attive.
  if (b.status === 'suspended') await sc.from('affiliate_sessions').delete().eq('affiliate_id', b.id)
  return NextResponse.json({ ok: true })
}
