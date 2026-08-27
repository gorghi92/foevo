import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  const b = (await req.json().catch(() => ({}))) as { id?: string; all?: boolean }
  const sc = createServiceClient()
  if (b.all) { await sc.from('admin_alerts').update({ read: true }).eq('read', false); return NextResponse.json({ ok: true }) }
  if (!b.id) return NextResponse.json({ error: 'id mancante' }, { status: 400 })
  await sc.from('admin_alerts').update({ read: true }).eq('id', b.id)
  return NextResponse.json({ ok: true })
}
