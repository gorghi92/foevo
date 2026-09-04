import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'
import { m } from '@/lib/i18n/api'

export const runtime = 'nodejs'

/** Elimina una qualsiasi analisi (superadmin). */
export async function DELETE(req: Request) {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) return NextResponse.json({ error: m('notAuthorized') }, { status: 403 })
  const { id } = (await req.json().catch(() => ({}))) as { id?: string }
  if (!id) return NextResponse.json({ error: m('missingIdRequired') }, { status: 400 })
  const { error } = await createServiceClient().from('analyses').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
