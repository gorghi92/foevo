import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'

export const runtime = 'nodejs'

/** Imposta o rimuove l'override percentuale di un singolo affiliato. */
export async function POST(req: Request) {
  const user = await getUser()
  if (!isSuperadmin(user?.email)) return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  const b = (await req.json().catch(() => ({}))) as { id?: string; pct?: number | null }
  if (!b.id) return NextResponse.json({ error: 'id mancante' }, { status: 400 })

  // pct null/'' → rimuove l'override (torna al default per piano)
  const override = b.pct == null || b.pct === ('' as any)
    ? null
    : Math.max(0, Math.min(10000, Math.round(Number(b.pct) * 100)))

  const { error } = await createServiceClient().from('affiliates')
    .update({ commission_override_bps: override, updated_at: new Date().toISOString() }).eq('id', b.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, overrideBps: override })
}
